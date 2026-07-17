---
name: ai-tool-spec
description: 새 AI 도구 추가 시, SPEC 작성 워크플로우. 도구 명세서 저술(영문 SPEC.md + 한문 SPEC_KR.md). 카테고리/색상토큰/레지스트리/라우트/API/사이트맵 플랫폼 체크리스트 포함. hairstyle-recommendation SPEC을 템플릿으로 재사용.
---

# AI 도구 SPEC 저술

ai.jurepi.kr에 새 AI 도구를 추가할 때, **먼저 SPEC을 작성한다.** 이것은 구현을 안내하는 단일 출처 문서다. SPEC이 없으면 구현자는 추측한다. 실제로, `docs/services/<category>/<tool>/SPEC.md`가 **canonical** 문서라는 뜻이다 — 코딩 에이전트가 읽는다.

## 단계 1: SPEC 구조 (템플릿)

`docs/services/beauty/hairstyle-recommendation/SPEC.md`를 템플릿으로 사용한다. 모든 새 도구는 다음 섹션을 가져야 한다:

### 헤더 블록 (맨 위)

```markdown
# [도구명] — [부제] — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. 
> The Korean translation lives in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync.
>
> Build specification for **[도구명] (한글명)** — the [n]-th AI tool on ai.jurepi.kr.
> [2–3줄 기능 설명] ...
>
> Internal codename: `[codename]`. Registry id: `[id]`. Public URL slug: `/[locale]/tools/[slug]`. 
> Category: `[category]` (new or existing). Accent: `[accent]` (new or reuse).
>
> **CRITICAL — [도구 제약]:** [1–2줄 핵심 요구사항]
```

**왜 이 헤더인가:**
- Codename은 내부 참조용 (파일 이름).
- Registry id는 도구 registry에서의 식별자.
- Slug는 URL 경로.
- 카테고리는 플랫폼 `ToolCategory` 추가를 여부 결정.
- Accent는 디자인 시스템 새 색상 토큰 추가 여부 결정.

### 필수 섹션 (이 순서)

1. **overview**: 사용자 관점 기능, 서버/AI 제약, 핵심 흐름.
2. **platform_integration**: 라우트, API 엔드포인트, 기존 제공 서비스, 신규 추가할 플랫폼 기능.
3. **scope_boundaries**: in_scope, out_of_scope, future_considerations.
4. **technology_stack**: 상속된 것 + 도구 고유.
5. **environment_variables**: 서버/클라이언트 구분, 필수/선택, 예시.
6. **file_structure**: 디렉터리 레이아웃 + 각 파일 1줄 설명.
7. **core_data_entities**: 모든 타입(zod enum 포함), 명세 단위.
8. **api_endpoints**: HTTP 메서드, 경로, 요청/응답 스키마, 흐름, 에러 코드.
9. **component_hierarchy**: React 컴포넌트 트리 (제공 기반 + 도구 고유).
10. **pages_and_interfaces**: UI 상세 (레이아웃, 상태, 인터랙션, 스타일, 반응성, 키보드).
11. **core_functionality**: 주요 작동 로직 (영역 중심).
12. **error_handling**: 사용자 대면 메시지, API 에러 매핑, 경계.
13. **third_party_integrations**: AI 프로바이더, 기타 외부 서비스.
14. **aesthetic_guidelines**: 디자인 토큰, 타이포그래피, 애니메이션, 반응성, 접근성.
15. **security_considerations**: 이미지/데이터 개인정보, 입력 검증, 키 격리, 레이트 제한, CORS.
16. **advanced_functionality**: 추가 특수 기능.
17. **final_integration_test**: 5–6개 테스트 시나리오 (행복 경로 + 엣지).
18. **success_criteria**: 기능성, UX, 기술, 보안, 비주얼, 빌드 (체크리스트).
19. **build_output**: 빌드/배포 커맨드, 아티팩트.
20. **key_implementation_notes**: 중대 경로, 권장 구현 순서, 테스트 전략, 페이즈 2 시뮬레이션.

**섹션 깊이:**
- overview: 1–2 단락 + 3–4개 CRITICAL 불릿.
- 각 상세 섹션: 1–2 단락 + 목록/코드 블록.
- 없는 내용은 리스트로 간단히: `- 없음`.
- 반복되는 개념은 "상속" 표기 (예: design system).

## 단계 2: 플랫폼 통합 체크리스트

SPEC 작성 중, 이 항목들을 완료하도록 마크한다:

### 카테고리 & 색상 추가
- [ ] `src/tools/types.ts`에서 `ToolCategory` enum: `'beauty' | 'productivity' | ...` 추가 (필요시).
- [ ] `src/styles/tokens.css`: 새 카테고리의 accent 색상 변수 추가.
  ```css
  --accent-wellness: #...;
  --accent-wellness-soft: #...;
  --accent-wellness-ink: #...;
  ```
- [ ] `docs/DESIGN.md`: 새 색상 정의 및 사용 규칙 업데이트.
- [ ] 색상 대비: 밝은/어두운 테마 모두에서 WCAG AA (≥4.5:1) 검증.

### 레지스트리 엔트리
- [ ] `src/tools/registry.ts`: `ToolMeta` 하나 추가:
  ```typescript
  { 
    id: 'new-tool-id', 
    slug: 'new-tool', 
    codename: 'new_tool',
    category: 'category',
    accent: 'accent-name',
    status: 'live',
    title: { ko: '...', en: '...' },
    description: { ko: '...', en: '...' },
  }
  ```

### 라우트 & 메타데이터
- [ ] `src/app/[locale]/tools/[tool-slug]/page.tsx`: 도구 페이지 추가.
- [ ] `generateMetadata()`: SEO 타이틀, 설명, OG 이미지, 캐노니컬.
- [ ] SSG/스트리밍: "인덱스 가능한 정적 콘텐츠 + 클라이언트 도구" 구조.

### API 라우트
- [ ] `src/app/api/[tool-prefix]/**`: 도구별 API 라우트 디렉터리.
- [ ] route.ts 파일: 요청 검증 + 에러 매핑 + 응답 타입 정의.

### i18n 네임스페이스
- [ ] `src/i18n/messages/ko.json`, `en.json`: `tools.[tool-id].*` 네임스페이스 추가.
- [ ] 필수 키: `title`, `description`, 상태 메시지, 버튼 레이블, 에러 메시지.

### 콘텐츠 & 사이트맵
- [ ] `docs/content.ts` (또는 해당 파일): 도구 페이지 SEO 블록.
- [ ] `public/sitemap.xml` 또는 동적 생성 함수: 도구 URL 포함.

## 단계 3: 핵심 데이터 엔티티 명세

**모든 타입을 Zod로 정의해야 한다:**

```typescript
// schema.ts
export const RecommendInputSchema = z.object({
  category: z.enum(['wellness', 'productivity']),
  preference: z.enum(['casual', 'formal']).optional(),
  // ... 모든 필드
});

export type RecommendInput = z.infer<typeof RecommendInputSchema>;
```

**SPEC에 나열:**
- 각 엔티티의 필드 타입, 범위, 제약.
- Enum 값 전부.
- 선택사항 vs 필수.
- 예시 JSON.

**왜 완전한 명세인가:**
- 타입 안전성: 구현자가 놓칠 게 없다.
- 테스트: 속성 하나하나를 테스트한다.
- 버전 관리: 미래의 도구 수정 시 기준이 된다.

## 단계 4: API 엔드포인트 정의

각 엔드포인트:

```yaml
endpoint:
  method: POST
  path: /api/tool/action
  request:
    - Content-Type: application/json
    - body schema (zod ref)
  response:
    - 200: success envelope
    - 400, 429, 502: typed error
  flow:
    1. rate-limit check
    2. request validation
    3. business logic
    4. response format
  errors:
    - code: error code
      http: status
      user message: friendly text
```

**왜 이 세부사항인가:**
- 프론트엔드는 정확한 요청/응답을 알아야 한다.
- QA는 에러를 시뮬레이션한다.
- 모킹은 SPEC을 기반으로 한다.

## 단계 5: 보안 & 개인정보 절 (필수)

반드시 포함:

- **AI 출력**: 사용자 데이터가 로그/캐시되는가? 아니어야 한다 (ephemeral 규칙).
- **API 키**: 서버 전용이어야 한다. NEXT_PUBLIC_ 금지.
- **입력 검증**: zod는 필수. 실행 첫 줄.
- **레이트 제한**: IP별, 분당 몇 요청? 429 응답?
- **CORS**: 같은 출처만? 헤더 설정?
- **에러 메시지**: 민감한 정보를 폭로하는가? (PII, 스택 트레이스 금지)

SPEC에서 이 조항들을 명시하면, 구현 시 자동으로 확인된다.

## 단계 6: 최종 통합 테스트 시나리오

**5–6개 시나리오:**
1. 행복 경로 (ko).
2. 행복 경로 (en).
3. 엣지 케이스 (입력 오류).
4. 오류 복구 (자동 폴백).
5. 레이트 제한 / API 다운.
6. (선택) 고급 기능.

각 시나리오:
- **설명**: 테스트 목표.
- **단계**: 클릭-클릭-클릭 순서.
- **검증**: 예상 결과, 상태 코드, 화면 내용.

**왜 SPEC에 테스트인가:**
- E2E 테스트는 SPEC을 따른다.
- QA는 이 시나리오들을 스크립트로 변환한다.
- 다후 (regression) 테스트 기준.

## 단계 7: 영어 + 한국어 동기화

SPEC.md (영어) 작성 후:

1. **SPEC_KR.md** 복사본 만들기.
2. **헤더** 수정:
   ```markdown
   > 이 문서는 **영문 정본**입니다. 한국어 번역은 [`SPEC_KR.md`](SPEC_KR.md)입니다.
   > 변경 시 두 파일을 동기화하세요.
   ```
3. **핵심 섹션만 번역**: overview, scope, error handling, security, success_criteria.
4. **코드/타입은 그대로**: 대부분의 기술 SPEC (schema, endpoint, file structure)은 언어 무관.
5. **동기화 스크립트** (선택): 두 파일의 버전 차이를 감지하는 CI 체크.

**왜 두 파일인가:**
- 한국 사용자: 한국어로 읽는 게 명확.
- 구현자/에이전트: 영문 정본이 진실의 원천 (코딩은 영어).
- 번역 드리프트: 동기화 규칙으로 방지.

## 단계 8: 성공 기준 확인

SPEC의 "success_criteria" 섹션이 **테스트 가능한가?**

```markdown
- [ ] 기능: "recommend succeeds with X, Y, Z inputs" ← 측정 가능
- [ ] UX: "time-to-first-result ≤ 3s" ← Lighthouse/Network 측정
- [ ] 기술: "80% unit test coverage" ← Coverage report 확인
- [ ] 보안: "no image stored (verified)" ← 서버 로그 audit
- [ ] 시각: "matches DESIGN tokens" ← 스크린샷 대비
- [ ] 빌드: "`next build` succeeds" ← CI 통과
```

**각 항목이 "하는 일" 동사를 가져야 한다** (측정, 검증, 실행).

## 체크리스트

- [ ] SPEC.md: 최소 5000 토큰 (deep spec).
- [ ] 헤더 블록: codename, id, slug, category, accent 명시.
- [ ] 모든 20개 섹션 포함 (또는 "적용 안 됨" 명시).
- [ ] 모든 데이터 엔티티 + Zod enum 정의.
- [ ] API 엔드포인트: 요청/응답/에러 명시.
- [ ] 보안 섹션: 키 격리, 입력 검증, 개인정보, 레이트 제한.
- [ ] 성공 기준: 측정 가능 (체크박스 형식).
- [ ] 통합 테스트: 5–6 시나리오, 단계 명시.
- [ ] 플랫폼 체크리스트: 카테고리/색상/레지스트리/라우트/API 항목 확인.
- [ ] SPEC_KR.md: 영문 정본과 동기화, 핵심 섹션 번역.
- [ ] 도구 고유: 다른 도구와 복붙 안 함, 실제 요구사항 반영.

## 구현 순서 (SPEC 후)

SPEC이 완성되면, 구현 순서 권장:

1. **플랫폼 스캐폴드**: 카테고리/색상 추가, 레지스트리, 라우트 껍질.
2. **데이터 + 타입**: schema.ts, 카탈로그 (또는 데이터 소스).
3. **AI 통합**: `ai-provider-integration` 스킬로 HairstyleAI 구현.
4. **API 라우트**: 입력 검증, 비즈니스 로직, 에러 매핑.
5. **UI**: 컴포넌트 계층, 상태 머신, 인터랙션.
6. **엣지 + a11y**: 에러 상태, 키보드, reduced-motion, 색상 대비.
7. **성능**: 라이트하우스, CWV, 번들 크기.
8. **테스트**: E2E, unit, integration (SPEC 시나리오 기반).

**각 단계는 SPEC 섹션을 참조한다.**
