---
name: opennext-cloudflare-deploy
description: >-
  ai.jurepi.kr를 Cloudflare Workers에 OpenNext로 배포하는 방법. 정적 익스포트(apps.jurepi.kr)와 달리
  ai.jurepi.kr는 서버가 필요해 @opennextjs/cloudflare 어댑터로 Node 런타임 활성화.
  open-next.config.ts·wrangler.jsonc·nodejs_compat 플래그·KV 바인딩(rate-limit)·시크릿 격리(GEMINI_API_KEY),
  로컬 프리뷰·배포 트리거(git push main)·배포본 검증(API 응답·시크릿 누출 확인)을 다룬다.
  "OpenNext/Workers 배포/deploy/wrangler/Cloudflare/AI 서버/route handler/api 루트/배포 실패/
  시크릿이 프로덕션에 안 들어감/KV 바인딩/nodejs_compat/서버 런타임/API가 안 됨" 같은 표현에 반드시 사용하라.
---

# OpenNext Cloudflare Workers 배포 — ai.jurepi.kr 서버 배포

이 스킬은 ai.jurepi.kr를 **Cloudflare Workers + OpenNext**로 배포하는 절차다. 핵심 차이: **apps.jurepi.kr는 정적 에셋(assets-only Worker)이지만 ai.jurepi.kr는 서버다.** 이 허브는 `/api/**` 라우트 핸들러(route handlers)에서 AI 모델을 호출하고 시크릿(API 키)을 보관해야 하므로 OpenNext(`@opennextjs/cloudflare`)의 Node 호환 Worker 런타임이 필요하다.

**가장 중요한 원리: `next build` 그린 ≠ 배포 정상. 정적 익스포트에서 실패하던 것들이 여긴 또 다르게 깬다.** (예: nodejs_compat 미설정 → Worker 크래시 시 프리뷰는 정상, 배포는 500 에러; KV 바인딩 누락 → 메모리 폴백이라 로컬은 정상, 배포 재시작 후 rate-limit이 리셋되거나 다중 인스턴스 간 누수). 끝은 항상 **배포본 직접 검증**이다.

## ✅ 현재 배포 경로 (2026-07-17) — Cloudflare **Workers Builds** + **OpenNext**

`main` push → CF Workers Builds가 `opennextjs-cloudflare build` + `wrangler deploy` 자동 실행 → 라이브 `https://ai.jurepi.kr`. 아래 절들의 원리(config·시크릿·KV·런타임 체크)는 모두 유효하고, **커밋된 설정 + env 변수로** 배포 파이프라인을 제어한다.

> ### 🚀 배포 트리거 = `git push` (프로덕션 분기 `main`)
> **배포는 `main`에 push하면 끝난다.** CF Workers Builds(Git 연동)가 `wrangler.jsonc` + env 변수를 읽어 OpenNext 빌드 + Worker 배포를 **CF 파이프라인 안에서** 자동 실행한다. 개발자/에이전트가 할 일: ① 변경을 `main`에 머지 → ② push → ③ CF 빌드 완료(1~3분) 대기 → ④ 실제 도메인 curl 검증. 로컬 사전검증은 `pnpm dev` (또는 `wrangler dev`).

## 사전 점검 (현 상태)

배포 작업 전 현재 레포 상태를 확인한다:

- `next.config.ts`: `output` 설정 없음(정상 — 서버이므로 export 금지). `images.unoptimized` 불필요(서버에서 최적화).
- `src/app/api/**` route handlers 존재함(분석·추천 엔드포인트) → 정상.
- `.env.local`에 `GEMINI_API_KEY` 있음(로컬만, 배포는 CF 시크릿) → 정상.
- `wrangler.jsonc` 없음 → 신설 필요(OpenNext 서버 진입점).
- `open-next.config.ts` 없음 → 신설 필요.
- `nodejs_compat` 설정 없음 → wrangler에 추가 필요.

> 항상 실제 파일을 다시 읽어 위 가정이 유효한지 확인한 뒤 진행한다. 가정이 바뀌었으면(예: route handler 추가됨) 매핑을 갱신한다.

## 핵심 원리 3가지 (apps.jurepi.kr와의 차이)

### 1. 정적 익스포트 금지 — 서버 런타임 활성화

```ts
// ❌ 절대 금지 (apps.jurepi.kr 패턴)
export const dynamic = 'export';  // 이렇게 하면 route handlers 무시됨

// ✅ 정상 (ai.jurepi.kr 패턴)
// → 출력 설정 없음. route handlers가 on-demand로 실행됨.
```

`/api/**` route handlers는 OpenNext Worker 런타임에서 **on-demand로** 실행된다. 이 기능을 죽이지 않으려면 `output: 'export'`를 절대 쓰면 안 된다.

### 2. OpenNext 설정 — Worker 진입점 + Node 호환 플래그

OpenNext는 Next.js를 Cloudflare Worker(serverless edge 런타임)에 맞춰준다. 설정이 없으면 wrangler는 OpenNext를 자동 전환하지 않고, 정적 에셋 혹은 불완전한 SSR 설정으로 배포된다.

**`open-next.config.ts` (repo 루트):**

```ts
import type { OpenNextConfig } from '@opennextjs/cloudflare';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',  // Node compat 래퍼
      converter: 'cloudflare',     // CF Workers 런타임 변환
    },
  },
};

export default config;
```

이 설정이 없으면 OpenNext가 감지 불가능해 정적 에셋 모드로 폴백 → `/api/hairstyle/analyze` 같은 route handler가 빌드되지 않는다(실제 발생 가능).

**`wrangler.jsonc` (repo 루트):**

```jsonc
{
  "$schema": "https://json.schemastore.org/wrangler.json",
  "name": "ai-jurepi-kr",                    // CF 워커 이름
  "main": ".opennext/worker.js",            // OpenNext 출력(빌드 산물)
  "compatibility_date": "2025-07-01",
  "compatibility_flags": ["nodejs_compat"],  // 중요: Node.js API 지원
  "kv_namespaces": [
    { "binding": "RATE_LIMIT_KV", "id": "rate-limit-ns-id", "preview_id": "preview-ns-id" }
  ],
  "vars": {
    "AI_PROVIDER": "gemini",
    "HAIRSTYLE_RATE_LIMIT_PER_MIN": "10"
  }
}
```

**핵심:**
- `main`: OpenNext가 `.opennext/worker.js`(빌드 산물)를 생성. 이를 wrangler의 진입점으로 지정.
- `compatibility_flags: ["nodejs_compat"]`: **필수.** Node.js `require()` 등을 Edge 런타임에서 활성화. 누락 → `require is not defined` Worker 크래시.
- `kv_namespaces`: rate-limit용 KV 바인딩(선택). 누락해도 per-isolate 메모리 폴백.
- `vars`: env 변수(public). `NEXT_PUBLIC_*` 아닌 것도 Workers에선 모두 runtime-available. (`GEMINI_API_KEY`는 별도 secrets로 처리.)

### 3. 시크릿 격리 — GEMINI_API_KEY는 `wrangler secret put`

API 키는 절대 코드·env 파일·wrangler.jsonc에 적으면 안 된다.

```bash
# CF 대시보드 또는 CLI로
wrangler secret put GEMINI_API_KEY
# 프롬프트에서 값 입력 (hidden)
```

route handler 내에서:

```ts
export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: { code: 'AI_UNAVAILABLE', message: '...' } }, { status: 502 });
  }
  // ...
}
```

**절대 하면 안 되는 것:**
- `NEXT_PUBLIC_GEMINI_API_KEY` (브라우저 번들에 인라인됨)
- `.env` 커밋 (git history에 영구 노출)
- `wrangler secret put` 없이 CF 대시보드 직접 입력 후 `.env.production`에 가짜값 둠 (배포 시크릿 미동기 → API 호출 실패)

## 배포 체크리스트 (순서 중요)

### 1. OpenNext + wrangler 설정 신설 또는 검증

- [ ] `open-next.config.ts` 존재, `wrapper: 'cloudflare-node'` + `converter: 'cloudflare'`
- [ ] `wrangler.jsonc` 존재, `main: '.opennext/worker.js'`, `compatibility_flags: ['nodejs_compat']`
- [ ] `nodejs_compat` flag 있음 (없으면 `require` 크래시)
- [ ] KV 바인딩 (선택): `RATE_LIMIT_KV` id/preview_id 일치 확인

### 2. 환경 변수 관리

**로컬 개발 (`.env.local`, gitignored):**
```
GEMINI_API_KEY=<실제 API 키>
AI_PROVIDER=gemini
```

**배포 (CF Workers Builds env):**
- [ ] `GEMINI_API_KEY` = CF dashboard Secret (hidden)
- [ ] `AI_PROVIDER` = "gemini" (또는 wrangler.jsonc `vars`)
- [ ] `HAIRSTYLE_RATE_LIMIT_PER_MIN` = "10" (선택)

### 3. 빌드 검증

```bash
pnpm run build        # next build
# 다음 산출물 확인:
ls .opennext/         # worker.js 있음
ls .opennext/dist/    # server/client 번들
file .opennext/worker.js  # ELF 바이너리 아니라 JS 텍스트 파일
grep "api/hairstyle" .opennext/server/*.js  # route handler 포함 확인
```

route handler가 번들에 포함되는지 반드시 확인한다(누락 → 배포 후 `/api/hairstyle/analyze` 404).

### 4. 로컬 프리뷰

```bash
wrangler dev       # localhost:8787 (또는 지정 포트)
```

프리뷰에서:
```bash
curl -X POST http://localhost:8787/api/hairstyle/analyze \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,...","locale":"ko"}'
# {"ok":true,"data":{...}} 또는 {"ok":false,"error":{...}}
```

404 → route handler 누락. 500 → GEMINI_API_KEY 미설정. 정상 → 배포 준비 완료.

### 5. 배포

```bash
git add .
git commit -m "feat: add OpenNext config for Workers deployment"
git push origin main
```

CF Workers Builds 파이프라인 시작 (수십 초~3분). 진행 상황:
- CF 대시보드 → Workers Builds → 해당 프로젝트 → Deployments 탭
- 또는 터미널에서: `wrangler publish --dry-run` (로컬에서 사전 검증)

## 배포본 검증 게이트 (비타협)

배포 후 **실제 HTTP 응답**으로 확인한다:

```bash
BASE=https://ai.jurepi.kr    # 또는 프리뷰 URL

# 1. API 엔드포인트 응답 확인
curl -X POST "$BASE/api/hairstyle/analyze" \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,/9j/4A...","locale":"ko"}' \
  -w '\n%{http_code}\n'
# 200 + JSON 응답 (또는 422 NO_FACE_DETECTED, 413 IMAGE_TOO_LARGE 등)
# ≠ 404 (route handler 없음) ≠ 502 (API 키 미설정)

# 2. 시크릿 누출 확인 — 응답 body나 소스에 API 키 없음
curl "$BASE/api/hairstyle/recommend" \
  -H "Content-Type: application/json" \
  -d '{"faceShape":"oval","preference":"neutral"}' | grep -i "AIzaSy"   # API 키 prefix (있으면 누출!)

# 3. 클라이언트 번들 검증 — 시크릿 포함 안 됨
curl -s "$BASE/" | grep -i "GEMINI_API_KEY"  # 있으면 안 됨
curl -s "$BASE/_next/static/**/*.js" | grep -i "AIzaSy" | head -1   # 있으면 안 됨

# 4. rate-limit 작동 확인 (선택)
for i in {1..15}; do
  curl -X POST "$BASE/api/hairstyle/analyze" ... &
done
wait
# 10번째 이후는 429 RATE_LIMITED 응답
```

- [ ] `/api/hairstyle/analyze` 200 (정상 응답 또는 비즈니스 에러 코드)
- [ ] `/api/hairstyle/recommend` 200 + JSON
- [ ] 응답 body에 `AIzaSy...` (API 키) 없음
- [ ] 클라이언트 번들(`_next/static/`)에 `GEMINI_API_KEY` 문자열 없음
- [ ] Rate-limit KV 바인딩 있으면, 초과 시 429

실패하면 **배포 완료가 아니다.** `references/troubleshooting-opennext.md`로.

## 라이브 감시 (배포 후 첫 시간)

- [ ] 배포 후 실제 사용자/에이전트가 `/api/**`를 호출해도 5xx 미발생
- [ ] CF 대시보드 Workers → Tail 탭에서 로그 모니터링 (에러 없음)
- [ ] 도구 페이지(`/ko/tools/hairstyle-recommendation`)가 빨간 에러 boundary 없이 정상 렌더
- [ ] rate-limit이 작동하고 쿨다운 메시지가 보임

## 비타협 원칙

- **OpenNext 설정 필수** — 없으면 route handlers 사라짐.
- **nodejs_compat flag 필수** — 없으면 Worker 크래시.
- **시크릿 격리** — GEMINI_API_KEY는 `wrangler secret put`, 절대 env 파일 아님.
- **배포본 검증** — curl로 API 응답 + 시크릿 누출 확인.
- **KV 선택이지만 고려** — rate-limit 공유를 원하면 KV 바인딩; 없으면 per-isolate 메모리(재시작 시 리셋).
- **모르면 문서로** — OpenNext/Cloudflare Workers 동작은 버전마다 다르다. Context7/공식 문서로 확인.
