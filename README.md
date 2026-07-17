# ai.jurepi.kr · 무료 AI 온라인 도구 허브

> **AI로 하나씩, 전부 무료로.** — [ai.jurepi.kr](https://ai.jurepi.kr)

ai.jurepi.kr는 로그인·설치 없이 바로 쓰는 **무료 AI 온라인 도구 모음**입니다.
AI 기능이 없는 형제 사이트 [apps.jurepi.kr](https://apps.jurepi.kr)와 같은 디자인·발견성 철학을 공유하되,
각 도구가 실제 AI 추론을 수행합니다. 도구는 하나씩 채워집니다.

한국어(기본) · 영어를 지원하며, 각 로케일은 `/ko`, `/en` 프리픽스로 라우팅됩니다.

---

## 🧭 이 서비스는

AI 기술의 혜택 격차가 벌어지는 시대에, 그 기술로 방문자 누구에게나 실질적으로 도움이 되는 도구를
**무료로** 만들어 제공하는 것이 목표입니다. 홈은 도구를 발견·탐색하는 **카드 그리드 대시보드**이고,
각 도구는 개별 인덱싱 가능한 URL을 가진 페이지 위에 마운트되는 인터랙티브 앱입니다.

- **마찰 제로** — 진입 즉시 사용, 결과를 URL로 공유
- **프라이버시 우선** — 사용자 입력(사진 등)은 **일시적(ephemeral)**: 서버에 저장·로깅·캐시하지 않고 단발 처리 후 폐기
- **발견성** — 도구마다 독립 URL·메타데이터·JSON-LD (검색 유입 + AI 답변 인용 전제)
- **확장 구조** — 새 도구 = 레지스트리 1항목 + 모듈 (+ 필요 시 API 라우트)

---

## 🏗️ 기술 스택

apps.jurepi.kr의 스택을 계승하되, **AI 추론을 위해 진짜 서버**를 얹습니다.

| 영역 | 선택 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) · React 19 |
| 스타일 | Tailwind v4 + CSS 토큰 (`docs/DESIGN.md`) |
| i18n | next-intl (ko/en, `localePrefix: 'always'`) |
| 검증 | zod (서버 입력 + AI 응답) |
| **런타임** | **OpenNext (`@opennextjs/cloudflare`) → Cloudflare Workers** — `src/app/api/**` 서버 라우트 |
| **AI** | 스왑 가능한 **프로바이더 포트** (기본 `GeminiProvider`, `AI_PROVIDER` env로 선택) |
| 배포 | `git push` → Cloudflare Workers Builds |

**정적 익스포트가 아닙니다.** apps.jurepi.kr은 assets-only Worker(서버 없음)이지만, ai.jurepi.kr은
AI 키를 서버에 두고 모델을 호출해야 하므로 OpenNext로 서버 런타임을 활성화합니다.

### 핵심 원칙

- **API 키는 서버 전용** — `GEMINI_API_KEY` 등은 절대 `NEXT_PUBLIC_`가 아니며 클라이언트 번들에 포함되지 않습니다.
- **프로바이더 스왑** — 모델 접근은 단일 포트 인터페이스를 통하고, 새 프로바이더 추가 = 파일 하나(호출부 무변경).
- **가드레일** — 모델 출력은 zod로 검증하고, 깨진 응답은 타입드 에러로 안전하게 닫습니다.
- **접근성·성능** — WCAG 2.1 AA, CWV 목표 (LCP < 2.5s · CLS < 0.1).

---

## 🎨 디자인 시스템

시각 정본은 [`docs/DESIGN.md`](docs/DESIGN.md)입니다.

- **단일 브랜드 레드 액센트** (`#e60023`) — 모든 primary CTA·액션·active 상태 (카테고리별 액센트 없음)
- **Pretendard 단일** 폰트 (디스플레이·본문; 위계는 웨이트/트래킹)
- warm-cream 중립 크롬, 플랫 elevation, 16/32/pill 라운드 스케일

---

## 📁 구조

```
ai.jurepi.kr/
├── docs/
│   ├── SPEC.md                      # 플랫폼 명세 (단일 소스)
│   ├── DESIGN.md                    # 디자인 시스템 (시각 단일 소스)
│   └── services/<category>/<tool>/
│       ├── SPEC.md                  # 도구별 명세 (정본 영어)
│       └── SPEC_KR.md               # 한국어 동기화본
├── .claude/                         # 개발 하네스 (에이전트 + 스킬)
│   ├── agents/                      # 8종: architect·domain·ai-integration·ui·platform·qa·seo·deploy
│   └── skills/                      # 오케스트레이터 ai-jurepi-build 외 스킬
└── CLAUDE.md                        # 하네스 포인터 + 변경 이력
```

---

## 🤖 개발 방식 (하네스)

이 저장소는 **에이전트 하네스**로 개발합니다. 클린 아키텍처 + TDD를 척추로, 오케스트레이터
`ai-jurepi-build`가 전문 에이전트 팀(설계·도메인·AI 통합·UI·플랫폼·QA·SEO·배포)을 조율합니다.

- **SPEC 선행** — 구현 전 관련 SPEC(플랫폼/도구)을 먼저 갱신합니다.
- 상세는 `.claude/skills/ai-jurepi-build`와 `CLAUDE.md` 참조.

---

## 🗺️ 현황 & 로드맵

- ✅ 플랫폼 SPEC · 디자인 시스템 · 개발 하네스 수립
- ⏭️ 플랫폼 스캐폴딩 (Next.js 15 + OpenNext + 레지스트리 + i18n 셸)
- ⏭️ 첫 도구: **헤어스타일 추천** (얼굴형 분석 → 스타일 추천, 추천 전용·이미지 미생성·사진 ephemeral)

새 도구·기능 요청은 하나씩 더해 갑니다.

---

## 📄 라이선스

MIT
