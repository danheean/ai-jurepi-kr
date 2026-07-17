# 오케스트레이션 상세 — ai.jurepi.kr AI 도구 빌드

`ai-jurepi-build` SKILL.md의 워크플로우/게이트를 실제로 구동하는 팀 생성·데이터 전달·의존 그래프·에러 핸들링 상세. SKILL.md를 먼저 읽고, 실행 단계에서 이 파일을 참조하라.

## 목차
1. 팀 생성과 작업 할당
2. 도구 단위 의존 그래프
3. 프로바이더 포트 계약 선행 (AI 도구의 핵심)
4. Phase 간 팀 재구성
5. 데이터 전달 규칙
6. 에러 핸들링 (유형별)
7. 빈 레포 → 플랫폼 스캐폴딩 (첫 실행)

---

## 1. 팀 생성과 작업 할당

`TeamCreate`로 빌드 팀(상시 6명)을 만든다: architect·domain-engineer·ai-integration-engineer·ui-engineer·platform-engineer·qa-integration. `TaskCreate`로 Phase별 작업을 의존 관계와 함께 등록한다. 팀원은 `SendMessage`로 계약·포트 시그니처·i18n 키를 직접 공유한다. seo-geo-engineer·deploy-engineer는 상시 팀이 아니라 시점 전문가로 `Agent`(서브) 또는 팀 재구성으로 부른다.

**팀 크기 가이드:** 도구 1개 = 중규모(작업 10~20개) → 3~5명 집중 배치. 3명의 집중된 팀이 5명의 산만한 팀보다 낫다. 모든 호출에 `model: "opus"`.

## 2. 도구 단위 의존 그래프

```
architect(설계·계약)
   │  계약 = 도메인 타입 + 프로바이더 포트 시그니처 + 불변식
   ▼
domain-engineer(스키마·매칭·응답검증·reducer + 포트 인터페이스 확정)  ── inside-out 시작점
   │  포트/도메인 API 계약을 아래 셋에 SendMessage
   ├──────────────┬──────────────────┐
   ▼              ▼                  ▼
ai-integration   ui-engineer        platform-engineer
(GeminiProvider  (컴포넌트·훅·      (api/** 라우트·서버 zod 검증·
 프롬프트·        이미지 리사이즈·    rate limit·에러 envelope·
 가드레일·        프라이버시 UX)     라우트·메타·i18n)
 모의 SDK 테스트)      │                  │
   │  factory 시그니처 │  i18n 키 목록     │
   └──────────────┴──────────────────┘
                      ▼
           seo-geo-engineer(발견성 명세·검증)
                      ▼
           qa-integration(경계 교차 + AI 게이트 + E2E + a11y + CWV)
                      ▼
           deploy-engineer(OpenNext 배포·검증)
```

**핵심:** 세 병렬 엔지니어(ai-integration·ui·platform)는 **domain의 포트/도메인 계약이 확정된 뒤** 착수한다. 프로바이더 포트가 셋의 공통 경계다 — platform은 route에서 factory를 호출하고, ai-integration은 factory 뒤 어댑터를 구현하고, ui는 route의 응답 shape(도메인 타입)을 소비한다.

## 3. 프로바이더 포트 계약 선행 (AI 도구의 핵심)

병렬 구현 전에 **포트 인터페이스와 route I/O shape을 못박는다.** 안 그러면 세 에이전트가 shape을 지어내 드리프트한다.

- **domain-engineer가 확정:** 포트 인터페이스(예: `HairstyleAI { analyzeFace(img): Promise<FaceAnalysis>; recommend(input): Promise<Recommendation[]> }`), 도메인 타입(zod 스키마 = 단일 소스), 에러 코드 enum.
- **platform-engineer가 확정·공유:** route 요청/응답 envelope(`{ ok, data, error }`), 에러 코드, rate-limit 파라미터, factory 호출 지점(`getProvider(env)`).
- **리더 검증:** 병렬 병합 후 세 쪽이 같은 타입을 참조하는지 — route 응답 타입 ↔ ui 소비 타입 ↔ 도메인 스키마가 한 소스(`schema.ts`)에서 나오는지 grep으로 교차 확인. i18n 키는 `{ key, ko, en }` 분리 컬럼으로 계약(파이프 조인 `"KO | EN"` 금지 — ko.json에 그대로 복붙돼 이중언어 오염).

## 4. Phase 간 팀 재구성

에이전트 팀은 세션당 한 팀만 활성이지만 Phase 간 해체·재구성 가능하다. 배포는 빌드 팀과 성격이 다르므로, 통합 QA 그린 후 빌드 팀 산출물을 `_workspace/`+`src/`에 남기고 deploy-engineer를 서브 에이전트로 부르거나 팀을 재구성한다. seo-geo-engineer도 도구 출시 시점에 단독 서브로 충분하다(인프라는 platform, 카피는 ui와 협업 지점).

## 5. 데이터 전달 규칙

- **파일 기반(`_workspace/`):** `{phase}_{agent}_{artifact}.md`. 예: `01_architect_hairstyle-blueprint.md`, `02_domain_hairstyle-contract.md`(포트+타입), `05_qa_hairstyle-report.md`.
- **메시지 기반:** 포트 시그니처·factory 지점·i18n 키·경계 불일치.
- **태스크 기반:** 작업 상태·의존.
- 최종 산출물(`src/**`, `docs/services/**`)만 프로젝트에 출력. 중간(`_workspace/`)은 감사 추적용 보존.

## 6. 에러 핸들링 (유형별)

| 에러 유형 | 전략 |
|-----------|------|
| 에이전트 실패/무응답 | 1회 재시도 → 재실패 시 그 결과 없이 진행 + 리포트에 누락 명시. 무행동 idle 2회면 fresh 교체. |
| 계약(도메인/포트) 모호 | architect로 반송해 계약 확정 후 재개. 침묵 변경 금지. |
| 가드레일 실패(깨진 모델 JSON) | **CRITICAL.** ai-integration이 zod 검증+1회 repair/retry+enum 클램프, 실패 시 `AI_UNAVAILABLE`로 닫음. 픽스처(정상+깨진) 테스트 GREEN 전 UI 진행 금지. |
| 키 격리 실패(클라 번들에 키) | **CRITICAL 차단.** 배포 전 반드시 0건. platform/ai-integration으로 반송. |
| ephemeral 위반(이미지 영속/로깅) | **CRITICAL 차단.** route/provider 코드 교정 후 재검증. |
| 상충 산출물 | 삭제 말고 출처 병기, 리더 판단. |
| 배포 실패 | deploy-engineer가 근본 원인 좁혀 최소 수정. 녹색 빌드 ≠ 정상 배포 — 배포본 직접 검증. |

## 7. 빈 레포 → 플랫폼 스캐폴딩 (첫 실행)

`src/`·`open-next.config.ts`·`wrangler.jsonc`가 없으면 첫 도구 전에 서버 표면을 세운다. 이 골격은 모든 미래 AI 도구가 재사용한다.

1. **platform-engineer:** Next.js 15 App Router + next-intl(ko/en, localePrefix always) 셸, 도구 레지스트리(`src/tools/`), SSG 골격(generateStaticParams), SEO 인프라(sitemap/robots/manifest, api/** 제외), 공통 에러 envelope·rate-limit 유틸·`src/app/api` 표면 관례, 서버 env 검증. `nextjs-server-platform` 스킬.
2. **deploy-engineer:** `@opennextjs/cloudflare` 셋업, `open-next.config.ts`, `wrangler.jsonc`(server `main`, `nodejs_compat`, 최신 compatibility_date), KV 바인딩(`RATE_LIMIT_KV`), 시크릿 주입 절차(`GEMINI_API_KEY`). `opennext-cloudflare-deploy` 스킬.
3. **ui-engineer:** DESIGN 토큰 브리지(`tokens.css`), UI 프리미티브, 레이아웃 셸.
4. **architect가 선행**해 이 스캐폴딩의 계층 경계·파일 배치를 청사진으로 못박는다.

스캐폴딩 그린(빌드·타입체크·기본 라우트) 후에야 첫 도구 파이프라인(Phase 0~8)을 시작한다.
