---
name: ai-provider-integration
description: AI 프로바이더/LLM 통합, 구조화 JSON 출력, 가드레일, 모델 스왑 패턴 구현. API 키 격리, 토큰 비용 관리, 응답 검증 시스템 제공. Gemini 기본값; 프로바이더 추가는 한 파일, 호출 지점 변경 없음.
---

# AI 프로바이더 통합

ai.jurepi.kr의 모든 AI 호출은 **`HairstyleAI` 인터페이스** 뒤로 숨겨진다. 도메인은 실제 SDK를 보지 못하고, 환경변수로 선택된 프로바이더 구현만 본다. 이 패턴의 이유: 프로바이더를 바꾸거나 추가할 때 도메인 코드가 몰라도 된다. 테스트는 SDK를 모킹한다. 서버 환경 변수만으로 프로바이더가 선택된다.

## 포트 인터페이스 & 어댑터 패턴

**포트** (`src/lib/hairstyle-recommendation/ai/types.ts`):
```typescript
export interface HairstyleAI {
  analyzeFace(
    image: Buffer,
    locale: 'ko' | 'en',
    prompt: string
  ): Promise<FaceAnalysis>;
  
  recommend(
    input: RecommendInput,
    candidateIds: string[],
    locale: 'ko' | 'en',
    prompt: string
  ): Promise<Recommendation[]>;
}
```

**어댑터** (`src/lib/hairstyle-recommendation/ai/gemini.ts`):
- `@google/genai`를 **이 파일 안에만** 임포트한다.
- `GEMINI_API_KEY` 환경변수를 읽는다 (요청 시, 시작 시가 아님).
- 없으면 `AI_UNAVAILABLE` 타입 에러를 던진다.
- 모든 SDK 호출을 try-catch로 감싼다.

**팩토리** (`src/lib/hairstyle-recommendation/ai/index.ts`):
```typescript
export function getProvider(): HairstyleAI {
  const provider = process.env.AI_PROVIDER || 'gemini';
  switch (provider) {
    case 'gemini': return new GeminiProvider();
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
```

**왜 이 구조인가:**
- 프로바이더를 추가하려면: `ai/provider-name.ts` + `index.ts`의 switch 케이스 하나 추가. 도메인 코드, 라우트, UI는 변경하지 않는다.
- 도메인은 포트만 알기에, 구현체 변경에 강건하다.
- 테스트에서 포트를 모킹하면 SDK를 호출하지 않는다.

## 구조화 JSON 출력 & 검증

LLM은 비결정론적이다. JSON 필드가 빠질 수 있고, 열거형 값이 틀릴 수 있고, 문자열 길이가 넘을 수 있다. **생성 후 검증**이 필수다.

**프롬프트 내 JSON 스키마 지정:**
```typescript
// buildAnalyzePrompt(locale)는 프롬프트 문자열을 반환한다.
// 프롬프트 말미에 JSON 스키마를 임베드한다:
const prompt = `...
Respond ONLY with this JSON schema (no other text, no markdown):
{
  "faceShape": "oval" | "round" | "square" | "heart" | "oblong" | "diamond" | "triangle",
  "confidence": <number 0–1>,
  "features": [<string>, ...],
  "notes": "<string ≤ 240 chars>"
}`;
```

**SDK의 `responseSchema` / JSON 모드:**
- Gemini: `generationConfig: { responseMimeType: 'application/json', responseSchema: {...} }` 사용.
- 모델이 스키마를 따르도록 강제한다. 완벽하지 않지만, 생 텍스트보다 훨씬 낫다.

**Zod 검증 (생성 후):**
```typescript
const faceAnalysisSchema = z.object({
  faceShape: z.enum(FACE_SHAPES),
  confidence: z.number().min(0).max(1),
  features: z.array(z.string().max(100)).max(5),
  notes: z.string().max(240).optional(),
});

const parsed = faceAnalysisSchema.safeParse(JSON.parse(rawJson));
if (!parsed.success) {
  // 검증 실패: 다시 시도하거나, 정리된 에러를 던진다.
  throw new ValidationError('Invalid face analysis response');
}
```

**왜 검증인가:**
- 모델이 예상 필드를 빠뜨리거나 이름을 틀릴 수 있다.
- UI는 검증된 데이터만 받아야 한다. 타입 안전성 + 런타임 안전성.

## 가드레일: 한 번 재시도 & 복구

모델 출력이 무효하면:

1. **첫 번째 시도**: 원래 프롬프트로 호출.
2. **검증 실패**: Zod 에러 로그.
3. **재시도 한 번**: 프롬프트를 "위의 JSON이 유효하지 않았습니다. 다시 시도하세요: `{error_details}`" 로 수정해서 재호출.
4. **재시도도 실패**: 타입 에러 던짐 (`InvalidResponse`).

**필드 수정:**
- 기본값 채우기 (e.g., `confidence` 누락 → 0.5).
- 열거형 값이 오타인가? 정규화 시도, 아니면 가장 가까운 값 선택.
- 문자열이 길면 자르기 (e.g., `reason` > 280자 → 280자까지).
- 알 수 없는 필드는 버리기.

**hairstyleId 검증:**
- `recommend()` 응답의 `hairstyleId`가 전달된 `candidateIds` 집합 안에 있어야 한다.
- 없으면 제거하거나, 그 엔트리를 버린다.
- 최소 권장 수(≥3)가 보장되지 않으면, 카탈로그에서 역 채운다.

**왜 재시도인가:**
- 한 번의 오류는 흔하다. 재시도는 이 부담을 줄인다.
- 두 번 실패하면 사용자에게 표시할 수 있는 에러를 던진다.

## 서버 전용 키 격리 (필수)

`GEMINI_API_KEY`는 **절대 `NEXT_PUBLIC_`이 아니어야 한다.** 클라이언트가 절대 호출하지 않는다.

**단계:**

1. **env 파일**: `GEMINI_API_KEY=AIzaSy...` (서버 env만).
2. **GeminiProvider에서만 읽기**: 요청 시점에 읽는다.
   ```typescript
   const apiKey = process.env.GEMINI_API_KEY;
   if (!apiKey) throw new AIUnavailableError('API key not configured');
   ```
3. **클라이언트 번들 검증**: 빌드 후, `grep -r "GEMINI_API_KEY" dist/` 실행. 만약 나오면 빌드 실패.
4. **라우트는 서버 전용**: `POST /api/hairstyle/analyze`는 `src/app/api/hairstyle/analyze/route.ts` (서버 라우트).

**왜 서버 전용인가:**
- 브라우저에 노출되면 모든 사용자가 API를 남용할 수 있다.
- 클라우드플레어 워커 내에서만 실행되므로, 키는 인프라 내에 머문다.

## 비용 & 자유 계층 규칙

**Gemini 비용:**
- `gemini-2.5-flash`: 저렴, 빠름, 비전 + 텍스트 + JSON 지원.
- 이미지 분석 1회 ≈ 토큰 몇 백개.
- 권장 텍스트 1회 ≈ 토큰 몇 백–천 개.

**비용 절감:**
1. **토큰 제한**: 생성 설정에서 `maxOutputTokens: 500` (분석), `maxOutputTokens: 1200` (권장).
2. **온도**: `temperature: 0.7` (권장에서 다양성), `temperature: 0.3` (분석에서 일관성).
3. **재호출 피하기**: 한 번만 호출. 재생성하면 새 호출 = 새 비용.
4. **캐싱 주의**: 사용자 데이터는 캐시하지 않는다 (개인정보). 카탈로그나 프롬프트 템플릿은 OK.
5. **할당량 모니터링**: 요청 로그, IP별 비용 추적.

## 에러 매핑 & 사용자 피드백

프로바이더가 실패하면, 도메인이 타입 에러를 던진다:
```typescript
export enum AIErrorCode {
  UNAVAILABLE = 'AI_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMITED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
}

export class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    message: string,
    public httpStatus: number
  ) {
    super(message);
  }
}
```

**라우트가 매핑한다:**
- `AIError(AI_UNAVAILABLE, ..., 502)` → 사용자: "스타일 어드바이저를 잠시 사용할 수 없습니다."
- `AIError(VALIDATION_ERROR, ..., 422)` → 사용자: "얼굴을 감지하지 못했습니다."
- 로그는 에러 코드만 기록, 요청 본문 제외.

## Gemini 구체적 구현

Gemini 프로바이더 주요 점:
- **초기화**: 
  ```typescript
  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });
  ```
- **비전 호출**:
  ```typescript
  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ inlineData: { data: base64Image, mimeType: 'image/jpeg' } }, { text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 500 },
  });
  ```
- **텍스트 호출**:
  ```typescript
  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1200 },
  });
  ```
- **응답 추출**: `response.response.text()` → JSON 파싱 → Zod 검증.
- **에러 매핑**: `error.status === 429` → `RATE_LIMITED`, `!apiKey` → `UNAVAILABLE`.

자세한 레시피는 `references/gemini.md` 참조.

## 테스트: SDK 모킹

테스트는 실제 API를 호출하지 않는다:

```typescript
// gemini.test.ts
import { GeminiProvider } from './gemini';

jest.mock('@google/genai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => '{"faceShape":"oval","confidence":0.9,"features":["symmetric"],"notes":""}' },
      }),
    }),
  })),
}));

test('parses valid face analysis', async () => {
  const provider = new GeminiProvider();
  const result = await provider.analyzeFace(imageBuffer, 'ko', prompt);
  expect(result.faceShape).toBe('oval');
  expect(result.confidence).toBe(0.9);
});

test('retries on invalid JSON', async () => {
  // 첫 호출: 나쁜 JSON, 두 번째: 좋은 JSON 반환.
  // 재시도 로직이 작동하는지 확인.
});
```

**왜 모킹인가:**
- CI 환경에서 API 키가 없다.
- 테스트 실행이 빠르다.
- 네트워크 오류를 시뮬레이션할 수 있다.

## 체크리스트

- [ ] `src/lib/hairstyle-recommendation/ai/types.ts`: `HairstyleAI` 인터페이스 정의됨.
- [ ] `src/lib/hairstyle-recommendation/ai/gemini.ts`: 포트 구현, SDK 임포트는 이 파일 안에만.
- [ ] `src/lib/hairstyle-recommendation/ai/index.ts`: `getProvider()` 팩토리, `AI_PROVIDER` env 사용.
- [ ] Zod 스키마로 생성 후 검증 구현됨.
- [ ] 재시도 로직 (최대 1회) 구현됨.
- [ ] `GEMINI_API_KEY` 서버 전용 (NEXT_PUBLIC_ 없음, 클라이언트 번들에 없음).
- [ ] 에러는 `AIError` 타입으로 매핑됨, 사용자 메시지는 친절함.
- [ ] 프로바이더 모킹 테스트 작성됨.
- [ ] 라우트는 `getProvider().analyzeFace()` / `getProvider().recommend()` 호출만 함.
