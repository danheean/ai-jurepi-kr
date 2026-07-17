---
name: clean-architecture
description: ai.jurepi.kr(Next.js 풀스택 AI 도구)에서 클린 아키텍처 계층과 의존성 규칙을 적용하는 방법. 도메인/유스케이스/어댑터/프레임워크 4계층, 의존성은 안쪽으로만, 포트-어댑터로 경계 횡단. AI 공급자를 포트/어댑터 패턴으로 관리·전환 가능하게. 모듈을 어디에 둘지·무엇을 import해도 되는지·React/Next/AI SDK를 어떻게 격리할지 결정할 때 반드시 사용. 새 파일 배치, 계층 위반 판단, API 라우트 설계 시 적용.
---

# Clean Architecture — ai.jurepi.kr 적용

이 스킬은 ai.jurepi.kr을 **계층화된 의존성 그래프**로 다룬다. 목표는 단순하다: *비즈니스 규칙을 프레임워크와 AI 공급자로부터 보호*해서 Gemini·OpenAI·Anthropic이 바뀌어도 도메인이 흔들리지 않고, 도메인이 결정적이라 TDD가 쉬워지게 한다.

## 왜 이 프로젝트에 클린 아키텍처인가

각 AI 도구의 **응답 검증·변환·가드레일** 로직이 이 제품의 신뢰 그 자체다. 검증 로직이 라우트 핸들러 안에 얽히면 테스트도, 검증도, 공급자 전환도 불가능하다. 응답 매핑을 순수 도메인으로 떼어내면 고정 JSON 피크처로 10가지 경계 사례를 테스트할 수 있다(실제 API 호출 없음). 같은 원리가 프롬프트 구성·에러 처리·타입 강제에도 적용된다. 그래서 계층을 나눈다 — 미적 취향이 아니라 **공급자 독립성**과 **검증 가능성** 때문이다.

## 4계층과 의존성 규칙

**의존성 규칙(불변):** 소스 코드 의존성은 **항상 안쪽으로만** 향한다. 안쪽은 바깥을 모른다.

```
┌─────────────────────────────────────────────────────────┐
│ 4. Frameworks & Drivers  (app/api/**, Tailwind, Zod     │
│    검증, AI SDK 배선 @google/genai, OpenAI/Anthropic)   │  ← 세부사항
│  ┌───────────────────────────────────────────────────┐  │
│  │ 3. Interface Adapters (React 컴포넌트, 훅,          │  │
│  │    AI 공급자 어댑터 GeminiProvider/OpenAIProvider,   │  │
│  │    응답 검증기, i18n 어댑터)                          │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ 2. Use Cases (순수 응답 매퍼, 검증 흐름,     │  │  │
│  │  │    프롬프트 구성 로직)                        │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │ 1. Domain/Entities (AI 공급자 포트,    │  │  │  │
│  │  │  │    응답 타입·불변식, 순수 에러 처리)    │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

| 계층 | 소유 | import 허용 | import 금지 |
|------|------|------------|------------|
| 1 도메인 | 순수 타입·포트·불변식 (`src/domain/ai-provider.ts` 포트, 응답 에러 타입) | 표준 JS, 같은 계층 | `react`, `next`, `@google/genai`, 모든 AI SDK |
| 2 유스케이스 | 순수 응답 매퍼, 검증 흐름, 프롬프트 구성 | 도메인 | `react`, `next`, AI SDK |
| 3 어댑터 | React 컴포넌트·훅, **AI 공급자 어댑터** (`GeminiProvider`), Zod 검증 | 유스케이스, 도메인, `react`, AI SDK | 다른 어댑터의 내부 구현에 강결합 |
| 4 프레임워크 | `app/api/**` 라우트, 환경 설정, 공급자 의존성 주입 | 모든 안쪽 + 프레임워크 | (없음 — 가장 바깥) |

> 상세 파일별 매핑과 "이 import는 합법인가?" 판정표는 `references/layer-map.md`를 읽어라.

## 경계 횡단 = 포트 & 의존성 주입

안쪽 계층이 바깥 능력(AI 공급자·저장소·시간)이 필요하면, **안쪽이 인터페이스(포트)를 정의**하고 바깥이 구현(어댑터)을 주입한다. 제어 흐름은 바깥→안이지만, 소스 의존성은 안→인터페이스로 유지된다(의존성 역전).

```typescript
// 도메인이 AI 공급자 포트를 정의 — 구현(Gemini/OpenAI)은 모른다
export interface AIProvider {
  generateContent(prompt: string, options?: GenerationOptions): Promise<AIResponse>;
  // 구현체는 이 메서드만 제공하면 됨
}

// 유스케이스: 응답을 순수적으로 검증·변환
export function parseAndValidateResponse(raw: unknown): Result<ParsedContent, ValidationError> { 
  // Zod 스키마로 타입 강제, AI SDK는 전혀 모름
}

// 어댑터: Gemini 공급자 구현
export class GeminiProvider implements AIProvider {
  constructor(private apiKey: string) {}
  async generateContent(prompt: string) {
    const response = await googleGenAI.generateContent(prompt); // @google/genai 사용
    return response;
  }
}

// 라우트 핸들러(프레임워크): 어댑터를 의존성으로 주입
export async function POST(req: Request) {
  const provider = new GeminiProvider(process.env.GEMINI_API_KEY!);
  const raw = await provider.generateContent(userPrompt);
  const validated = parseAndValidateResponse(raw); // 도메인 검증
  return validated;
}

// 테스트: 가짜 공급자를 주입 → 단위 테스트에 API 호출 없음
class FakeProvider implements AIProvider {
  async generateContent() { return fixtures.sampleResponse; }
}
```

이렇게 하면: (1) 도메인은 `@google/genai` 몰라도 됨 — 포트만 구현하면 OpenAI로 전환 가능. (2) 검증 로직을 실제 API 호출 없이 테스트 가능. (3) 프롬프트 구성, 응답 매핑, 에러 처리를 모두 순수 함수로 검증.

## API 라우트 핸들러 = 프레임워크 계층

`src/app/api/**` 라우트 핸들러가 **프레임워크 계층**이다. 환경 변수 읽기, AI 공급자 선택, 라우팅, HTTP 상태 코드 응답을 여기서 한다. 도메인·유스케이스는 라우트 핸들러에 **절대 들어가지 않는다**.

```typescript
// src/app/api/tools/translate/route.ts (프레임워크)
export async function POST(req: Request) {
  const { text, targetLang } = await req.json(); // HTTP 파싱
  
  // 1. 어댑터 선택
  const provider = process.env.AI_PROVIDER === 'openai' 
    ? new OpenAIProvider(process.env.OPENAI_API_KEY!)
    : new GeminiProvider(process.env.GEMINI_API_KEY!);
  
  // 2. 도메인 호출 (비즈니스 로직은 여기서 시작)
  const result = await translateTool.execute(text, targetLang, provider);
  
  // 3. HTTP 응답
  if (result.ok) {
    return Response.json({ data: result.value });
  } else {
    return Response.json({ error: result.error }, { status: 400 });
  }
}
```

이 구조는 공급자 전환이 라우트 핸들러만 영향을 미치게 하고, 도메인은 완전히 격리한다.

## 적용 체크리스트

- [ ] 도메인/유스케이스 파일에 `react`/`next`/`@google/genai`/OpenAI SDK import가 없는가
- [ ] 응답 검증·매핑이 컴포넌트/라우트가 아니라 도메인/유스케이스에 있는가
- [ ] AI 공급자가 포트(인터페이스)로 의존성 주입되는가(하드 의존 아님)
- [ ] 응답 처리가 순수 함수로 추출되어 실제 API 호출 없이 테스트 가능한가
- [ ] 새 파일이 올바른 계층에 있고 허용된 것만 import하는가
- [ ] AI 공급자 전환(Gemini↔OpenAI)이 도메인을 건드리지 않는가
- [ ] 라우트 핸들러가 HTTP 파싱·응답 형식만 담당하고, 비즈니스 로직은 도메인을 호출하는가

## 안티패턴 (하지 말 것)

- 라우트 핸들러 안에서 `provider.generateContent()` 직후 응답을 파싱·검증 → 도메인 함수로 추출.
- 도메인 함수가 `@google/genai` 또는 다른 AI SDK를 직접 호출 → 포트로 주입.
- React 컴포넌트 `useEffect` 안에서 프롬프트 구성·응답 검증을 직접 구현 → 도메인으로 추출.
- "나중에 다른 공급자 지원 예정" 추상화 선제 도입 → 실제 두 번째 공급자가 필요할 때 도입(YAGNI).
