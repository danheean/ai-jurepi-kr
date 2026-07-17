# OpenNext 배포 런북 — 스텝별 실행 가이드

## 0. 사전 준비

```bash
# 1. 필요한 패키지 설치
pnpm add -D @opennextjs/cloudflare wrangler

# 2. Cloudflare 인증
wrangler login
```

## 1. 설정 파일 생성

### `open-next.config.ts` (repo 루트)

```ts
import type { OpenNextConfig } from '@opennextjs/cloudflare';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'cloudflare',
    },
  },
};

export default config;
```

### `wrangler.jsonc` (repo 루트)

```jsonc
{
  "$schema": "https://json.schemastore.org/wrangler.json",
  "name": "ai-jurepi-kr",
  "main": ".opennext/worker.js",
  "compatibility_date": "2025-07-01",
  "compatibility_flags": ["nodejs_compat"],  // 필수!
  
  // KV 바인딩 (rate-limit용, 선택)
  "kv_namespaces": [
    {
      "binding": "RATE_LIMIT_KV",
      "id": "YOUR_KV_ID",           // CF 대시보드에서 확인
      "preview_id": "YOUR_PREVIEW_ID"
    }
  ],
  
  // 공개 변수 (env vars, 비밀이 아닌 것)
  "vars": {
    "AI_PROVIDER": "gemini",
    "HAIRSTYLE_RATE_LIMIT_PER_MIN": "10"
  }
}
```

**KV 네임스페이스 조회:**

```bash
wrangler kv:namespace list
# 출력에서 id, preview_id 복사해 wrangler.jsonc에 붙임
```

## 2. 시크릿 설정 (CF 대시보드 또는 CLI)

### 방법 A: wrangler CLI (권장)

```bash
wrangler secret put GEMINI_API_KEY
# 프롬프트에서 AIzaSy... 붙여넣음
```

### 방법 B: CF 대시보드

1. dash.cloudflare.com → Workers & Pages → ai-jurepi-kr
2. Settings → Secrets
3. "Add Secret" → Name: `GEMINI_API_KEY`, Value: `AIzaSy...`

## 3. 로컬 빌드 & 테스트

```bash
# OpenNext 빌드 실행
pnpm run build

# 산출물 확인
ls -la .opennext/
# worker.js, server/, client/ 등

# route handler 번들 포함 확인
grep -r "api/hairstyle" .opennext/server/ || echo "ERROR: route handler missing"
```

## 4. 로컬 프리뷰

```bash
# Workers 런타임 에뮬레이션
wrangler dev

# 다른 터미널에서
BASE=http://localhost:8787

# API 테스트
curl -X POST "$BASE/api/hairstyle/recommend" \
  -H "Content-Type: application/json" \
  -d '{"faceShape":"oval"}'

# 예상 응답: {"ok":true,"data":{"recommendations":[...]}}
# 또는: {"ok":false,"error":{"code":"AI_UNAVAILABLE",...}}(키 미설정 시 정상)
```

## 5. 배포

```bash
# 커밋 (wrangler.jsonc, open-next.config.ts)
git add open-next.config.ts wrangler.jsonc
git commit -m "feat: add OpenNext config for Workers deployment"
git push origin main

# CF Workers Builds 자동 배포 시작
# → CF 대시보드 Deployments 탭 모니터링
```

## 6. 배포본 검증

```bash
BASE=https://ai.jurepi.kr

# API 정상 작동 확인
curl -X POST "$BASE/api/hairstyle/recommend" \
  -H "Content-Type: application/json" \
  -d '{"faceShape":"round","preference":"feminine"}' \
  -i   # HTTP 헤더 포함

# 예상: 200 OK + {"ok":true,"data":{...}}

# 시크릿 누출 확인
curl "$BASE/api/hairstyle/recommend" \
  -H "Content-Type: application/json" \
  -d '{}' | grep -i "AIzaSy" && echo "ERROR: Secret leaked!" || echo "OK: No secret"

# 클라이언트 번들 검증 (route handler는 제외, UI 번들만 확인)
curl -s "$BASE/" | grep -i "GEMINI_API_KEY" && echo "ERROR" || echo "OK"
```

## 트러블슈팅

### route handler 404

**증상:** `curl $BASE/api/hairstyle/analyze` → 404

**원인:** 
1. `open-next.config.ts` 없음
2. OpenNext 감지 실패
3. 빌드에서 route handler 누락

**해결:**
```bash
# 로컬 빌드 확인
grep -r "POST.*analyze" .opennext/server/
# 없으면 src/app/api/hairstyle/route.ts 확인

# wrangler.jsonc의 main이 정확한지 확인
cat wrangler.jsonc | grep main
# "main": ".opennext/worker.js" 맞는지
```

### 시크릿 에러 (502 AI_UNAVAILABLE)

**증상:** API는 200 응답하지만 `"code":"AI_UNAVAILABLE"`

**원인:** GEMINI_API_KEY 미설정

**해결:**
```bash
wrangler secret put GEMINI_API_KEY
# 값 입력 후 재배포
```

### nodejs_compat 누락

**증상:** Worker 크래시, "require is not defined"

**해결:**
```jsonc
// wrangler.jsonc
"compatibility_flags": ["nodejs_compat"]
```

### KV 바인딩 안 됨

**증상:** rate-limit이 작동하지 않음 (per-isolate 메모리 폴백)

**해결:**
```bash
wrangler kv:namespace list
# id, preview_id 복사
# wrangler.jsonc kv_namespaces 업데이트
wrangler deploy
```

## 배포 후 체크리스트

- [ ] `/api/hairstyle/analyze` 200
- [ ] `/api/hairstyle/recommend` 200
- [ ] 응답에 API 키 없음
- [ ] 브라우저 번들에 `GEMINI_API_KEY` 없음
- [ ] rate-limit 작동 (초과 시 429)
- [ ] CF 대시보드 Tail 탭에서 에러 없음
- [ ] 도구 페이지 렌더링 정상
