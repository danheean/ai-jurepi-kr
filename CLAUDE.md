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
| 2026-07-18 | hairstyle rev 2: ①성별 인지(FaceAnalysis.gender 자동 감지+수동 전환, 카탈로그 genders[] 태깅+남성 10종 확장, 참조 이미지 35장 전체 생성) ②얼굴 유지 프리뷰(GeminiImageClient REST-fetch·supportsImageEdit, 토글 기본 ON, IMAGE_PROVIDER=gemini — 결제 키 필요) ③backfill 로케일 버그 수정(locale-templates.ts) ④레일 좌측 레이아웃 ⑤evals/ uv+LangChain 프롬프트 평가 하네스(성별 정확도: gemma4:e2b 100%·9s > qwen3-vl:8b 83%·26s; 모델 전환 권고). 교훈: 서브에이전트 장시간 이미지 생성은 Bash 10분 타임아웃 → run_in_background 필수; 프롬프트 export는 도메인 변경 후 재실행 필수 | src/lib/**, src/app/api/hairstyle/preview, src/components/tools/hairstyle-recommendation/**, evals/, docs/services/beauty/hairstyle-recommendation/SPEC*.md | 사용자 피드백(남성 사진→여성 추천 버그, 영문 혼재) |
