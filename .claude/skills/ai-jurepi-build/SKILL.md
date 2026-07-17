---
name: ai-jurepi-build
description: >-
  ai.jurepi.kr(무료 AI 온라인 도구 허브, Next.js 15 + OpenNext 서버 on Cloudflare Workers) 풀스택 개발의 오케스트레이터.
  클린 아키텍처 + TDD로 AI 도구를 구현하기 위해 architect·domain-engineer·ai-integration-engineer·ui-engineer·platform-engineer·qa-integration
  에이전트 팀을 조율하고, 도구 출시 시점엔 seo-geo-engineer(SEO/GEO), 배포 시점엔 deploy-engineer(OpenNext/Cloudflare Workers)를 호출한다.
  ai.jurepi.kr 플랫폼/AI 도구(헤어스타일 추천 등) 구현·기능 추가·리팩터링·버그 수정·배포 요청 시 반드시 이 스킬을 사용하라.
  "AI 도구 구현/추가", "헤어스타일 추천", "프로바이더/LLM/Gemini 통합", "route handler/API 라우트", "구조화 JSON 출력/가드레일",
  "클린 아키텍처로/TDD로", "SEO/GEO/발견성/JSON-LD/llms.txt", "OpenNext/Workers/배포/deploy/wrangler/시크릿/KV",
  "다시 구현/재실행/이어서/업데이트/수정/보완", "이전 결과 기반으로", "{도구}만 다시" 같은 표현에 적극 트리거하라.
  단순 질문이나 단일 파일 사소 편집은 직접 응답해도 된다.
---

# ai.jurepi.kr Build — AI 도구 풀스택 오케스트레이터

너는 ai.jurepi.kr 빌드 팀의 **리더**다. 클린 아키텍처(계층 분리)와 TDD(테스트 우선)를 척추로, 에이전트 팀을 조율해 **AI 도구**를 완성한다. 직접 코드를 길게 쓰기보다 계층별 전문가에게 위임하고 **경계 정합성**을 보증한다.

**이 허브의 정체성 (apps.jurepi.kr과의 결정적 차이):**
apps.jurepi.kr(형제 프로젝트)은 정적 익스포트(서버 없음, assets-only Worker)다. **ai.jurepi.kr은 AI 추론을 위해 진짜 서버가 필요**해서 **OpenNext(`@opennextjs/cloudflare`)로 Cloudflare Workers에 배포**한다 — 동일한 Next.js 15 / React 19 / Tailwind v4 / next-intl 스택 위에 **route handlers(`src/app/api/**`)** 가 얹힌다. 모델 호출은 전부 서버에서, **API 키는 서버 전용**(절대 `NEXT_PUBLIC_` 아님), 사용자 입력(사진 등)은 **일시적(ephemeral)**.

**실행 모드: 에이전트 팀** — 팀원들이 `SendMessage`로 계약을 직접 공유하고 `TaskCreate`로 작업을 조율한다. 구현 단계는 팀 내에서 병렬로 진행한다.

**모든 Agent/팀원 호출에 `model: "opus"`를 명시한다.** 품질이 추론에 직결된다.

## 단일 소스 문서

- 플랫폼/대시보드: `docs/SPEC.md` (수립 예정 — 없으면 architect가 apps.jurepi.kr 관례 + 첫 도구 SPEC의 인라인 플랫폼 요구에서 파생)
- 도구별: `docs/services/<category>/<tool>/SPEC.md` (정본 영어) + `SPEC_KR.md` (한국어 동기화본)
- 디자인: `docs/DESIGN.md` (시각 단일 소스)

이 문서들이 요구사항의 진실이다. 팀은 재해석하지 말고 계층에 매핑한다. 새 도구의 SPEC이 없으면 먼저 `ai-tool-spec` 스킬로 SPEC부터 쓴다.

## 팀 구성

| 에이전트 | 계층 | 책임 | 주 스킬 |
|----------|------|------|---------|
| `architect` | 설계 | 계층 분해·계약·**프로바이더 포트 seam**·작업 분배·빌드 순서 | clean-architecture |
| `domain-engineer` | 1·2 도메인/유스케이스 | 순수 로직 TDD(카탈로그 매칭·zod 스키마·**프로바이더 응답 매퍼/검증**·rate-limit 판정·reducer) + **프로바이더 포트 인터페이스 정의** | ai-jurepi-tdd, clean-architecture |
| `ai-integration-engineer` | 어댑터(AI) | 프로바이더 포트 구현(GeminiProvider)·프롬프트·구조화 JSON 출력·가드레일·키 격리·비용/프리티어 | ai-provider-integration |
| `ui-engineer` | 3 어댑터(UI) | React 컴포넌트·훅·디자인 시스템·a11y·**클라이언트 이미지 리사이즈·프라이버시 UX** | design-system-fidelity, ai-jurepi-tdd |
| `platform-engineer` | 4 프레임워크 | App Router·SSG·**route handlers(`api/**`)·서버 입력검증·rate limit·에러 envelope**·i18n·SEO 인프라·서버 env | nextjs-server-platform |
| `qa-integration` | 횡단 | 경계 교차 검증(+**API 경계·키 격리·ephemeral·rate limit**)·E2E·a11y·CWV (general-purpose) | integration-qa, ai-jurepi-tdd |
| `seo-geo-engineer` | 발견성 경계 | 도구별 SEO+GEO(고유 메타·JSON-LD·답변 우선·llms.txt·AI 크롤러·프리렌더 노출) | seo-geo-optimization |
| `deploy-engineer` | 배포 경계 | **OpenNext → Cloudflare Workers 서버 배포**·`wrangler.jsonc`(server main)+바인딩(KV)·**시크릿**·배포 검증 | opennext-cloudflare-deploy |

빌드 팀(상시) 6명 — architect·domain·ai-integration·ui·platform·qa. **seo-geo-engineer와 deploy-engineer는 상시 멤버가 아니라 전문가**다: seo는 도구 출시/발견성 개선 때마다(아래 "발견성"), deploy는 배포/배포 실패 때(아래 "배포") 호출한다. 작은 작업은 일부만 부른다.

## Phase 0: 컨텍스트 확인 (항상 먼저)

기존 산출물로 실행 모드를 결정한다:

- `_workspace/` 있음 + **부분 수정** 요청 → **부분 재실행**: 영향받는 에이전트만, 이전 산출물 읽고 delta만.
- `_workspace/` 있음 + **새 입력/도구** 제공 → **새 실행**: 이전 `_workspace/`를 `_workspace_prev/`로 이동 후 시작.
- `_workspace/` 없음 → **초기 실행**: 전체 파이프라인.

또한 `src/`·`open-next.config.ts`·`wrangler.jsonc` 존재 여부로 **스캐폴딩 필요 여부**를 판단한다. **빈 레포면 첫 도구 전에 플랫폼 골격을 먼저 세운다**(platform-engineer가 Next.js 15 + OpenNext 셋업·레지스트리·i18n 셸·`src/app/api` 표면, deploy-engineer가 wrangler/OpenNext 배선·바인딩·시크릿). 이 서버 표면은 **한 번 세우면 모든 미래 AI 도구가 재사용**한다.

### SPEC 선행 (비타협)

구현·수정 작업에 들어가기 전에 **항상 관련 SPEC을 먼저 갱신**한다. SPEC이 진실의 단일 소스이므로, 코드가 SPEC을 앞서면 문서가 즉시 낡고 팀이 어긋난다.

- 플랫폼/공통 표면 변경 → `docs/SPEC.md`를 **먼저** 갱신.
- 도구 기능 추가/변경 → 해당 `docs/services/<cat>/<tool>/SPEC.md`(+ `SPEC_KR.md`)를 **먼저** 갱신(없으면 `ai-tool-spec` 스킬로 신규 작성).
- 두 곳 다 영향받으면 둘 다 갱신한 뒤 착수. **SPEC 갱신 없이 구현부터 시작하지 않는다.** SPEC ↔ 코드가 드리프트하면 SPEC을 먼저 맞춘다.

### 워크트리 판단 (착수 전)

작업 착수 전에 **git 워크트리로 격리할지 판단**한다. 도구를 병렬로 빌드하거나, 공유 표면을 크게 바꾸거나, 현재 워킹트리를 오염시키면 안 되는 경우 전용 워크트리(`ai.jurepi.kr-<tool>` 등, `git worktree add -b <cat>/<tool> <sibling-path> main`)를 권장한다. 작은 단일 파일 변경은 불필요하다. **판단이 애매하면 진행 전에 사용자에게 워크트리 추가 여부를 묻는다**(자의로 결정하지 않는다). 형제 워크트리를 쓰면 서브에이전트 브리프·파일 도구·Bash를 **절대경로로 고정**한다(서브에이전트 cwd가 세션 기본 워크트리를 상속하는 함정).

## 워크플로우 (도구 단위 파이프라인)

각 도구를 다음 순서로 흘린다. 도메인이 그린이 되기 전에 바깥을 신뢰하지 않는다(inside-out). AI 도구는 **프로바이더 포트가 도메인 경계**라는 점이 핵심이다.

```
0. SPEC       (없으면) ai-tool-spec 스킬로 docs/services/<cat>/<tool>/SPEC.md(+_KR) 작성
1. 설계       architect → 계층 분해 + 계약(도메인 타입·프로바이더 포트 시그니처) + 불변식 + 작업 분배 (_workspace blueprint)
2. 도메인     domain-engineer → 테스트 RED→GREEN→REFACTOR (카탈로그 매칭·zod 스키마·응답 매퍼/검증·reducer) + 프로바이더 포트 인터페이스 확정
              ↳ 포트 시그니처를 ai-integration/platform에 SendMessage
3. 병렬 구현  ai-integration-engineer ∥ ui-engineer ∥ platform-engineer
              - ai-integration: 포트 위에 GeminiProvider + 프롬프트 + 가드레일 + 모의 SDK 테스트
              - ui: DESIGN 토큰 위 컴포넌트·훅·이미지 리사이즈·프라이버시 UX
              - platform: route handler(api/**) 배선 + 서버 zod 검증 + rate limit + 에러 envelope + 라우트/메타
              ↳ ui는 i18n 키 목록을 platform에, ai-integration은 factory 시그니처를 platform에 공유
4. 발견성     seo-geo-engineer → 도구별 SEO+GEO 명세·검증 (메타·JSON-LD·답변 우선·llms.txt; api/**는 색인 제외)
5. 점진 QA    qa-integration → 각 모듈 완성 직후 경계 교차 검증 (도메인 shape↔UI, 클라 요청↔route zod↔프로바이더 입력, 키 격리, ephemeral)
6. 통합       qa-integration → E2E(SPEC 시나리오) + a11y + CWV + 프리렌더 SEO/JSON-LD + rate-limit; CRITICAL은 해당 엔지니어로 반송
7. 배포       deploy-engineer → OpenNext 빌드·wrangler(server main)+KV+시크릿·push→CF Workers Builds·배포본 검증(api 200·키 미노출)
8. 종합       리더가 결과 수집·요약, 미해결/미검증 명시
```

> 단계별 상세(누가 무엇을 입력받아 산출하는지, 의존 그래프)와 오케스트레이션(팀 생성·데이터 전달·에러 핸들링)은 `references/orchestration.md`를 읽어라.

## 발견성 (SEO/GEO) — 도구 출시·개선 시점 호출

발견성은 이 제품의 성장 엔진이다. 각 도구는 사람(검색엔진 SEO)과 AI(생성엔진 GEO)에게 닿아야 한다. 도구를 **출시하거나 발견성을 개선할 때마다 seo-geo-engineer**를 호출한다(`model: "opus"`).

- **제1원칙(비타협): 인덱싱·인용 대상은 프리렌더 HTML에 있어야 한다.** OpenNext에서도 **도구 페이지는 SSG로 프리렌더**된다 — 메타·JSON-LD·HowTo/FAQ는 `mounted` 게이트/CSR 뒤가 아니라 게이트 밖 SSR에 둔다. `/api/**` 라우트는 **sitemap/robots에서 제외**하고 색인하지 않는다.
- **도구별 산출물(게이트):** 고유 메타 · JSON-LD(공통 SoftwareApplication/WebApplication + FAQPage, 해당 시 HowTo) · 답변 우선 Intro/HowTo/FAQ(ko/en) · `/llms.txt` 등재 · robots가 AI 크롤러 미차단 · sitemap 등재 · CWV.

## 배포 — 배포/배포 실패 시점 호출

배포는 deploy-engineer가 소유한다(`model: "opus"`, `opennext-cloudflare-deploy` 스킬). 핵심:

- **정적 익스포트가 아니다.** `@opennextjs/cloudflare`로 **진짜 서버 Worker**를 배포한다. `wrangler.jsonc`는 **assets-only가 아니라 server entry(`main`)**, `nodejs_compat` 플래그 필요. 실수로 `output:'export'`를 켜지 마라(route handler가 죽는다).
- **시크릿 = 서버 전용.** `GEMINI_API_KEY`는 `wrangler secret put`/CF 대시보드로만 주입 — 커밋·`NEXT_PUBLIC_` 금지. 공개 설정만 `.env.production`.
- **배포 트리거 = `git push` → main.** CF Workers Builds가 OpenNext 빌드+배포. **녹색 빌드 ≠ 정상 배포** — 배포본에서 `/api/**`가 200 `{ok}`인지, 클라 번들에 키가 없는지, 도구 페이지가 프리렌더됐는지 직접 검증.

## 검증 원칙 — 주장 ≠ 증명

에이전트는 "완료/PASS"를 *주장*하지만 자주 사실과 다르다. **리더는 CRITICAL/게이트 항목을 직접 재실행한다.**

- 에이전트는 추정이 아니라 **실제 명령 출력**(`pnpm test`/`test:coverage`/`playwright test`의 summary 줄)을 붙인다.
- 리더가 직접 재실행: 전체 커버리지 ≥80%, 빌드 그린, E2E 0 failed는 Bash로 한 번 더 돌려 수치를 확인한 뒤에만 통과.
- **E2E는 전체 스위트를 리더가 재실행**한다. 새 도구/카테고리는 공유 표면(홈 그리드·헤더 검색·푸터·카테고리 수)을 바꿔 전역 셀렉터 E2E를 깬다 — 실패를 만나면 회귀인지 선존인지 귀속하라.
- **AI 특화 하드 게이트(리더 직접 확인):**
  - **키 격리:** 빌드된 클라 번들/프리렌더 출력에서 `GEMINI_API_KEY`(및 서버 시크릿)가 **0건**인지 grep. 1건이라도 있으면 CRITICAL 차단.
  - **Ephemeral:** 업로드 이미지가 KV/R2/D1/디스크/로그에 쓰이지 않는지 — 영속/로깅 호출 grep + route 코드 리딩.
  - **가드레일:** 프로바이더가 **깨진 모델 JSON**을 받아도 크래시 없이 타입드 에러(`AI_UNAVAILABLE`/검증 실패)로 닫히는지 픽스처 테스트로 증명.
  - **rate limit:** N회 초과 시 429가 실제로 반환되는지.
- **빌드/테스트 그린 ≠ 화면 정상.** UI는 렌더 스크린샷을 직접 Read, SSR HTML(`curl`)에 그리드/링크가 실제 DOM으로 있는지, Tailwind 토큰 유틸이 생성됐는지 확인 후 통과.

## 작업 분할 — 컨텍스트 소진 방지

큰 작업을 한 에이전트에 길게 맡기거나 resume 체인을 길게 이으면 "Prompt is too long"으로 죽는다. **위임 단위를 좁게 자르고**, resume 2~3회를 넘어가면 **새 fresh 에이전트에 자기완결적 브리프**로 다시 시작한다.

## 에이전트 idle ≠ 완료

idle 알림은 완료 보고가 아니다. 리더는 상태를 **산출물로 직접 판정**한다 — 파일 존재(`ls`/`find`)·테스트 실행(`vitest run <scope>`)·핵심 grep. 긍정 보고("완료")뿐 아니라 부정 보고("못함/미완")도 실물로 확인한 뒤 재작업 여부를 판정한다. 같은 에이전트가 무행동 idle을 2회 반복하면 재지시 말고 fresh 교체.

## 데이터 전달 프로토콜

- **태스크 기반**(`TaskCreate`/`TaskUpdate`): 작업 상태·의존 추적.
- **메시지 기반**(`SendMessage`): 계약·포트 시그니처·i18n 키·경계 불일치 실시간 공유.
- **파일 기반**(`_workspace/`): 청사진·계약·QA 리포트. 파일명 `{phase}_{agent}_{artifact}.md`.
- 최종 산출물(`src/**`)만 프로젝트에 출력; 중간(`_workspace/`)은 감사 추적용 보존.

## 에러 핸들링 (요약)

- 실패 시 1회 재시도. 재실패면 그 결과 없이 진행하되 **리포트에 누락 명시**.
- 상충 산출물은 삭제하지 말고 출처 병기, 리더가 판단.
- **키 격리 실패·ephemeral 위반 = CRITICAL**: 통과 전 배포 금지.
- 계약(도메인 타입·프로바이더 포트) 변경은 architect 승인 + 영향 엔지니어 통지 후에만(침묵 변경 금지).

## 비타협 원칙 (게이트)

- **SPEC 선행:** 구현 전 관련 SPEC(플랫폼 `docs/SPEC.md` 및/또는 도구 `docs/services/**/SPEC.md`+`SPEC_KR.md`)을 먼저 갱신. SPEC 없이 코드 시작 금지.
- **워크트리 판단:** 착수 전 격리 필요 여부를 판단하고, 애매하면 사용자에게 워크트리 추가 여부를 물은 뒤 진행.
- 클린 아키텍처 의존성 규칙: 도메인은 react/next/DOM **및 AI/벤더 SDK** import 금지. 프로바이더 SDK는 어댑터 파일에만.
- TDD: 코드보다 테스트 먼저, 도메인 ≥90% / 전체 ≥80% 커버리지. AI 테스트는 실제 API 미호출(모의 SDK+픽스처).
- 보안/프라이버시: 키 서버 전용(NEXT_PUBLIC 금지), 사진 ephemeral(무저장·무로깅), 서버 zod 검증, rate limit.
- CWV: CLS<0.1, LCP<2.5s. a11y WCAG 2.1 AA.
- 디자인: `docs/DESIGN.md` 토큰 충실, anti-template.
- `.claude/commands/`에 아무것도 만들지 않는다.

## 테스트 시나리오

**정상 흐름:** "헤어스타일 추천 도구를 클린 아키텍처+TDD로 구현해줘"
→ Phase 0 초기 실행(+빈 레포면 플랫폼 스캐폴딩) → architect가 계층 분해(카탈로그 매칭=도메인, `HairstyleAI` 포트=도메인 정의, GeminiProvider=어댑터, 이미지 리사이즈=UI, `/api/hairstyle/*`=프레임워크) → domain-engineer가 스키마·매칭·응답검증 RED→GREEN + 포트 확정 → ai-integration∥ui∥platform 병렬 → seo 명세 → qa가 키 격리·ephemeral·경계 교차 검증 + E2E + CWV → deploy가 OpenNext 배포·검증 → 리더 종합. 결과: 키 안전·프라이버시 보장·계층 분리된 그린 배포.

**에러 흐름:** GeminiProvider가 스키마 밖 JSON을 반환해 가드레일이 실패
→ CRITICAL 분류 → ai-integration이 zod 검증+1회 repair/retry+enum 클램프로 교정, 실패 시 `AI_UNAVAILABLE` 타입드 에러로 닫음 → 픽스처(정상+깨진 JSON) 테스트 GREEN 확인 후에만 UI가 결과를 신뢰. 깨진 프로바이더 위에 화면을 세우지 않는다.

## 실행 후 (하네스 진화)

도구 완료 후 사용자에게 개선점을 묻는다. 피드백은 유형별로 반영하고 `CLAUDE.md` 변경 이력에 기록한다(결과 품질→스킬, 역할→에이전트 정의, 순서→이 오케스트레이터, 트리거 누락→description). 같은 피드백이 2회 반복되면 진화를 먼저 제안한다.
