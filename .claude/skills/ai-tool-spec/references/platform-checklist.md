# 플랫폼 통합 체크리스트

새 AI 도구를 ai.jurepi.kr에 추가할 때 완료해야 할 플랫폼 항목.

## 1. 카테고리 & 디자인 토큰

```
[ ] src/tools/types.ts
    - ToolCategory enum 업데이트 (필요시)
    - 예: type ToolCategory = 'beauty' | 'productivity' | 'wellness'

[ ] src/styles/tokens.css
    - 새 카테고리의 accent 색상 변수 추가:
      --accent-wellness: #...;
      --accent-wellness-soft: #...;
      --accent-wellness-ink: #...;
    - 밝은 테마 + 어두운 테마 모두 정의
    - 대비 검증: 각 -ink 색상이 -soft 위에서 WCAG AA (≥4.5:1)

[ ] docs/DESIGN.md
    - 새 accent 색상 섹션 추가
    - 사용 규칙: "accent는 identity만, CTA는 항상 brand honey-gold"
```

## 2. 도구 레지스트리

```
[ ] src/tools/registry.ts
    - ToolMeta 한 개 항목 추가:
      {
        id: 'new-tool-id',           // 카멜케이스, unique
        slug: 'new-tool',            // URL 경로용
        codename: 'new_tool',        // 내부 참조 (파일명)
        category: 'wellness',        // ToolCategory enum 값
        accent: 'wellness',          // tokens.css 변수 이름
        status: 'live',              // 'live' | 'beta' | 'coming'
        title: { ko: '...', en: '...' },
        description: { ko: '...', en: '...' },
      }
    - 타입 검증: tsc 통과
```

## 3. 라우트 & SEO

```
[ ] src/app/[locale]/tools/[tool-slug]/page.tsx
    - 도구 페이지 컴포넌트 생성
    - 구조: 정적 intro + FAQ + <ClientTool/> + ad slot
    - metadata 함수:
      export async function generateMetadata({
        params: { locale, tool },
      }) {
        return {
          title: '...',
          description: '...',
          canonical: `https://ai.jurepi.kr/${locale}/tools/${tool}`,
          openGraph: { ... },
        };
      }
    - JSON-LD: SoftwareApplication + FAQPage + BreadcrumbList

[ ] 도구 페이지 콘텐츠
    - Long-form intro (indexable, 300–500 words)
    - FAQ section (5–10 Q&A)
    - Tool component mount point: <HairstyleTool />

[ ] Ad slot (platform 제공)
    - 높이 예약 (CLS 방지)
    - 위치: intro 후 또는 결과 그리드 하단
```

## 4. API 라우트

```
[ ] src/app/api/[tool-prefix]/route.ts (또는 subdirs)
    - 도구별 엔드포인트 그룹:
      /api/wellness/analyze
      /api/wellness/generate
      등등
    - 각 route.ts:
      export async function POST(request: Request) {
        // 1. 레이트 제한 확인
        // 2. zod 검증
        // 3. 비즈니스 로직
        // 4. 타입 응답
      }
    - 에러 응답: ApiEnvelope (ok: false, error: { code, message })
    - 없음 로깅: 요청/응답에 사용자 이미지 제외
```

## 5. i18n 네임스페이스

```
[ ] src/i18n/messages/ko.json
    tools: {
      [tool-id]: {
        title: '...',
        description: '...',
        button_primary: '...',
        error_validation: '...',
        status_loading: '...',
        // ... UI 메시지
      }
    }

[ ] src/i18n/messages/en.json
    - 같은 구조, 영어 번역
    - next-intl useTranslations() 호출: t('tools.[tool-id].key')
```

## 6. 콘텐츠 & 사이트맵

```
[ ] docs/content.ts (또는 해당 파일)
    - 도구 페이지 SEO 콘텐츠 블록:
      {
        tool: 'new-tool',
        locale: 'ko',
        title: '...',
        description: '...',
        url: '/ko/tools/new-tool',
      }

[ ] Sitemap 생성
    - 동적 또는 정적 생성에서 /[locale]/tools/[tool] 포함
    - canonical 검증: https://ai.jurepi.kr/[locale]/tools/[tool]
```

## 7. 타입 & 검증

```
[ ] src/lib/[tool]/schema.ts
    - Zod 스키마: 요청, 응답, 모든 엔티티
    - Enum 모두 명시
    - export type [Entity] = z.infer<typeof [Entity]Schema>

[ ] 테스트
    - 각 schema unit test
    - 유효/무효 입력 케이스
```

## 8. 환경 변수

```
[ ] .env (local development)
    AI_PROVIDER=gemini
    GEMINI_API_KEY=AIzaSy...
    [TOOL_NAME]_RATE_LIMIT_PER_MIN=12
    RATE_LIMIT_KV=[KV 바인딩 이름, 선택]

[ ] wrangler.env.production (또는 wrangler.jsonc)
    - 프로덕션 secrets: wrangler secret put GEMINI_API_KEY
    - 변수: AI_PROVIDER, rate limit vars

[ ] 검증
    - 빌드 시: grep -r "NEXT_PUBLIC_GEMINI" dist/ → 없어야 함
    - 서버 런타임에서만 GEMINI_API_KEY 읽기
```

## 9. AI 프로바이더 통합

```
[ ] src/lib/[tool]/ai/types.ts
    - 도구별 AI 인터페이스 정의

[ ] src/lib/[tool]/ai/gemini.ts (또는 provider.ts)
    - HairstyleAI 구현
    - @google/genai 임포트 (이 파일만)
    - 에러 매핑, 검증, 재시도

[ ] src/lib/[tool]/ai/index.ts
    - getProvider() 팩토리
    - AI_PROVIDER env 스위칭

[ ] 테스트
    - SDK 모킹
    - 유효/무효 응답 케이스
    - 재시도 로직
```

## 10. 컴포넌트 & 상태

```
[ ] src/components/tools/[tool]/
    - Root 컴포넌트 (use client)
    - 상태 머신 (idle, loading, success, error)
    - 자식 컴포넌트들
    - 스타일: Tailwind + tokens.css 변수

[ ] 접근성 (a11y)
    - 모든 상호작용 요소: tab order
    - 포커스 링 (focus-visible)
    - ARIA: aria-label, aria-pressed, role
    - reduced-motion: @media prefers-reduced-motion
    - 색상 대비: WCAG AA (밝음/어둠 모두)

[ ] 반응성
    - 브레이크포인트: 320, 375, 640, 768, 1024, 1440
    - 이미지: explicit width/height (CLS 방지)
    - 터치: tap target ≥ 44px
```

## 11. 에러 처리

```
[ ] API 에러 코드 정의
    - 400 VALIDATION_ERROR
    - 413 PAYLOAD_TOO_LARGE
    - 422 DOMAIN_LOGIC (e.g. NO_FACE_DETECTED)
    - 429 RATE_LIMITED
    - 502 AI_UNAVAILABLE
    - 500 INTERNAL

[ ] 사용자 메시지 (친절함)
    - 기술 세부사항 숨기기
    - 행동 (retry, contact support)

[ ] 토스트/인라인 피드백
    - 성공: green, 3s auto-dismiss
    - 에러: red, persistent
    - 경고: amber, 5s
```

## 12. 테스트 & 검증

```
[ ] Unit 테스트
    - lib 함수, schema 검증, provider 모킹
    - 커버리지 ≥ 80%

[ ] E2E 테스트 (Playwright)
    - SPEC의 final_integration_test 시나리오
    - 스크린샷: 320, 768, 1024, 1440
    - 플로우: 입력 → API → 결과 → 상호작용

[ ] Performance
    - Lighthouse: CWV 타겟 충족
    - CLS < 0.1 (레이아웃 시프트 없음)
    - LCP < 2.5s
    - 번들 크기: JS < 150kb (gzipped)
```

## 13. 최종 확인

```
[ ] next build 성공
[ ] OpenNext 빌드 성공
[ ] 로컬에서 wrangler dev 실행 + 도구 페이지 테스트
[ ] i18n: /ko/tools/[tool] + /en/tools/[tool] 모두 작동
[ ] 사이트맵 포함 (또는 동적 생성)
[ ] JSON-LD 유효 (schema.org 검증기)
[ ] 보안 체크:
  - API 키 노출 없음 (grep)
  - CORS 헤더 올바름
  - 레이트 제한 활성화
  - 입력 검증 완료
```

---

**SPEC을 먼저 완성하고, 이 체크리스트를 따르면, 추가 도구들은 빠르고 일관되게 배포될 것이다.**
