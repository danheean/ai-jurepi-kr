# 헤어스타일 추천 — AI 얼굴형 스타일 어드바이저 — 서비스 SPEC

> 이 문서는 AI 코딩 에이전트가 소비하는 **정본 영문 SPEC**([`SPEC.md`](SPEC.md))의 **국문 번역본**입니다. 어느 한쪽이 변경되면 양쪽을 동기화하세요. **ai.jurepi.kr DESIGN.md와 정렬됨 (2026-07-18): 브랜드 레드 주색 + 6-카테고리 액센트(beauty = rose), Gmarket Sans 디스플레이 + Pretendard 본문, 16/32/pill 라운드. 갱신 2026-07-18: 와이드 tool-page 셸, 상시 표시 사진 패널, AI 스타일 프리뷰 이미지 생성(플랫폼 `src/lib/ai` 능력 계층; dev = Ollama). 갱신 2026-07-18 (rev 2): 성인지(性認知) 추천(분석이 감지된 성별 감지; 자동 적용 + 수동 오버라이드), 얼굴 보존 스타일 프리뷰(사용자 사진 + 머리만 수정 via 편집 가능한 이미지 제공자, 토글 기본 ON), 워크스페이스 레일 좌측으로 이동, 로케일 올바른 백필 텍스트, 남성 카탈로그 항목 10개 추가(항목별 `genders` 태그), `evals/` 프롬프트 평가 하네스(uv + LangChain + Ollama). 갱신 2026-07-19 (rev 3): 사진 없이 얼굴형만 수동 선택했을 때 레일에 AI 생성 참조 이미지 표시(기존엔 무-사진 경로에서 레일이 비어있었음); `analyzeFace()`가 이제 Gemini 네이티브 `generationConfig.responseSchema`를 실제로 전달(기존 `<third_party_integrations>`의 responseSchema 언급은 rev 3 이전엔 이상적 서술이었고 실제로는 `responseMimeType: application/json`만 사용 중이었음; zod 검증은 방어적 이중 계층으로 유지); `recommend()`가 이제 선택적 **Curation** 블록(전체 요약 + AI가 작성한 "피하는 편이 좋은 스타일" 사유, 동일 단일 호출·추가 지연 없음)도 반환하며 추천 그리드 위에 렌더링; 결과 노출은 **카드 단계적 리빌**(큐레이션 패널 먼저, 카드는 ~80ms 간격 순차 페이드인, `prefers-reduced-motion` → 즉시 표시) — 네트워크 스트리밍이 아니라 이미 받은 응답을 클라이언트에서 순차 표시하는 것.**
>
> **헤어스타일 추천**(Hairstyle Recommendation) 빌드 명세 — 새 **ai.jurepi.kr** 허브(무-AI [apps.jurepi.kr](https://apps.jurepi.kr)의 AI 자매 사이트)의 **첫 번째 AI 도구**. 사용자는 **얼굴 사진을 업로드**(AI 비전 모델이 분석)하거나 **얼굴형을 직접 선택**하고, 몇 가지 속성(성향·머리 길이·모질·상황)을 지정한 뒤 **3~6개의 추천 헤어스타일**을 받는다 — 각 스타일에는 "왜 어울리는지" 설명, 스타일링/관리 팁, **큐레이션된 참고 이미지**가 붙는다. 분석은 **감지된 성별 표현**(남성/여성/불명 — 자동 적용되어 남성 사진이면 남성용 스타일을 산출하며, **수동 성별 오버라이드**는 항상 가능)도 감지한다. AI는 **구조화된 텍스트**를 반환하고, 모든 카드는 큐레이션된 참고 이미지를 즉시 표시하며, 이미지 제공자가 활성화되면 **AI 생성 스타일 프리뷰**가 점진적으로 교체한다: **얼굴 보존**(사용자 자신의 사진에서 머리만 변경; 토글 기본 ON)은 사진이 존재하고 제공자가 이미지 편집을 지원할 때, 그 외엔 감지된 성별과 일치하는 일반 모델 인물. **그 무것도 저장되거나 로깅되지 않음** — 사진과 모든 프리뷰는 즉시적(ephemeral).
>
> 내부 서비스 코드네임: `hairstyle-recommendation`. 레지스트리 id: `hairstyle-recommendation`. 공개 URL 슬러그: `/[locale]/tools/hairstyle-recommendation`. 카테고리: `beauty`. 액센트: `rose` (6-카테고리 액센트 시스템, 2026-07-18).
>
> **CRITICAL — 서버 사이드 AI, 정적 export 아님.** apps.jurepi.kr은 서버 없는 자산 전용 Worker로 정적 export를 서빙한다. 이 도구는 AI 키를 보관하고 추론을 실행할 **서버가 필요**하므로, **ai.jurepi.kr은 OpenNext(`@opennextjs/cloudflare`)로 Cloudflare Workers에 배포**한다. 동일한 Next.js 15 / React 19 / Tailwind v4 / next-intl 스택과 DESIGN 시스템을 유지하면서 **라우트 핸들러**(`src/app/api/hairstyle/**`)를 사용할 수 있게 한다. 모든 모델 호출은 서버에서 일어나고, API 키는 절대 클라이언트에 도달하지 않는다.
>
> **CRITICAL — 텍스트 추천 + 스타일 프리뷰(얼굴 보존, 동의 게이트).** AI는 구조화된 **텍스트**(얼굴형 분석 + 성별 + 이유 + 팁 + 헤어스타일 ID)를 생성하고, 참고 이미지는 **큐레이션 정적 라이브러리**에서 온다. `IMAGE_PROVIDER`가 설정되면 각 추천 카드는 플랫폼 `ImageGenerator` 포트를 통해 **스타일 프리뷰 이미지**를 자동 생성한다. 두 가지 프리뷰 모드(rev 2): **(a) 얼굴 보존 편집** — 사용자가 사진을 업로드했고, "내 얼굴로 미리보기" 토글이 ON(기본)이고, 제공자가 이미지 편집을 지원하면(`supportsImageEdit`), 사용자의 사진이 `referenceImage`로 머리만 수정하는 프롬프트와 함께 전송(정체성/피부/표현/의류/배경 보존); **(b) 일반 렌더** — 그 외의 경우, 권장 사항의 성별과 일치하는 일반 모델의 텍스트→이미지 인물(카탈로그 데이터만으로 생성, 프롬프트 구성). 자유 텍스트 사용자 입력은 어느 모드에서도 이미지 모델에 도달하지 않음. 생성 비활성이거나 실패하면 카드는 조용히 큐레이션 이미지를 유지한다.
>
> **CRITICAL — 사진 즉시 폐기, 프라이버시 우선.** 이건 얼굴 사진 도구다. 업로드 이미지는 **클라이언트에서 리사이즈**되어 서버로는 (1) 분석 호출과 (2) — "내 얼굴로 미리보기" 토글이 ON인 동안만 — 카드별 얼굴 보존 프리뷰 편집에만 전송된다. 모든 경우에 이미지는 **서버에 절대 저장되지 않고, 로깅되지 않고, 각 응답 직후 폐기**되며; 토글은 사용자가 자신의 사진을 이미지 모델에서 완전히 차단할 수 있게 한다. 이는 하드 규칙이며(`<security_considerations>` 참조) UI에 표기된다.
>
> 이 SPEC은 **도구 자체**를 다룬다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO/광고 인프라, 디자인 토큰은 플랫폼이 제공한다. ai.jurepi.kr 플랫폼 `SPEC.md`/`DESIGN.md`가 시각 정본을 정의한다:
> - 디자인 시스템(시각 정본): **ai.jurepi.kr `docs/DESIGN.md`** (브랜드 레드 `#e60023` 주색, 따뜻한 크림 중립 표면 canvas #ffffff / surface-soft #fbfbf9 / surface-card #f6f6f3, Gmarket Sans 디스플레이 + Pretendard 본문, 16px md / 32px lg / pill 라운드, 6-카테고리 액센트 시스템 — beauty/이 도구 = rose; 와이드 tool-page 셸 표준 max-w-screen-xl 1280px).
> - 도구 레지스트리 패턴: apps.jurepi.kr `src/tools/registry.ts` + `src/tools/types.ts` (`ToolMeta` 형태).
> - i18n 라우팅: next-intl, 로케일 `['ko','en']`, `defaultLocale: 'ko'`, `localePrefix: 'always'`.

```xml
<project_specification>

<project_name>헤어스타일 추천 — AI 얼굴형 스타일 어드바이저 (ai.jurepi.kr 도구, 코드네임 hairstyle-recommendation, 레지스트리 id hairstyle-recommendation)</project_name>

<overview>
헤어스타일 추천은 사용자가 자신의 얼굴에 어울리는 헤어컷을 발견하도록 돕는다. 진입 경로는 둘이다. **사진 경로**에서는 사용자가 얼굴 사진을 업로드/촬영하고, AI 비전 모델이 **얼굴형**(oval, round, square, heart, oblong, diamond, triangle), **감지된 성별 표현**(남성/여성/불명 — 스타일을 필터링하도록 자동 적용되며, 수동으로 오버라이드 가능), 그리고 두드러진 특징을 분석해 구조화된 결과를 반환한다. **무사진 경로**에서는 라벨링된 일러스트에서 얼굴형을 그냥 선택한다 — 이미지도 업로드도 없이 즉시(성별은 수동으로 선택 가능). 어느 쪽이든 사용자는 몇 가지 속성(성별, 스타일 성향, 현재 머리 길이, 모질, 상황)을 지정하고 맞춤 추천을 받는다.

각 추천은 카드다: 헤어스타일 이름(ko/en), AI가 쓴 짧은 "당신 얼굴형에 왜 어울리는지" 설명, 2~3개의 구체적 스타일링/관리 팁, 그리고 **큐레이션된 참고 사진** — 이미지 생성이 활성화되면 **AI 생성 스타일 프리뷰**로 점진적으로 업그레이드(사진 있고 "내 얼굴로 미리보기" 토글 ON + 편집 제공자 시 얼굴 보존, 아니면 일반 렌더) — 이라 사용자가 실제 룩을 볼 수 있다. 업로드 사진은 속성 지정→결과 간 지속적인 "내 사진" 패널에서 표시된 상태 유지. 사용자는 새 아이디어를 위해 다시 추천받고, 공유용 요약을 복사하고, 가이드를 열 수 있다. 전체 플로우는 빠르고, 로그인 없고, 모바일 우선이다 — 플랫폼 SSG 셸 위에 마운트된 단일 페이지 상호작용.

CRITICAL (서버 사이드 AI): apps.jurepi.kr(정적 export, 서버 없음)과 달리 이 도구는 AI 모델을 호출하므로 ai.jurepi.kr은 **OpenNext로 Cloudflare Workers**에서 실행된다. 두 개의 **라우트 핸들러**가 작업한다: `POST /api/hairstyle/analyze`(이미지 → 얼굴 분석)와 `POST /api/hairstyle/recommend`(속성 → 추천). AI 키는 서버 환경에만 존재하고, 브라우저는 그것을 절대 보지 못하며 제공자를 직접 호출하지 않는다.

CRITICAL (얼굴 보존 프리뷰, 동의 게이트): 추천 AI는 **텍스트와 ID만** 반환한다. 큐레이션 이미지(`public/hairstyles/**`)는 모든 카드에 즉시 렌더; `IMAGE_PROVIDER` 활성화 시 **스타일 프리뷰**가 카드당 `POST /api/hairstyle/preview`로 자동 생성되고 점진적으로 페이드 인(클라 동시성 2). 사진 있고 "내 얼굴로 미리보기" 토글 ON(기본) + 편집 제공자 시 프리뷰는 **사용자 자신의 사진의 머리만 수정**(정체성 보존); 그 외엔 카탈로그 프롬프트만으로 권장사항의 성별과 일치하는 일반 모델 텍스트→이미지 렌더, 자유 텍스트 사용자 입력은 절대 이미지 모델 도달 안 함.

CRITICAL (즉시 폐기, 프라이버시 우선): 얼굴 사진은 브라우저에서 리사이즈(긴 변 ≤ 1024px, JPEG q≈0.85)되어 서버로는 분석 호출에만, 그리고 — 얼굴 프리뷰 토글이 ON인 동안 — 카드별 프리뷰 편집 호출에도 전송된다. 각 요청은 메모리에서 처리되어 폐기된다. 어떤 이미지 바이트도 디스크/캐시/KV/R2/로그에 절대 쓰이지 않으며, 토글은 사용자가 자신의 사진을 이미지 모델에서 완전히 차단할 수 있게 한다. 프라이버시 보장과 토글은 업로더 옆 UI에 표기된다.

CRITICAL (제공자 교체 가능): 모든 모델 접근은 `HairstyleAI` 포트를 통하며, 어댑터는 플랫폼 능력 계층(`src/lib/ai/` — StructuredModel + ImageGenerator; GeminiClient 최신형 / OllamaClient 오픈소스 / GeminiImageClient 편집 가능 이미지 생성)에서 구성된다. `AI_PROVIDER`는 분석/추천 제공자 선택(gemini | ollama); `IMAGE_PROVIDER`는 독립적으로 이미지 생성 제공자 선택(gemini | ollama | 미설정 = 비활성). 오직 `gemini`(`gemini-2.5-flash-image`)만 얼굴 보존 편집(`supportsImageEdit=true`)을 지원; Ollama 프리뷰는 일반 렌더로만 유지. Dev는 노트북 Ollama 무비용으로 전부 실행; 제공자 추가는 파일 하나; 라우트 핸들러와 UI 변경 없음.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/hairstyle-recommendation (SSG 셸 + 클라이언트 도구; 레지스트리 슬러그 "hairstyle-recommendation", id "hairstyle-recommendation", status "live", category "beauty").
  - API 라우트 (서버, OpenNext Worker 런타임): POST /api/hairstyle/analyze, POST /api/hairstyle/recommend, POST /api/hairstyle/preview (스타일 프리뷰 이미지 생성; 이미지 제공자 미설정 시 503 IMAGE_GEN_DISABLED). Node 호환 라우트 핸들러; 정적 export 아님.
  - 플랫폼 제공 (재구현 금지): 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 감싸는 Error Boundary, SEO 메타데이터 + JSON-LD 빌더, breadcrumb, ShareButtons.
  - 소비: i18n 네임스페이스 `tools.hairstyle-recommendation.*` (UI 크롬: 업로더 라벨, 속성 라벨 + 옵션 라벨, 결과 라벨, 팁 헤딩, 빈/로딩/에러 상태, 프라이버시 고지, 하우투, FAQ, 공유, breadcrumb). 최상위 `tools.hairstyle-recommendation.title`/`.description`(홈 카드, 푸터, 검색)도 필요. 모델/카탈로그에서 오는 얼굴형 이름·헤어스타일 이름·이유·팁은 카탈로그 데이터 + 프롬프트에서 현지화하며, i18n 메시지 파일이 아니다.
  - 플랫폼 의존 (신규 카테고리 + 서버): (1) `ToolCategory`에 `'beauty'` 추가; (2) `ToolMeta` 레지스트리 항목 1개 추가(도구별 액센트 없음; 모든 도구가 브랜드 레드 공유); (3) 도구 라우트에 슬러그→컴포넌트 분기 + generateMetadata 분기 추가; (4) 이 도구의 content/sitemap 블록 추가; (5) OpenNext 서버 런타임 + `src/app/api/**` 표면 + 제공자 env 배선을 **처음** 요구하는 도구 — 한 번 확립해 모든 향후 AI 도구가 재사용.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - 두 진입 경로: 사진 경로(업로드/촬영 → AI 얼굴형 분석)와 무사진 경로(라벨 일러스트에서 얼굴형 수동 선택).
    - 클라이언트 이미지 처리: 파일 선택 + 드래그드롭 + (모바일) 카메라 촬영; 검증(타입/크기); 업로드 전 canvas로 긴 변 ≤ 1024px, JPEG q≈0.85 다운스케일; 로컬 미리보기.
    - `POST /api/hairstyle/analyze`: 리사이즈된 이미지(base64 JSON) 수신, FaceAnalysis(faceShape, confidence, **gender (male/female/unknown — 감지된 표현, 'unknown' 허용), features, notes) 반환. 즉시 폐기 — 이미지 저장/로깅 안 함.
    - `POST /api/hairstyle/recommend`: RecommendInput(faceShape + 선택 **gender** 포함 속성) 수신, Recommendation[](3~6) 반환. 선행 analyze 호출 없이도 동작.
    - 성별 인식 매칭(rev 2): 감지된 성별은 성별 속성으로 자동 적용(사용자 오버라이드 가능); `matchCandidates`는 성별로 카탈로그를 먼저 hard-filter(항목 `genders`가 요청 성별 포함), 그 다음 성향 적용 — 성별 필터 풀이 MIN_RECS 아래로 떨어지면 성향을 soft filter로 완화.
    - 속성 지정(양 경로): **성별(남성/여성 — 사진 경로에선 분석에서 자동 설정, 양 경로에서 수동 선택, 선택)**, 성향(feminine/masculine/neutral), 머리 길이(short/medium/long), 모질(straight/wavy/curly/coily), 상황(daily/business/event/seasonal). 합리적 기본값; faceShape 외 전부 선택.
    - 큐레이션 정적 헤어스타일 라이브러리(`public/hairstyles/**` + `catalog.ts`): 모든 얼굴형 × 성향에 걸쳐 ≥ 24개 항목, **각각 `genders`로 태그(남성/여성/both = unisex; ≥ 15개 항목이 rev-2 남성 확장 후 'male' 포함해야 함)**, 각각 라이선스/크레딧 표기된 참고 이미지; 매칭 로직이 AI가 고를 후보를 선별/정렬하고 반환된 각 hairstyleId의 이미지를 공급.
    - 기본 `GeminiProvider`를 가진 `HairstyleAI` 제공자 추상화; `AI_PROVIDER` env가 구현 선택; 구조화-JSON 프롬프트 + 검증 + 가드레일.
    - 결과 UI: 분석 카드(얼굴형 + 신뢰도 + 특징) + 추천 그리드(3~6 카드: 이름, 이유, 팁, 참고 이미지 → AI 스타일 프리뷰). 다시 추천, 요약 복사/공유, 초기화.
    - 지속적인 "내 사진" 패널 (2026-07-18; 모바일 사진 확대 2026-07-20): 업로드 후 사진은 속성 지정→결과 간 표시 유지(object URL, 메모리 전용), 교체/제거 액션; sticky 사이드 레일(데스크톱) / 큰 히어로 사진 1회 노출(MyPhotoPanel, 데스크톱 레일과 동일 처리) + 그 아래 확대된 컴팩트 sticky 칩(56px 썸네일, MobilePhotoChip)이 추천 결과 스크롤 중 상단 고정(모바일).
    - 2-컬럼 워크스페이스 (rev 2 — 레일 좌측): grid-cols-1 lg:grid-cols-3 — 레일(1/3, lg:sticky, DOM 및 좌측 데스크톱에서 첫번째): MyPhotoPanel(**+ 얼굴 프리뷰 토글**) + AnalysisCard(**+ 성별 배지**) + AttributeSelectors + 기본 CTA; 메인(2/3, 우측): 단계 플로우 / 결과. 입력→출력이 좌→우로 읽힘(얼굴 보존 프리뷰를 위해 전/후 인접). 모바일 순서 (2026-07-20): MyPhotoPanel이 이제 무조건 렌더링되어(더 이상 `hidden lg:block` 아님) 레일 최상단에 큰 non-sticky 히어로로 표시되고, 그 아래 확대된 sticky MobilePhotoChip이 이어짐(자연스러운 문서 흐름 상 히어로를 지나쳐 스크롤하면 상단에 고정).
    - `POST /api/hairstyle/preview` (rev 2): 플랫폼 ImageGenerator 포트를 통한 카드별 스타일 프리뷰 생성. 요청이 사용자 사진(`image`/`mimeType`, analyze와 동일 크기 제한) + `gender`를 담을 수 있음(rev 2). 라우트 분기(rev 2 — ROUTE가 결정): (a) 사진 있음 && generator.supportsImageEdit → 얼굴 보존 편집 프롬프트(`buildFaceEditPrompt`, 머리만 변경), 사진을 `referenceImage`로; (b) 그 외 → 카탈로그 프롬프트 + 성별 맞춤 모델. 768×960; 레이트 리밋 30/분/IP; 임시(이미지 바이트 저장/로깅 안 함); 비활성 → 조용한 클라 폴백 503 IMAGE_GEN_DISABLED.
    - "내 얼굴로 미리보기" 토글 MyPhotoPanel에서 (rev 2): 사진 존재 시 기본 ON; OFF(또는 사진 없음 / 비편집 제공자) → 일반 프리뷰; 토글링하면 이미 생성된 프리뷰 무효화 + 재큐.
    - 로케일 올바른 출력 모든 곳(rev 2): 모델 이유/팁은 프롬프트로 현지화; 카탈로그 `backfill()` 폴백 텍스트는 로케일 템플릿(ko/en) 사용; 요약 복사는 로케일 이름 사용. ko 응답에서 하드코드된 영어 유출 금지.
    - Dev 추론 노트북 Ollama (AI_PROVIDER=ollama, IMAGE_PROVIDER=ollama): qwen3-vl 비전 분석, qwen3.5 텍스트 추천, x/z-image-turbo 이미지 생성.
    - 상태: idle, uploading, analyzing(스켈레톤), recommending(스켈레톤), success, 그리고 모든 에러(error_handling 참조). CLS 안전 예약 높이.
    - 업로더에 인라인 프라이버시 고지("사진은 1회 분석되고 저장되지 않습니다.") + "사진 없이? 얼굴형 선택" 어포던스.
    - 두 엔드포인트에 레이트 리밋; 타입드 에러 봉투; 서버 zod 입력 검증.
    - SEO/GEO: 도구 페이지 메타데이터(title/description/canonical/hreflang/OG), SoftwareApplication + FAQPage + BreadcrumbList JSON-LD, 현지화 롱폼 인트로 + FAQ(ko/en). 정적·인덱싱 가능 카피는 인터랙티브 게이트 밖에서 렌더.
    - reduced-motion 폴백; WCAG 2.1 AA; 완전한 키보드 지원.
  </in_scope>
  <out_of_scope>
    - 앱 셸, 헤더/푸터, 로케일 스위처, 테마 토글, 동의 배너, 광고 로딩, sitemap/robots 메커니즘, 도구 레지스트리 메커니즘 (전부 플랫폼).
    - **자유형 생성형 체험** — 임의의 사용자 지향 편집(커스텀 색, 액세서리, 자유 텍스트 스타일 요청). 얼굴 보존 프리뷰는 카탈로그 프롬프트만의 머리 편집; 사용자 자유 텍스트는 절대 이미지 모델 도달 안 함.
    - 업로드 사진을 어디든(KV, R2, D1, 디스크, 로그) 저장/캐시/로깅. 즉시 폐기만 — analyze 호출 AND 모든 프리뷰 편집 호출에 적용.
    - 계정/로그인/저장 이력/기기 간 동기화/공유 URL 요약 외 결과 지속.
    - 브라우저 내 실시간 얼굴 랜드마크 검출, AR 오버레이, 라이브 카메라 프리뷰 이펙트.
    - 미용실 예약, 제품 구매, 가격 견적, 스타일리스트 디렉터리.
    - 의학/피부과 주장(탈모 진단, 두피 치료).
  </out_of_scope>
  <future_considerations>
    - ~~생성형 가상 체험~~ → **rev 2에서 얼굴 보존 프리뷰로 출시**(`ImageGenerator.referenceImage` + `supportsImageEdit`, GeminiImageClient). 남은 것: dev가 편집 경로를 오프라인에서 연습할 수 있도록 Ollama 편집 가능 백엔드(img2img 업스트림 소스 이미지 회귀 수정 대기).
    - 피부톤에 맞춘 컬러/염색 제안 (Phase 2).
    - localStorage로 후보 저장/비교 (Phase 2).
    - 시즌/트렌드 스타일 팩 큐레이션 (Phase 3).
    - 저장 룩 + 클라우드 동기화용 선택 계정 (Phase 3).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited_from_platform>
    - 프레임워크: Next.js 15 (App Router), React 19, TypeScript strict.
    - 스타일링: Tailwind v4 + DESIGN.md 토큰(tokens.css).
    - i18n: next-intl (ko/en, localePrefix 'always').
    - 아이콘: lucide-react.
    - 검증: zod.
  </inherited_from_platform>
  <tool_specific>
    <runtime>OpenNext로 Cloudflare Workers(@opennextjs/cloudflare, 최신) — 서버 라우트 핸들러 활성화. 이 허브에서 apps.jurepi.kr의 정적 export를 대체.</runtime>
    <ai_sdk>@google/genai (JS용 Google Gen AI SDK, 최신) — GeminiProvider 안에서 서버 전용으로만 사용. 모델: gemini-2.5-flash (비전 + 텍스트, 구조화 JSON 출력).</ai_sdk>
    <ai_abstraction>로컬 포트 `HairstyleAI` + 팩토리(ai/index.ts)가 AI_PROVIDER(gemini | ollama)로 선택. 어댑터는 플랫폼 능력 계층 `src/lib/ai/`(StructuredModel + ImageGenerator; GeminiClient / OllamaClient + 공유 가드레일)의 얇은 구성. 제공자 SDK/fetch는 어댑터+클라이언트 파일 밖에서 안 됨. 스타일 프리뷰는 `getImageGenerator()`(IMAGE_PROVIDER) 사용 — 분석 제공자와 독립.
    <image_resize>브라우저 canvas 다운스케일(라이브러리 없음) — createImageBitmap + OffscreenCanvas/Canvas → toBlob('image/jpeg', 0.85). 긴 변 ≤ 1024px 가드.</image_resize>
    <rate_limit>Cloudflare Workers KV 또는 IP별 인메모리 토큰 버킷(security 참조). KV 바인딩 이름: RATE_LIMIT_KV(선택; 미바인딩 시 isolate별 제한기로 폴백).</rate_limit>
    <note>데이터베이스 없음. 사진 저장 없음. 유일한 상태 플랫폼 바인딩은 선택적 레이트 리밋 KV뿐이며, 해시된 IP로 키잉된 카운터만 저장 — 이미지 데이터는 절대 안 됨.</note>
  </tool_specific>
  <libraries>
    <genai>@google/genai (최신) — Gemini 비전 + 텍스트, 서버 전용, GeminiProvider 내부</genai>
    <opennext>@opennextjs/cloudflare (최신) — Next.js → Cloudflare Workers 어댑터</opennext>
    <zod>zod v4 — 요청 + 제공자 응답 검증</zod>
    <lucide>lucide-react (^0.468) — 아이콘 (Scissors, Sparkles, Upload, Camera, ShieldCheck, RefreshCw, Share2)</lucide>
  </libraries>
</technology_stack>

<environment_variables>
  <variable>
    <name>AI_PROVIDER</name>
    <description>HairstyleAI 구현 선택 (서버 전용)</description>
    <required>false</required>
    <example>gemini</example>
    <note>미설정 시 "gemini" 기본값. Enum: gemini, ollama (제공자 추가 시 확장). Dev 관례: ollama.</note>
  </variable>
  <variable>
    <name>GEMINI_API_KEY</name>
    <description>Google Gen AI API 키 — 서버 전용, GeminiProvider 내부에서만 사용</description>
    <required>true</required>
    <example>AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</example>
    <note>CRITICAL: 서버 전용. NEXT_PUBLIC_ 접두사 절대 금지. 클라이언트 번들에서 참조 안 됨. 요청 시점에 존재 검증; 없으면 AI_UNAVAILABLE 반환.</note>
  </variable>
  <variable>
    <name>IMAGE_PROVIDER</name>
    <description>스타일 프리뷰용 이미지 생성 제공자 (서버 전용). 미설정/none = 프리뷰 생성 비활성 → /api/hairstyle/preview 503 IMAGE_GEN_DISABLED 반환, UI 조용히 큐레이션 이미지 유지.</description>
    <required>false</required>
    <example>gemini</example>
    <note>Enum: gemini (편집 가능 — 얼굴 보존 프리뷰 가능; GEMINI_API_KEY 사용), ollama (dev; 일반 텍스트→이미지만). 프로덕션에서 'gemini' 활성화는 배포 시 결정(이미지당 비용 적용); 그때까지 배포 사이트는 이미지 생성 오프 유지.</note>
  </variable>
  <variable>
    <name>GEMINI_IMAGE_MODEL</name>
    <description>GeminiImageClient용 모델 태그 (서버 전용)</description>
    <required>false</required>
    <example>gemini-2.5-flash-image</example>
    <note>"gemini-2.5-flash-image"로 기본값. 분석 제공자와 GEMINI_API_KEY 공유.</note>
  </variable>
  <variable>
    <name>OLLAMA_BASE_URL / OLLAMA_VISION_MODEL / OLLAMA_TEXT_MODEL / OLLAMA_IMAGE_MODEL</name>
    <description>Ollama 연결 + 능력별 모델 태그 (서버 전용). 기본값: http://localhost:11434 / qwen3-vl:8b / qwen3.5:9b / x/z-image-turbo.</description>
    <required>false</required>
    <note>Dev 이미지 생성은 `ollama pull x/z-image-turbo` 필요(Ollama ≥0.32, 실험 이미지 생성, macOS 먼저). x/flux2-klein은 대체안.</note>
  </variable>
  <variable>
    <name>HAIRSTYLE_RATE_LIMIT_PER_MIN</name>
    <description>analyze/recommend 엔드포인트의 클라이언트 IP별 분당 최대 요청 수</description>
    <required>false</required>
    <example>12</example>
    <note>기본값: analyze 10/분, recommend 20/분. 설정 시 이 값이 analyze 한도를 오버라이드.</note>
  </variable>
  <variable>
    <name>RATE_LIMIT_KV</name>
    <description>isolate 간 레이트 리밋 카운터용 Cloudflare KV 바인딩 (값이 아니라 wrangler 바인딩)</description>
    <required>false</required>
    <note>미바인딩 시 라우트는 best-effort isolate별 인메모리 제한기로 폴백.</note>
  </variable>
</environment_variables>

<file_structure>
src/
├── app/
│   ├── [locale]/tools/hairstyle-recommendation/
│   │   └── page.tsx                    # SSG 셸 (와이드 max-w-screen-xl): back+share 행 → ToolIntro → <HairstyleTool/> → how-to → FAQ + JSON-LD
│   └── api/hairstyle/
│       ├── analyze/route.ts            # POST: 이미지 → FaceAnalysis (즉시 폐기)
│       ├── recommend/route.ts          # POST: RecommendInput → Recommendation[]
│       └── preview/route.ts            # POST: { hairstyleId, locale } → 생성 스타일 프리뷰 이미지 (즉시; 비활성 시 503)
├── components/tools/hairstyle-recommendation/
│   ├── HairstyleTool.tsx               # "use client" 루트; useReducer(flowReducer); 2-컬럼 워크스페이스 (MAIN + sticky RAIL)
│   ├── EntryChooser.tsx                # 사진 경로 vs 무사진 경로
│   ├── PhotoDropzone.tsx               # 선택/드래그드롭/카메라 + 클라 리사이즈 + 프라이버시 고지; objectUrl 발행
│   ├── MyPhotoPanel.tsx                # 지속적인 "내 사진" 레일 카드: 미리보기 + 교체/제거 + 임시 안내
│   ├── FaceShapePicker.tsx             # 라벨 얼굴형 일러스트 (무사진 경로)
│   ├── AttributeSelectors.tsx          # 성향/길이/모질/상황 pill
│   ├── AnalysisCard.tsx                # 얼굴형 + 신뢰도 미터 + 특징
│   ├── RecommendationGrid.tsx          # 3~6 RecommendationCard
│   ├── RecommendationCard.tsx          # 이름 + 이유 + 팁 + PreviewImage
│   ├── PreviewImage.tsx                # 4:5 박스: 큐레이션 이미지 → shimmer(aria-busy) → 생성 프리뷰 fade-in / 조용한 폴백
│   └── ResultActions.tsx               # 다시 추천 / 요약 복사 / 공유 / 초기화
├── lib/ai/                             # 플랫폼 능력 계층(플랫폼 SPEC): StructuredModel/ImageGenerator 포트, GeminiClient, OllamaClient, 가드레일, env, 팩토리
├── lib/hairstyle-recommendation/
│   ├── flow.ts                         # 순수 리듀서: 단계 머신 + 사진 지속성 + 프리뷰 큐 + 성별/얼굴 프리뷰 상태 (react/SDK import 없음)
│   ├── flow.test.ts
│   ├── schema.ts                       # zod: AnalyzeRequest, RecommendRequest, PreviewRequest (+image/gender), FaceAnalysis (+gender), Recommendation, ApiEnvelope
│   ├── constants.ts                    # enum (+GENDERS), MAX_IMAGE_BYTES, MAX_EDGE_PX, JPEG_QUALITY, 레이트 리밋
│   ├── locale-templates.ts             # ko/en 백필 이유/팁 템플릿 (rev 2 — 하드코드된 영어 폴백 없음)
│   ├── catalog.ts                      # 큐레이션 HairstyleLibraryEntry[] (+genders 태그) + match(faceShape, attrs incl. gender) → 후보 ID
│   ├── catalog.test.ts
│   ├── resize.ts                       # 클라 canvas 다운스케일 헬퍼
│   ├── resize.test.ts
│   ├── prompt.ts                        # buildAnalyzePrompt / buildRecommendPrompt / buildFaceEditPrompt (구조화-JSON 계약)
│   ├── rate-limit.ts                   # IP별 토큰 버킷 (KV 또는 인메모리)
│   ├── ai/
│   │   ├── types.ts                    # HairstyleAI 인터페이스 + 제공자용 타입
│   │   ├── gemini.ts                   # GeminiProvider — 플랫폼 GeminiClient 위 얇은 어댑터
│   │   ├── ollama.ts                   # OllamaHairstyleProvider — 플랫폼 OllamaClient 위 얇은 어댑터
│   │   ├── index.ts                    # getProvider() 팩토리 (AI_PROVIDER: gemini | ollama)
│   │   └── gemini.test.ts              # 제공자 매핑/가드레일 테스트 (SDK 모킹)
│   └── index.ts                        # 배럴
├── i18n/messages/{ko,en}.json          # tools.hairstyle-recommendation.* 네임스페이스
└── tools/registry.ts                   # ToolMeta 항목 +1 (id hairstyle-recommendation)
public/hairstyles/                      # 큐레이션 참고 이미지 (webp/avif, 크레딧)
└── <hairstyleId>/<preference>.webp
scripts/
├── export-prompts.ts                   # 프로덕션 프롬프트 빌더 → evals/hairstyle/prompts.generated.json 덤프 (단일 소스)
└── generate-hairstyle-refs.ts          # 배치 생성 누락 카탈로그 참고 이미지 via ImageGenerator 포트 (커밋 전 수동 검토)
evals/                                  # Python 프롬프트 평가 하네스 (uv + LangChain + Ollama) — evals/README.md 참조
└── hairstyle/{run.py, schemas.py, fixtures.json, prompts.generated.json}
wrangler.jsonc / open-next.config.ts    # OpenNext + Workers 설정, KV + env 바인딩
</file_structure>

<core_data_entities>
  <FaceAnalysis>
    - faceShape: enum (oval, round, square, heart, oblong, diamond, triangle) — 필수
    - confidence: number (0.0–1.0, 모델 보고 확신도)
    - gender: enum (male, female, unknown) — 감지된 성별 표현; 모델이 불확실할 때 'unknown'(rev 2). 누락/무효한 제공자 출력은 'unknown'으로 고정.
    - features: string[] (0–5개 짧은 특징 메모, 예 "강한 턱선", "높은 이마"), 요청 로케일로 현지화
    - notes: string (선택, ≤ 240자, 중립적·비의학적 설명)
  </FaceAnalysis>
  <RecommendInput>
    - faceShape: enum (oval, round, square, heart, oblong, diamond, triangle) — 필수
    - gender: enum (male, female) — 선택(rev 2); 분석에서 자동 채움(명시적 'unknown' 아님), 사용자 오버라이드 가능; 생략 = 성별 필터 안 함
    - preference: enum (feminine, masculine, neutral) — 기본 neutral
    - length: enum (short, medium, long) — 선택 (생략 시 제약 없음)
    - hairType: enum (straight, wavy, curly, coily) — 선택
    - occasion: enum (daily, business, event, seasonal) — 기본 daily
    - locale: enum (ko, en) — reason/tips 언어 결정
  </RecommendInput>
  <Recommendation>
    - hairstyleId: string (HairstyleLibraryEntry.id 참조) — 필수, 카탈로그에 존재해야 함
    - name: object { ko: string, en: string } (카탈로그에서)
    - reason: string (AI: faceShape + 속성에 왜 어울리는지, ≤ 280자, 현지화)
    - tips: string[] (AI: 2~3개 스타일링/관리 팁, 각 ≤ 120자, 현지화)
    - referenceImage: object { src: string (예 /hairstyles/soft-layered-bob/feminine.webp), alt: string, credit: string }
    - tags: string[] (카탈로그에서: 예 ["volume", "low-maintenance"])
  </Recommendation>
  <HairstyleLibraryEntry>  <!-- 큐레이션 정적 카탈로그; 이미지의 정본 -->
    - id: string (kebab-case, 안정, 고유)
    - name: object { ko: string, en: string }
    - suitableFaceShapes: enum[] (7개 얼굴형의 부분집합)
    - genders: enum[] (male, female의 부분집합; both = unisex) — rev 2, 성별 hard filter + 프리뷰 모델 성별 주도
    - preference: enum (feminine, masculine, neutral)
    - length: enum (short, medium, long)
    - hairType: enum[] (straight, wavy, curly, coily의 부분집합)
    - image: object { src: string, alt: string, credit: string, license: string }
    - tags: string[]
  </HairstyleLibraryEntry>
  <ApiEnvelope>
    - ok: boolean
    - data: FaceAnalysis | { recommendations: Recommendation[] } | { image: string, mimeType: string } | null
    - error: object { code: enum (에러 코드 참조), message: string } | null
  </ApiEnvelope>
  <PreviewRequest>
    - hairstyleId: string — 카탈로그에 존재해야 함(서버 검증; unknown id → 400 VALIDATION_ERROR)
    - locale: enum (ko, en)
    - image: string (데이터 URL 또는 base64) — 선택(rev 2); 얼굴 보존 편집 경로용 사용자 사진; 디코드 시 analyze와 동일 크기 제한(≤ MAX_IMAGE_BYTES → 413)
    - mimeType: enum ALLOWED_IMAGE_TYPES — 필수 when image 현재
    - gender: enum (male, female) — 선택(rev 2); 이미지 없음/편집 비불가능 시 일반 모델 프롬프트 스티어링
  </PreviewRequest>
  <PreviewResponse>
    - image: string (데이터 URL, 예 data:image/png;base64,...) — 생성 스타일 프리뷰, 임시(서버에 저장 안 함)
    - mimeType: string (image/png | image/webp | image/jpeg)
  </PreviewResponse>
  <constants>
    - FACE_SHAPES = [oval, round, square, heart, oblong, diamond, triangle]
    - GENDERS = [male, female]; ANALYSIS_GENDERS = [male, female, unknown]
    - PREFERENCES = [feminine, masculine, neutral]; LENGTHS = [short, medium, long]
    - HAIR_TYPES = [straight, wavy, curly, coily]; OCCASIONS = [daily, business, event, seasonal]
    - MAX_IMAGE_BYTES = 5 * 1024 * 1024 (5 MB); MAX_EDGE_PX = 1024; JPEG_QUALITY = 0.85
    - MIN_RECS = 3; MAX_RECS = 6
    - RATE_LIMIT_ANALYZE_PER_MIN = 10; RATE_LIMIT_RECOMMEND_PER_MIN = 20; PREVIEW_RATE_LIMIT_PER_MIN = 30
    - PREVIEW_IMAGE_SIZE = 768×960; PREVIEW_CONCURRENCY = 2 (클라 병렬 프리뷰 요청)
    - ALLOWED_IMAGE_TYPES = [image/png, image/jpeg, image/webp]
  </constants>
</core_data_entities>

<api_endpoints>
  <endpoint name="analyze">
    <method>POST</method>
    <path>/api/hairstyle/analyze</path>
    <runtime>Cloudflare Worker (OpenNext) — Node 호환 라우트 핸들러</runtime>
    <request>
      Content-Type: application/json
      Body (zod AnalyzeRequest): { image: string (data URL 또는 base64, 디코드 시 ≤ MAX_IMAGE_BYTES), mimeType: enum ALLOWED_IMAGE_TYPES, locale: enum (ko, en) }
    </request>
    <response>200 ApiEnvelope { ok: true, data: FaceAnalysis, error: null }</response>
    <flow>
      1. 레이트 리밋 체크(IP) → 초과 시 429 RATE_LIMITED.
      2. zod 검증; 디코드 + 크기/타입 가드 → 413 IMAGE_TOO_LARGE / 415 INVALID_IMAGE.
      3. getProvider().analyzeFace(image)에 buildAnalyzePrompt(locale)로 구조화 JSON 강제(인식된 성별 지시 포함; 'unknown' 허용).
      4. 제공자 출력을 FaceAnalysis zod 스키마로 검증(누락/무효한 성별은 'unknown'으로 고정); 얼굴 없으면 → 422 NO_FACE_DETECTED.
      5. 봉투 반환. 이미지 바이트 폐기(어디에도 쓰지 않음).
    </flow>
    <errors>400 VALIDATION_ERROR, 413 IMAGE_TOO_LARGE, 415 INVALID_IMAGE, 422 NO_FACE_DETECTED, 429 RATE_LIMITED, 502 AI_UNAVAILABLE, 500 INTERNAL</errors>
  </endpoint>
  <endpoint name="recommend">
    <method>POST</method>
    <path>/api/hairstyle/recommend</path>
    <request>
      Content-Type: application/json
      Body (zod RecommendRequest = RecommendInput). 이미지 없음. 독립 동작(선행 analyze 불필요).
    </request>
    <response>200 ApiEnvelope { ok: true, data: { recommendations: Recommendation[] (MIN_RECS–MAX_RECS) }, error: null }</response>
    <flow>
      1. 레이트 리밋 체크(IP) → 429 RATE_LIMITED.
      2. zod 입력 검증.
      3. catalog.match(faceShape, attrs) → 후보 hairstyleId(상위집합). 성별 hard filter 먼저(설정 시 entry.genders ∋ input.gender); 성별 필터 풀 < MIN_RECS면 성향을 soft filter로 완화.
      4. getProvider().recommend(input, candidates)에 buildRecommendPrompt — AI가 후보 ID 중에서만 MIN..MAX개 선택/정렬하고 각 선택에 reason + tips 작성.
      5. 각 Recommendation 검증(hairstyleId ∈ 카탈로그; 길이; 현지화); 무효는 드롭; ≥ MIN_RECS 보장(모델 부족 반환 시 카탈로그로 백필 — 백필 reason/tips는 LOCALE TEMPLATES(ko/en) 사용, 절대 하드코드된 영어 아님).
      6. 카탈로그에서 referenceImage + name + tags 부착. 봉투 반환.
    </flow>
    <errors>400 VALIDATION_ERROR, 429 RATE_LIMITED, 502 AI_UNAVAILABLE, 500 INTERNAL</errors>
  </endpoint>
  <endpoint name="preview">
    <method>POST</method>
    <path>/api/hairstyle/preview</path>
    <runtime>Cloudflare Worker (OpenNext) — Node 호환 라우트 핸들러</runtime>
    <request>
      Content-Type: application/json
      Body (zod PreviewRequest): { hairstyleId: string, locale: enum (ko, en), image?: string (사용자 사진, base64/데이터 URL, 디코드 시 ≤ MAX_IMAGE_BYTES), mimeType?: enum ALLOWED_IMAGE_TYPES (image 현재 필수), gender?: enum (male, female) }
    </request>
    <response>200 ApiEnvelope { ok: true, data: { image: string (데이터 URL), mimeType: string }, error: null }</response>
    <flow>
      1. 레이트 리밋 체크(IP, PREVIEW_RATE_LIMIT_PER_MIN=30) → 429 RATE_LIMITED.
      2. zod 검증; hairstyleId 카탈로그 존재 확인 → 없으면 400 VALIDATION_ERROR. image 현재 시: 디코드 + 크기/타입 가드 → 413 IMAGE_TOO_LARGE / 415 INVALID_IMAGE.
      3. getImageGenerator() — null(IMAGE_PROVIDER 미설정/none) → 503 IMAGE_GEN_DISABLED. 클라는 이를 조용한 영구 폴백으로 취급: 프리뷰 큐 배출; 큐레이션 이미지 유지, 에러 표면 없음.
      4. 분기(rev 2, ROUTE 결정): (a) image 현재 AND generator.supportsImageEdit → buildFaceEditPrompt(catalogEntry) — 머리만 편집 지시(정체성, 피부톤, 표현, 의류, 배경·텍스트/워터마크 없음) + 사진을 `referenceImage`로; (b) 그 외 → buildStylePreviewPrompt(catalogEntry, gender) — 카탈로그 데이터만 영문 설명, 일반 모델 성별 매칭. 사용자 자유 텍스트는 어느 분기에서도 이미지 모델 도달 안 함(프롬프트 주입 안전).
      5. generateImage({ prompt, width: 768, height: 960, referenceImage? }) 180초 타임아웃 상한(로컬 Ollama는 모델 로드 포함 768px에서 1~3분 소요 가능; 호스팅 프로바이더는 훨씬 빠름) → 실패/타임아웃 시 502 AI_UNAVAILABLE.
      6. 데이터 URL 이미지와 함께 봉투 반환. 사용자 사진도 생성 바이트도 디스크/KV/로그에 절대 쓰지 않음(임시).
    </flow>
    <errors>400 VALIDATION_ERROR, 413 IMAGE_TOO_LARGE, 415 INVALID_IMAGE, 429 RATE_LIMITED, 502 AI_UNAVAILABLE, 503 IMAGE_GEN_DISABLED, 500 INTERNAL</errors>
    <client_behavior>자동 생성: 추천 렌더 시 클라는 모든 카드를 큐에 넣고 동시성 PREVIEW_CONCURRENCY(2)로 프리뷰 요청. "내 얼굴로 미리보기" ON이고 사진 있을 때만 사진을 포함(얼굴 보존 모드); 항상 알려진 유효한 성별 포함. 카드는 큐레이션 이미지 즉시 표시; shimmer 오버레이(aria-busy)가 생성 표시; 생성 이미지 fade-in with "AI generated" 칩(얼굴 보존 결과는 "내 얼굴" 변형 라벨 사용 가능). 실패 → 큐레이션 이미지 stay with "example image" 칩. 비활성(503) → 전체 큐 침묵 배출. 얼굴 프리뷰 스위치 토글 → 생성 프리뷰 무효화 + 재큐. reduced-motion: shimmer/fade 없음, 즉시 교체.</client_behavior>
  </endpoint>
  <envelope_rule>모든 엔드포인트는 ApiEnvelope 형태 반환(ok:false인 200은 사용 안 함 — 에러는 HTTP 상태 + ok:false 바디 + 타입드 code).</envelope_rule>
</api_endpoints>

<component_hierarchy>
  <app_shell>  <!-- 플랫폼 제공: ThemeProvider → IntlProvider → ConsentProvider → ToastProvider -->
    <tool_page route="/[locale]/tools/hairstyle-recommendation">
      <breadcrumb />                     <!-- 플랫폼 -->
      <intro_prose />                    <!-- 정적, 인덱싱 가능(인터랙티브 게이트 밖) -->
      <hairstyle_tool>                   <!-- "use client"; 플로우 상태 머신 소유 -->
        <entry_chooser />                <!-- 사진 경로 | 무사진 경로 -->
        <photo_dropzone />               <!-- 선택/드래그/카메라 + 클라 리사이즈 + 프라이버시 고지 -->
        <face_shape_picker />            <!-- 무사진 경로: 라벨 일러스트 -->
        <attribute_selectors />          <!-- 성향/길이/모질/상황 pill -->
        <analysis_card />                <!-- 얼굴형 + 신뢰도 미터 + 특징 -->
        <recommendation_grid>
          <recommendation_card />        <!-- ×3~6: 이름, 이유, 팁, 참고 이미지 -->
        </recommendation_grid>
        <result_actions />               <!-- 다시 추천 / 요약 복사 / 공유 / 초기화 -->
      </hairstyle_tool>
      <faq_prose />                      <!-- 정적, 인덱싱 가능 -->
      <ad_slot in_content />             <!-- 플랫폼, 높이 예약 -->
    </tool_page>
  </app_shell>

  <shared>  <!-- 여기서 재사용하는 플랫폼 제공 프리미티브 -->
    <toast />                            <!-- 성공/에러/경고 -->
    <share_buttons />                    <!-- 엔티티 절대 URL -->
    <skeleton />                         <!-- analyzing / recommending 플레이스홀더 -->
    <empty_state />                      <!-- 아이콘 + 메시지 + CTA -->
  </shared>
</component_hierarchy>

<pages_and_interfaces>
  <tool_page_layout>
    **와이드 셸 (2026-07-18, apps.jurepi.kr tool 페이지 정렬):** 컨테이너 max-w-screen-xl(1280px), 중앙, 좌우 패딩 16px(모바일)/24px(≥768px). 페이지 구성 순서: (1) back 링크 + 수평 ShareButtons 행, (2) ToolIntro — ToolCharacter 아바타(w-16 sm:w-[72px], rounded-2xl, shadow-card) + rose 카테고리 eyebrow("뷰티 도구" / "Beauty tools"; text-xs bold uppercase tracking-widest) + 디스플레이 H1(font-display) + description(max-w-2xl), (3) 인터랙티브 워크스페이스 바로 이후, (4) how-to 단계 + sm:grid-cols-3 팁 카드(border-t 분리), (5) FAQ(details/summary), (6) 푸터 노트. How-to/FAQ는 SSR 사전 렌더(SEO/GEO).
    **워크스페이스 (rev 2 — 레일 좌측):** grid grid-cols-1 lg:grid-cols-3 gap-6. 레일(lg:col-span-1, lg:sticky lg:top-20 self-start, DOM 및 데스크톱 좌측에서 첫번째): MyPhotoPanel(사진 존재 후 항상 표시; 교체/제거; 임시 안내; **"내 얼굴로 미리보기" 토글 — 사진 있을 때 기본 ON, 스위치 스타일, 한줄 임시 고지 포함**) + AnalysisCard(**+ 감지된 성별 배지**) + AttributeSelectors + 기본 CTA. 메인(lg:col-span-2, 우측): 단계 플로우 — 진입 타일 → PhotoDropzone/FaceShapePicker → RecommendationGrid + ResultActions. 설명: 입력→출력이 좌→우로 읽힘; 사용자의 사진(전)이 얼굴 보존 프리뷰(후)와 인접. DOM 순서 = 시각 순서(탭 순서 자연스러움). 모바일: 단일 열, rev 1 순서 유지; 사진 선택 후 컴팩트 sticky 사진 칩(썸네일 + 얼굴형 배지)이 워크스페이스 상단 고정. 에러는 인라인 배너로 리트라이(전체 단계 교체 아님).
    페이지 그라운드 surface-soft(#fbfbf9); 카드 표면 canvas 흰색(#ffffff), 라운드 16px(md)/32px(lg). 기본 액션 브랜드 레드(#e60023); rose 카테고리 액센트는 eyebrow/정체성 터치(DESIGN.md 따름).
  </tool_page_layout>

  <entry_chooser>
    나란한 큰 옵션 타일 2개(모바일은 스택), 각 1:1 정도, 라운드 16px, 패딩 20px, surface-card(#f6f6f3) 아이콘 타일(44px) 좌상단.
    - 타일 A "사진 업로드" (아이콘 Camera): 서브 "AI가 얼굴형을 읽어요."
    - 타일 B "얼굴형 선택" (아이콘 Scissors): 서브 "사진 없이 — 일러스트에서 고르세요."
    Hover: lift translateY(-2px) + 미묘한 보더/배경 변화, 150ms ease-out. Focus-visible: 2px outer #435ee5 + inner #ffffff (더블 링), offset 2px. Selected: 2px 브랜드 레드(#e60023) 보더 + surface-card 필(#f6f6f3).
  </entry_chooser>

  <photo_dropzone>
    점선 2px hairline 보더(#dadad3), 라운드 16px, min-height 200px, 중앙 콘텐츠: Upload 아이콘(32px, text-muted), "사진을 여기 끌거나 탭해서 선택", 작게 "PNG/JPG/WebP · 최대 5 MB".
    보더 아래: ShieldCheck 아이콘(16px, semantic-success)과 인라인 프라이버시 라인 — "사진은 1회 분석되고 저장되지 않습니다." 사진 경로에서 항상 표시.
    상태: idle(위); drag-over(2px 브랜드 레드 보더 #e60023 + surface-card 필 #f6f6f3); selected(썸네일 96×96 라운드 8px + 파일명 + "제거" 텍스트 버튼); uploading/analyzing(썸네일 흐림 + 중앙 스피너 + "얼굴형 분석 중…"). 모바일 카메라 촬영은 input capture="user".
    탭 타깃 ≥ 44px. 무효 파일: shake 200ms + 인라인 에러 텍스트(semantic-danger #ef4444, 13px) + 토스트.
  </photo_dropzone>

  <face_shape_picker>
    7개 얼굴형 일러스트 그리드(auto-fit, min 96px, gap 12px). 각: 흰 카드 속 라벨 SVG 실루엣, 라운드 16px, 하단 라벨(13px, text-secondary). Selected: 2px 브랜드 레드 보더(#e60023) + surface-card 필(#f6f6f3) + 체크 배지. 키보드: roving tabindex, 화살표 이동, Enter/Space 선택.
  </face_shape_picker>

  <attribute_selectors>
    라벨 행 5개(rev 2: 성별, 성향, 길이, 모질, 상황). 각 행: 라벨(13px, text-secondary, 600) + pill 토글 랩(행별 단일 선택). Pill: 높이 36px, 패딩 0 14px, 라운드 full(9999px), hairline 보더 #dadad3; 기본 = surface-card(#f6f6f3); selected = ink 배경(#262622) + 흰 텍스트(#ffffff). 성별 행(rev 2): 남성 / 여성 / 아무거나 pill — 분석 결과에서 자동 선택(사진 경로, 명시적 'unknown' 아님), 양 경로에서 자유롭게 오버라이드 가능; 값이 분석에서 온 경우 "자동 감지" 힌트 표시. 길이/모질/상황 선택("아무거나" pill 선택 가능). 성향 기본 Neutral. 결과 표시 후 속성 변경 시 다시 추천 활성화.
  </attribute_selectors>

  <primary_cta>
    풀폭(모바일)/자동(데스크톱) 버튼, 배경 브랜드 레드(#e60023), 텍스트 흰색(#ffffff), 높이 48px, 라운드 16px, 라벨 "추천 받기". faceShape 확정(분석 또는 선택) 전 비활성. Hover/Pressed: #cc001f. Loading: 스피너 + "스타일 찾는 중…", 버튼 비활성. 주의: 모든 액션과 강조는 브랜드 레드(#e60023) — 플랫폼 전체 단일 액센트, DESIGN 규칙.
  </primary_cta>

  <analysis_card>
    사진 경로에서 analyze 후에만 표시. 흰 카드, 패딩 20px, 라운드 16px. 좌: 얼굴형 이름(Pretendard 20px/700) + 작은 감지된 성별 배지(rev 2: "남성"/"여성" 칩, surface-card 필; 'unknown'일 때 숨김). 우: 신뢰도 미터 — 6px 높이 트랙(hairline-soft #e5e5e0) + 브랜드 레드 필(#e60023), width = confidence%, "NN% 일치"(12px, text-muted). 아래: 특징 칩(surface-card 필, 12px, text ash #91918c). confidence < 0.5면 부드러운 안내 "확실하지 않아요 — 얼굴형을 직접 고를 수 있어요" + "직접 선택" 텍스트 버튼. 등장: fade + rise 8px, 200ms.
  </analysis_card>

  <recommendation_grid>
    반응형 그리드: 1열(<640px), 2열(640–1023px), 3열(≥1024px), gap 16px. 로딩 중 예약 min-height로 CLS 보호. 로딩: 3~6 스켈레톤 카드(shimmer, reduced-motion → 정적). Empty(백필 후엔 없어야 하나): empty_state "일치 없음 — 다른 속성으로 시도" + 초기화.
  </recommendation_grid>

  <recommendation_card>
    흰 카드, 라운드 16px, overflow hidden, 플랫(기본 섀도 없음). 상단: PreviewImage — fixed aspect-ratio 4:5 박스(명시 치수, CLS 영), 큐레이션 참고 이미지 즉시 표시(object-fit cover, loading="lazy", 크레딧 캡션 우하단 on-image scrim); 스타일 프리뷰 생성 중에는 shimmer 오버레이 + aria-busy; 성공 시 생성 이미지 fade-in with "AI generated" 칩; 실패/비활성 시 큐레이션 이미지 stay with quiet "example image" 칩. 바디(패딩 16px): 헤어스타일 이름(Pretendard 17px/700), 이유(14px/1.55, text-charcoal #262622), "스타일링 팁" 라벨(12px, text-mute #62625b, 600) + 2~3 불릿 팁(13px). 푸터: 태그 칩(11px). Hover: lift translateY(-2px) + 미묘한 배경/보더 변화, 150ms. 링크 아웃 시 카드 브랜드 레드 포커스 링.
  </recommendation_card>

  <result_actions>
    그리드 아래 행: "다시 추천"(세컨더리 버튼, 아이콘 RefreshCw — 동일 입력으로 recommend 재호출), "요약 복사"(텍스트 다이제스트 복사: 얼굴형 + 스타일명 + 이유), 공유(플랫폼 ShareButtons), "처음부터"(텍스트 버튼 — 상태 초기화, 프리뷰 제거). 다시 추천은 레이트 리밋 인지; 429 시 대기 토스트 + 쿨다운 동안 비활성.
  </result_actions>

  <keyboard_shortcuts_reference>
    - Tab / Shift+Tab: 컨트롤 간 이동; 가시 포커스 링 항상.
    - 화살표: 얼굴형 픽커 + pill 그룹 내 이동(roving tabindex).
    - Enter / Space: 타일/pill/얼굴형 선택; 버튼 활성.
    - Esc: 사진 경로에서 선택 이미지 제거; 열린 메뉴 닫기.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <entry_and_input>
    - 사진 경로/무사진 경로 선택; 속성 선택을 잃지 않고 자유롭게 전환.
    - 사진 경로: 검증 → 리사이즈(canvas) → 프리뷰 → POST /analyze → AnalysisCard.
    - 무사진 경로: 일러스트에서 얼굴형 선택 → 바로 속성.
  </entry_and_input>
  <recommendation>
    - faceShape + 속성으로 POST /recommend; catalog.match가 후보 좁힘; AI가 3~6개 선택/정렬하고 reason + tips 작성; 서버가 카탈로그에서 이미지 부착.
    - 다시 추천으로 새 세트(동일 입력); 결과는 저장된 랜덤이 아니라 프롬프트 수준 다양성으로 변화.
  </recommendation>
  <output_and_share>
    - 분석 + 추천 렌더; 텍스트 요약 복사; 플랫폼 ShareButtons로 공유.
    - 초기화 시 모든 상태 + 인메모리 이미지 프리뷰 제거.
  </output_and_share>
  <resilience>
    - 얼굴 없음/낮은 신뢰도 → 수동 선택 유도(막다른 길 없음).
    - 모델 부족 반환 → 카탈로그 백필로 ≥ 3 보장.
    - 제공자 다운 → 타입드 AI_UNAVAILABLE + 재시도 어포던스.
  </resilience>
</core_functionality>

<error_handling>
  <user_facing>
    <toast_notifications>
      - 성공: semantic-success(#22c55e), 3s 자동 소멸.
      - 에러: semantic-danger(#ef4444), 소멸까지 지속.
      - 경고(예 레이트 리밋 쿨다운): semantic-warning(#f59e0b), 5s.
      - 최대 3개 스택, 가장 오래된 것부터 소멸(플랫폼 Toast).
    </toast_notifications>
    <inline_validation>
      - 무효 파일 타입/크기: 드롭존 아래 인라인 텍스트(semantic-danger, 13px) + shake 200ms + 토스트. 한도 명시("최대 5 MB · PNG, JPG, WebP").
    </inline_validation>
    <domain_errors>
      - NO_FACE_DETECTED(422): AnalysisCard 대신 인라인 안내 "얼굴을 찾지 못했어요 — 더 선명한 정면 사진을 쓰거나 얼굴형을 직접 고르세요" + "직접 선택" 버튼(무사진 경로 전환, 속성 유지).
      - 낮은 신뢰도(<0.5): 비차단 안내 + 수동 선택 어포던스.
      - 빈 추천: empty_state + 초기화(백필로 가드).
    </domain_errors>
    <offline>
      - fetch 실패: 토스트 "오프라인 상태 같아요 — 연결을 확인하고 다시 시도하세요." 버튼 재활성.
    </offline>
  </user_facing>
  <api_error_mapping>
    - 400 VALIDATION_ERROR → "요청에 문제가 있어요. 다시 시도해 주세요."
    - 413 IMAGE_TOO_LARGE → "사진이 너무 커요(최대 5 MB). 더 작은 이미지를 시도하세요."
    - 415 INVALID_IMAGE → "지원하지 않는 이미지예요. PNG, JPG, WebP를 사용하세요."
    - 422 NO_FACE_DETECTED → 도메인 안내(위).
    - 429 RATE_LIMITED → 경고 토스트 "조금 빨라요 — 잠시만 기다려 주세요." 쿨다운 동안 트리거 비활성(Retry-After 기준).
    - 502 AI_UNAVAILABLE → "스타일 어드바이저가 잠시 이용 불가예요. 다시 시도해 주세요." + 재시도 버튼. (/preview만: 큐레이션 이미지로 카드별 조용한 폴백 — 토스트 없음.)
    - 503 IMAGE_GEN_DISABLED (/preview만) → 침묵: 클라는 프리뷰 큐를 배출하고 큐레이션 이미지 유지. 에러 표면 없음.
    - 500 INTERNAL → 일반 에러 토스트; 서버 로깅(이미지 데이터 없음).
  </api_error_mapping>
  <error_boundary>플랫폼 Error Boundary가 도구 모듈을 감쌈; 폴백 UI = "문제가 발생했어요" + 초기화 버튼. dev는 콘솔 로그; prod 로그는 요청 이미지 제외.</error_boundary>
</error_handling>

<third_party_integrations>
  <integration name="Google Gemini (HairstyleAI/GeminiProvider 경유)">
    <purpose>비전 얼굴형 분석 + 추천용 텍스트 추론</purpose>
    <sdk>@google/genai (JS), 모델 gemini-2.5-flash, 서버 전용</sdk>
    <usage>
      - analyzeFace(image, locale): image part + buildAnalyzePrompt; responseMimeType application/json + FaceAnalysis 미러 responseSchema; 파싱 + zod 검증.
      - recommend(input, candidateIds, locale): 후보 hairstyleId만 나열한 텍스트 프롬프트; Recommendation[] 미러 responseSchema(id + reason + tips); 파싱 + zod 검증; 후보 밖 id 거부.
    </usage>
    <guardrails>구조화 JSON 출력 강제; temperature는 recommend ~0.6, analyze는 낮게; 서버가 후보 밖 hairstyleId 거부; 문자열 길이 캡; PII 미보존.</guardrails>
    <cost>무료 티어 친화; analyze = 이미지 호출 1회, recommend = 액션당 텍스트 호출 1회. 이미지 생성 없음(생성 비용 없음).</cost>
  </integration>
  <integration name="Ollama (dev / 오픈소스 제공자 플랫폼 OllamaClient 경유)">
    <purpose>개발 중 제로 비용 로컬 추론: 비전 분석(qwen3-vl:8b), 텍스트 추천(qwen3.5:9b), 스타일 프리뷰 이미지 생성(x/z-image-turbo 또는 x/flux2-klein)</purpose>
    <sdk>없음 — {OLLAMA_BASE_URL}(기본 http://localhost:11434)로 순 fetch: POST /api/chat(형식: JSON 스키마, images[] base64, stream:false) + POST /v1/images/generations(OpenAI 호환; Ollama ≥0.32 실험 이미지 생성)</sdk>
    <guardrails>Gemini와 동일 공유 가드레일(zod 검증 + 펜스 벗기기 + 1회 재시도); 구조화 출력은 chat `format`로 강제; 실패는 AI_UNAVAILABLE 매핑.</guardrails>
    <selection>AI_PROVIDER=ollama 그리고/또는 IMAGE_PROVIDER=ollama(독립 선택). 프로덕션은 AI_PROVIDER=gemini, IMAGE_PROVIDER 미설정 유지 — 프로덕션 이미지 제공자 선택될 때까지 연기(미결정).</selection>
  </integration>
  <swap_note>제공자 추가: ai/ 아래 새 파일에 HairstyleAI 구현, ai/index.ts에 등록, AI_PROVIDER 설정. 이미지 생성 제공자는 플랫폼 ImageGenerator 포트 구현, src/lib/ai/factory.ts에 등록(IMAGE_PROVIDER). 라우트/UI 변경 없음.</swap_note>
</third_party_integrations>

<aesthetic_guidelines>
  <inherited>ai.jurepi.kr/docs/DESIGN.md에서 DESIGN 시스템 전체 상속(브랜드 레드 #e60023 주색, 따뜻한 크림 중립 표면 canvas #ffffff / surface-soft #fbfbf9 / surface-card #f6f6f3, Gmarket Sans 디스플레이 + Pretendard 본문 모든 척도, md 16px / lg 32px / pill full 라운드, 플랫 elevation—모달 scrim 외 섀도 없음, 시맨틱 컬러, 포커스 더블 링 outer #435ee5 + inner #ffffff). 모든 액션과 강조 = 브랜드 레드(#e60023); rose 카테고리 액센트는 eyebrow/정체성 터치(DESIGN.md 따름).</inherited>
  <typography>얼굴형 + 헤어스타일 이름: Pretendard 700 (17–20px, line-height 1.1–1.2, 필요시 tight tracking). 본문/이유/팁: Pretendard 500/600 (13–14px, line-height 1.5–1.55).</typography>
  <spacing>기본 단위 4px; 카드 패딩 16–20px; 그리드 gap 16px; 블록 리듬 24px.</spacing>
  <animations>
    - 카드 hover lift: translateY(-2/-3px) + 섀도, 150ms ease-out (transform/opacity만).
    - 결과 등장: fade + rise 8px, 200ms, 카드당 ~40ms 스태거.
    - analyzing/recommending 중 스켈레톤 shimmer.
    - 무효 입력: shake 200ms.
    - prefers-reduced-motion: lift/shimmer/shake 없음 — 정적 리빌, 즉시 상태.
  </animations>
  <responsive_design>
    <breakpoints>
      - 모바일 0–639px: 단일 열; 진입 타일 스택; 그리드 1열; 기본 CTA 풀폭.
      - 태블릿 640–1023px: 진입 타일 나란히; 그리드 2열.
      - 데스크톱 1024px+: 그리드 3열; 컨테이너 max 960px 중앙.
    </breakpoints>
    <mobile_adaptations>
      - 카메라 촬영 가능(input capture="user").
      - faceShape 확정되면 작은 화면에서 도구 블록 내 기본 CTA 스티키.
      - 참고 이미지는 명시 치수로 4:5 유지(CLS 없음).
      - 탭 타깃 ≥ 44px; pill 랩.
    </mobile_adaptations>
  </responsive_design>
  <icons>lucide-react: Camera, Scissors, Upload, ShieldCheck, RefreshCw, Share2, Sparkles. 16–32px, stroke ~2.</icons>
  <accessibility>WCAG 2.1 AA. 본문 대비 ≥4.5:1 모든 색 페어링. 완전 키보드 탐색 + 가시 focus-visible 링. 얼굴형 픽커 + pill은 roving tabindex + aria-pressed/aria-selected. 신뢰도 미터 aria-valuenow. 이미지 의미 있는 alt. 상태를 색만으로 전달 안 함. prefers-reduced-motion 존중.</accessibility>
</aesthetic_guidelines>

<security_considerations>
  <image_privacy>
    - CRITICAL: 업로드 이미지는 EPHEMERAL. 메모리에서 디코드되어 제공자(분석 호출; 그리고 "내 얼굴로 미리보기" 토글이 ON인 동안 카드별 프리뷰 편집 호출에만)로 전달된 뒤 각 응답 후 폐기. 디스크/KV/R2/D1/캐시/로그에 절대 쓰지 않음. analyze 응답은 절대 사진을 에코하지 않고, preview 응답은 새로 생성된 이미지만 포함.
    - CRITICAL: 얼굴 보존 경로는 클라 동의 게이트: 토글 ON 동안만 사진이 /preview 요청에 첨부. 토글 OFF(또는 사진 없음 / 비편집 제공자) → 사진이 절대 이미지 모델 도달 안 함.
    - CRITICAL: analyze 또는 preview 라우트에서 요청 바디 로깅 금지. 에러 로그는 이미지 바이트 제외.
    - 클라이언트가 업로드 전 다운스케일(MAX_EDGE_PX 1024, JPEG_QUALITY 0.85)로 전송 데이터 최소화.
    - 프라이버시 보장과 토글은 업로더 UI에 표시.
  </image_privacy>
  <input_validation>
    - CRITICAL: 모든 요청 바디를 서버에서 zod 검증. 디코드 이미지에 ALLOWED_IMAGE_TYPES + MAX_IMAGE_BYTES 강제. 모든 속성 enum 강제. 미지 필드 거부.
    - 제공자 출력을 사용 전 zod 검증; 후보 밖 hairstyleId 거부; 문자열 길이 클램프.
  </input_validation>
  <key_isolation>
    - CRITICAL: GEMINI_API_KEY는 서버 전용. NEXT_PUBLIC_로 노출 금지. 브라우저는 제공자 직접 호출 안 함. 클라 번들에 키 참조 없는지 검증.
  </key_isolation>
  <rate_limiting>
    - IP별 토큰 버킷: analyze 10/분, recommend 20/분(구성 가능). 429 + Retry-After. RATE_LIMIT_KV 바인딩 시 KV 기반; 아니면 isolate별 폴백. IP는 키로 쓰기 전 해시.
  </rate_limiting>
  <headers_and_cors>
    - API 라우트는 same-origin만 허용; cross-origin POST 거부(Origin 확인). 표준 보안 헤더는 플랫폼(X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, HSTS, Permissions-Policy camera=(self)).
    - Permissions-Policy는 도구 origin에만 카메라 허용(모바일 촬영); microphone/geolocation 거부.
  </headers_and_cors>
</security_considerations>

<advanced_functionality>
  - 사진 실패/거부 시 어디서나 수동 얼굴형 폴백(막다른 길 없음).
  - 재분석 없이 새 추천을 위한 다시 추천.
  - 요약 복사는 공유 가능한 플레인 텍스트 다이제스트(현지화) 생성.
  - 완전 키보드 조작 + reduced-motion 동등성.
  - 두 번째 제공자 또는 Phase 2 try-on 메서드를 위한 제공자 교체 심 준비.
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>사진 경로 정상 플로우 (ko)</description>
    <steps>
      1. /ko/tools/hairstyle-recommendation 열기.
      2. "사진 업로드" 선택; 프라이버시 라인 보이는지 확인.
      3. 선명한 정면 JPG(~2 MB) 선택.
      4. POST /analyze 전 클라이언트에서 다운스케일(긴 변 ≤ 1024px)됐는지 확인.
      5. AnalysisCard가 얼굴형 + 신뢰도 미터 + 특징 칩 표시하는지 확인.
      6. 성향=Feminine, 길이=Medium, 상황=Daily 설정.
      7. "추천 받기" 탭 → POST /recommend.
      8. 3~6 추천 카드, 각각 이름·이유(ko)·2~3 팁·명시 치수 참고 이미지 확인.
      9. 이미지 로드 시 레이아웃 시프트 없음(CLS < 0.1) 확인.
      10. 다시 추천 → 유효한 새 세트 반환; 모든 hairstyleId가 카탈로그에 존재.
      11. 요약 복사 → 클립보드에 얼굴형 + 스타일명 + 이유.
      12. 어떤 네트워크 요청도 원본 풀사이즈를 나른 적 없고 서버가 아무것도 저장 안 했는지 확인.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>무사진 경로 (en)</description>
    <steps>
      1. /en/tools/hairstyle-recommendation 열기; "Pick my face shape" 선택.
      2. 일러스트에서 "Square"를 키보드로 선택(화살표 + Enter).
      3. 길이/모질 "Any" 유지; 상황=Business.
      4. 추천받기 → 이미지 없이, 선행 analyze 없이 POST /recommend 발화.
      5. 영어 이유/팁의 ≥ 3 카드 확인.
      6. analyze 엔드포인트가 호출된 적 없음 확인.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>초과/무효 이미지</description>
    <steps>
      1. 사진 경로; 12 MB HEIC/대형 PNG 드롭.
      2. 클라 거부(또는 리사이즈 후 가드) → 인라인 에러 + shake + 5 MB / PNG·JPG·WebP 한도 명시 토스트 확인.
      3. 잘못된 base64를 /analyze로 강제 → 415 INVALID_IMAGE가 친화 메시지로 매핑.
      4. 페이로드의 서버 저장/로깅 없음 확인.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>얼굴 미검출 → 수동 폴백</description>
    <steps>
      1. 얼굴 없는 사진(풍경) 업로드.
      2. /analyze가 422 NO_FACE_DETECTED 반환.
      3. 인라인 안내 + "직접 선택" 버튼 확인.
      4. 클릭 → 무사진 경로 전환, 속성 보존.
      5. 얼굴형 선택 → 추천 성공.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>레이트 리밋 + 제공자 장애</description>
    <steps>
      1. 분당 한도 초과로 /recommend 빠르게 발화.
      2. 429 RATE_LIMITED + Retry-After; 경고 토스트; 쿨다운 동안 트리거 비활성 확인.
      3. 제공자 실패 시뮬(키 미설정/무효) → 502 AI_UNAVAILABLE.
      4. 친화 에러 + 재시도 버튼; 서버 로그에 이미지 데이터 없음 확인.
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>스타일 프리뷰 자동 생성(점진적, 폴백, 비활성) + 지속적인 사진</description>
    <steps>
      1. IMAGE_PROVIDER=ollama(또는 모킹 /api/hairstyle/preview)로 양 경로 중 하나로 결과까지 완료.
      2. 모든 카드가 큐레이션 이미지를 즉시 렌더(CLS 영) + 프리뷰 요청이 동시성 2로 발화 확인.
      3. 생성 중 shimmer + aria-busy 확인; 생성 이미지 fade-in with "AI generated" 칩.
      4. 한 프리뷰 요청을 강제 실패 → 그 카드는 조용히 큐레이션 이미지 유지 with "example image" 칩; 토스트 없음.
      5. IMAGE_PROVIDER 미설정 → 첫 프리뷰가 503 IMAGE_GEN_DISABLED 반환; 클라는 큐 배출; 추가 프리뷰 요청 영; 에러 표면 없음.
      6. 업로드 사진이 MyPhotoPanel을 통해 업로드부터 결과까지 표시 유지 확인; Reset이 object URL 폐기.
      7. 프리뷰나 업로드 이미지 바이트가 서버에서 지속/로깅 없음 확인.
    </steps>
  </test_scenario_6>
  <test_scenario_7>
    <description>성별 인식 추천 + 얼굴 보존 프리뷰 (rev 2)</description>
    <steps>
      1. 명확한 남성 정면 사진으로 사진 경로(ko 로케일).
      2. /analyze가 gender='male' 반환; AnalysisCard는 남성 배지 표시; Gender pill 행이 남성을 자동 선택("자동 감지" 힌트).
      3. 추천 받기 → 반환된 모든 hairstyleId가 카탈로그 항목의 genders에 'male' 포함; 프리뷰 이미지는 남성 스타일 묘사.
      4. IMAGE_PROVIDER=gemini + MyPhotoPanel "내 얼굴로 미리보기" 토글 ON(기본)으로, 각 /preview 요청이 사용자 사진을 담음; 생성 프리뷰는 사용자 얼굴 보존(머리만 변경), "AI generated" 칩.
      5. 토글 OFF → 프리뷰 무효화 및 재큐; 이후 /preview 요청에 image 필드 없음; 결과는 일반 남성 모델 렌더.
      6. Gender pill을 여성으로 오버라이드 → 다시 추천 → 추천이 여성 태그 스타일로 전환.
      7. 백필 강제(제공자가 부족 반환 시뮬) → 백필된 카드 reason/tips는 한국어(로케일 템플릿), 절대 영어 아님.
      8. 데스크톱 ≥1024px: 레일(사진/분석/속성)이 결과 좌측 렌더; DOM 순서 = 시각 순서; 모바일 375px는 sticky 사진 칩이 상단 유지.
      9. 사진이 /analyze와(토글 ON 동안) /preview에만 전송됨 — 절대 지속/로깅되지 않음 확인.
    </steps>
  </test_scenario_7>
</final_integration_test>

<success_criteria>
  <functionality>
    - 두 진입 경로 모두 동작; 선행 analyze 유무와 무관하게 recommend 성공.
    - 성별 정확도(rev 2): 남성 사진 자동→남성 태그 스타일(역도 마찬가지); 오버라이드 pill이 재추천 시 결과 변경; 'unknown' 감지는 우아한 저하(필터 없음, 수동 선택 제공).
    - 로케일 정확도(rev 2): 모든 응답 텍스트(모델 reason/tips AND 백필 템플릿 AND 요약 복사)는 요청 로케일을 따름 — ko 응답에서 하드코드된 영어 유출 없음.
    - 반환된 모든 hairstyleId가 카탈로그에 존재; ≥ 3 추천 보장(백필).
    - 얼굴 없음/낮은 신뢰도/레이트 리밋/제공자 장애 모두 막다른 길 없이 처리.
    - 스타일 프리뷰는 IMAGE_PROVIDER 설정 시 카드별 자동 생성; 실패/비활성은 큐레이션 이미지로 조용히 降級(추천 절대 블록 아님).
    - 업로드 사진은 MyPhotoPanel을 통해 전체 플로우(업로드 → 결과)에서 표시; Reset이 object URL 폐기.
  </functionality>
  <user_experience>
    - 첫 추천까지 시간 ≈ 일반 연결에서 ≤ 4s(analyze 1회 + recommend 1회).
    - CLS < 0.1(예약 높이, 명시 이미지 치수). 완전 키보드 조작. 모바일 우선, ≥44px 타깃.
  </user_experience>
  <technical_quality>
    - 제공자 접근은 HairstyleAI만 통과; 제공자 파일 밖에서 제공자 SDK import 없음.
    - 모든 입력 AND 제공자 출력에 서버 zod 검증; 타입드 에러 봉투.
    - 카탈로그 매치·리사이즈·프롬프트 빌드·제공자 출력 매핑(SDK 모킹) 단위 테스트, 도구 lib ≥ 80%.
  </technical_quality>
  <security_privacy>
    - 이미지 저장/로깅 절대 없음(검증). 키 서버 전용(클라 번들에서 부재 검증). 레이트 리밋 활성. same-origin 강제.
  </security_privacy>
  <visual_design>
    - ai.jurepi.kr DESIGN 토큰 부합; 브랜드 레드 주색 + rose 카테고리 액센트(eyebrow/정체성); 1280px 와이드 tool 셸 + ToolIntro 헤더 + share 행. 라이트 테마 완성(다크 = Phase 2).
  </visual_design>
  <build>
    - `next build` + OpenNext 빌드 성공; Cloudflare Workers 배포; env + 선택 KV 바인딩; 도구 페이지 인덱싱 가능(JSON-LD 유효).
  </build>
</success_criteria>

<build_output>
  - 빌드: `next build` 후 `opennextjs-cloudflare build`(OpenNext 어댑터) → Cloudflare Workers 아티팩트.
  - 배포: `wrangler deploy`, GEMINI_API_KEY는 시크릿(`wrangler secret put GEMINI_API_KEY`), AI_PROVIDER + 레이트 리밋 var, 선택 RATE_LIMIT_KV 바인딩.
  - 도구 페이지는 SSG/스트림; /api/hairstyle/*는 Worker 라우트 핸들러로 실행(정적 아님).
  - 커스텀 도메인 ai.jurepi.kr(이미 보유). workers_dev 비활성(apps.jurepi.kr 미러)으로 중복 인덱싱 호스트 방지.
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. ai.jurepi.kr 플랫폼을 OpenNext/Workers로 확립 — 서버가 필요한 FIRST 도구 — UI 폴리시 전에 제공자 심 + 시크릿 처리로 `src/app/api/**`를 엔드투엔드 구동.
    2. 프라이버시 불변식(즉시 폐기 이미지, 로깅 없음) — 첫 커밋부터 analyze 라우트에 내장; 저장 없음을 검증하는 테스트 추가.
    3. 제공자 추상화 심 — SDK를 gemini.ts 안에만 엄격히 유지.
  </critical_paths>
  <recommended_implementation_order>
    1. 플랫폼 스캐폴드: OpenNext + Workers 설정, 토큰(`beauty` 카테고리 추가; 도구별 액센트 없음—모든 도구가 브랜드 레드 공유), 레지스트리 항목, i18n 네임스페이스, 도구 라우트 셸 + 인트로/FAQ 프로즈 + JSON-LD.
    2. lib: constants + zod schema + catalog(≥ 24 항목 + 이미지 시드) + resize + prompt.
    3. AI 심: types + GeminiProvider + 팩토리(+ 모킹 테스트).
    4. API: recommend 라우트 먼저(이미지 없음, 최단순), 이후 analyze 라우트(프라이버시 테스트 포함).
    5. UI: EntryChooser → FaceShapePicker + AttributeSelectors → recommend 플로우 → RecommendationGrid/Card → ResultActions. 이후 PhotoDropzone + 클라 리사이즈 + AnalysisCard → analyze 플로우.
    6. 에러/엣지 상태, a11y 패스, reduced-motion, 반응형 확인(320/375/768/1024/1440).
    7. 레이트 리밋 + 헤더, SEO/JSON-LD 검증, Lighthouse/CWV.
  </recommended_implementation_order>
  <testing_strategy>순수 lib 단위 테스트(카탈로그 매치, 리사이즈 계산, 프롬프트 형태, 제공자 출력→Recommendation 매핑 SDK 모킹). 두 라우트 통합 테스트(검증, 에러 코드, 백필, 무저장). 위 5개 시나리오 Playwright E2E; 320/768/1024/1440 스크린샷. 테스트에서 제공자 모킹 — CI에서 라이브 API 호출 금지.</testing_strategy>
  <phase_2_seam>얼굴 보존 프리뷰 출시(rev 2) via `ImageGenerator.referenceImage` + `supportsImageEdit`(GeminiImageClient, gemini-2.5-flash-image). ROUTE가 분기 결정 소유; 동의 게이트는 클라 MyPhotoPanel 토글. 남은 것: dev가 편집 경로를 오프라인에서 연습할 수 있도록 Ollama 편집 가능 백엔드(img2img 업스트림 소스 이미지 회귀 수정 대기).</phase_2_seam>
</key_implementation_notes>

</project_specification>
```
