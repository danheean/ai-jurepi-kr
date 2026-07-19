# ai.jurepi.kr

무료 **AI** 온라인 도구 허브. apps.jurepi.kr(무료 도구 허브, AI 없음)의 AI 형제 사이트. 도구를 하나씩 채운다.

**스택:** Next.js 15 / React 19 / Tailwind v4 / next-intl(ko/en) / zod — **OpenNext(`@opennextjs/cloudflare`)로 Cloudflare Workers에 배포(진짜 서버)**. apps.jurepi.kr의 정적 익스포트와 달리 **route handlers(`src/app/api/**`)** 로 서버측 AI 호출을 한다. **API 키는 서버 전용**(절대 `NEXT_PUBLIC_` 아님), 사용자 입력(사진 등)은 **일시적(ephemeral, 무저장·무로깅)**. AI 모델은 **스왑 가능한 프로바이더 포트**(도메인이 인터페이스 정의, `GeminiProvider` 기본, `AI_PROVIDER` env로 선택).

## 하네스: ai.jurepi.kr AI 도구 빌드

**목표:** 클린 아키텍처 + TDD로 무료 AI 온라인 도구를 하나씩, 키 안전·프라이버시 보장·발견성 최적화된 상태로 구현·배포한다.

**트리거:** AI 도구/플랫폼 구현·기능 추가·리팩터링·버그 수정·배포 요청 시 `ai-jurepi-build` 스킬을 사용하라. 새 도구는 먼저 `ai-tool-spec`으로 SPEC을 쓴다. 단순 질문·단일 파일 사소 편집은 직접 응답 가능.

**하네스 구성:** 에이전트 8종(`architect·domain-engineer·ai-integration-engineer·ui-engineer·platform-engineer·qa-integration·seo-geo-engineer·deploy-engineer`) + 스킬 10종(오케스트레이터 `ai-jurepi-build` 포함)은 `.claude/agents/`·`.claude/skills/`에서 관리한다. 상세는 `ai-jurepi-build` 스킬을 진입점으로.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-17 | 초기 구성 (apps.jurepi.kr 하네스를 AI/OpenNext용으로 이식; ai-integration-engineer·ai-provider-integration·opennext-cloudflare-deploy·ai-tool-spec 신규) | 전체 | - |
| 2026-07-17 | 플랫폼 SPEC(`docs/SPEC.md`) 작성 + DESIGN.md 정리(Pinterest 잔재 제거) + 시각 정체성 확정(단일 레드 #e60023 액센트·Pretendard 단일·카테고리 액센트 없음) | docs/SPEC.md, docs/DESIGN.md | 플랫폼 기반 수립 |
| 2026-07-17 | 지침 2건 추가: ①구현 전 SPEC(플랫폼/도구) 선행 갱신 ②착수 전 워크트리 격리 판단(애매하면 사용자에 질의) | skills/ai-jurepi-build (Phase 0 + 게이트) | 사용자 피드백 |
| 2026-07-17 | 첫 도구 SPEC(hairstyle EN+KR)을 확정 디자인(레드 단일 액센트·Pretendard·플랫 elevation·16/32 라운드)으로 정렬; blossom 액센트 제거, beauty 카테고리 유지 | docs/services/beauty/hairstyle-recommendation/SPEC.md·SPEC_KR.md | SPEC 선행 규칙 적용 |
| 2026-07-18 | 설계 시스템 재정렬: red primary 유지 + 6-color 카테고리 액센트 도입(coral/mint/sky/sun/grape/rose), Gmarket Sans display 추가(Pretendard body), 공통 기능 3종 포팅(favorites·SNS share·tool characters) — 2026-07-17 단일-액센트 결정 역전, apps.jurepi.kr과 일관성 추구 | docs/DESIGN.md, docs/SPEC.md, _workspace/1_architect_blueprint.md | 사용자 지시(형제 사이트 정렬) |
| 2026-07-19 | 홈 일관성 개선: ①컨테이너 1120px(`max-w-container`) 통일 — 홈 전 섹션+Header/Footer/ConsentBanner 8곳(screen-2xl 1536 폐기, apps.jurepi.kr 정렬) ②즐겨찾기 행 중앙 정렬+탐색 블록(검색→칩→즐겨찾기→그리드) 연속 bg-canvas(크림 띠·구분선 제거) ③타이포 상향 — body 행간 1.55/1.5, button-md 15px/600, caption 13px, body-lg 18px/1.6 신설(히어로 서브헤드) ④커서 어포던스: Tailwind v4 preflight가 button cursor:pointer 미부여(브레이킹 체인지) → globals.css `@layer base` 규칙 1개로 전역 복원 + `tests/e2e/cursor-affordance.spec.ts` 전수 스윕 가드(TDD RED→GREEN). 교훈: Tailwind v4 업그레이드 시 preflight 차이(버튼 커서)는 base 규칙으로 한 번에 잡을 것; 컨테이너 래퍼 누락은 좌측 치우침으로 즉시 드러남 | src/components/home/**, src/components/layout/**, tailwind.config.ts, src/styles/{globals,tokens}.css, docs/DESIGN.md·SPEC.md, tests/e2e/ | 사용자 피드백(즐겨찾기 좌측 치우침·배경 어색·글씨 작음·커서 포인터 누락) |
| 2026-07-19 | hairstyle 품질 감사+수정(impeccable audit 13/20 → harden·adapt·polish): ①ko 분석 결과 영어 유출 수정(analyze 프롬프트에 출력 언어 지시, evals 프롬프트 재export) ②카탈로그 태그·크레딧 ko 표시 로컬라이즈(`tag-labels.ts`, 카탈로그 슬러그는 영문 유지) ③다크모드 수정(MyPhotoPanel bg-white, 선택 필 `text-on-dark`→`text-canvas`, dark `--error` 토큰 신설) ④모바일: `capture="user"` 제거(갤러리 차단 버그), 텍스트 버튼 44px 터치 타깃 ⑤a11y: 캡션 대비(ash→mute), switch/progressbar/radiogroup 접근 이름, 분석 스피너 라이브 리전 ⑥side-stripe 금지 패턴 제거, `next/image sizes`, 오류 배너 토큰화, 미정의 클래스(`text-secondary` 등) 정리. 검증: 335 테스트·빌드 클린·CDP 스크린샷(라이트/다크×1440/375/320) | src/components/tools/hairstyle-recommendation/**, src/lib/hairstyle-recommendation/{prompt,tag-labels}*, src/styles/tokens.css, src/i18n/messages/* | impeccable audit 후속 |
| 2026-07-18 | hairstyle rev 2: ①성별 인지(FaceAnalysis.gender 자동 감지+수동 전환, 카탈로그 genders[] 태깅+남성 10종 확장, 참조 이미지 35장 전체 생성) ②얼굴 유지 프리뷰(GeminiImageClient REST-fetch·supportsImageEdit, 토글 기본 ON, IMAGE_PROVIDER=gemini — 결제 키 필요) ③backfill 로케일 버그 수정(locale-templates.ts) ④레일 좌측 레이아웃 ⑤evals/ uv+LangChain 프롬프트 평가 하네스(성별 정확도: gemma4:e2b 100%·9s > qwen3-vl:8b 83%·26s; 모델 전환 권고). 교훈: 서브에이전트 장시간 이미지 생성은 Bash 10분 타임아웃 → run_in_background 필수; 프롬프트 export는 도메인 변경 후 재실행 필수 | src/lib/**, src/app/api/hairstyle/preview, src/components/tools/hairstyle-recommendation/**, evals/, docs/services/beauty/hairstyle-recommendation/SPEC*.md | 사용자 피드백(남성 사진→여성 추천 버그, 영문 혼재) |
