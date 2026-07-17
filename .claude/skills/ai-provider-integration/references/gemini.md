# Gemini 프로바이더 구현 레시피

Gemini 2.5 Flash를 위한 구체적인 구현 패턴.

## 초기화

```typescript
import { GoogleGenerativeAI } from '@google/genai';

class GeminiProvider implements HairstyleAI {
  private genai: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIError('AI_UNAVAILABLE', 'Gemini API key not configured', 502);
    }
    this.genai = new GoogleGenerativeAI({ apiKey });
    this.model = this.genai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are a professional hairstyle advisor.',
    });
  }
```

## analyzeFace 호출 (비전)

```typescript
async analyzeFace(
  image: Buffer,
  locale: 'ko' | 'en',
  prompt: string
): Promise<FaceAnalysis> {
  try {
    const base64 = image.toString('base64');
    const mimeType = 'image/jpeg';

    const response = await this.model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 500,
        temperature: 0.3, // 일관성
      },
    });

    const rawJson = response.response.text();
    const parsed = faceAnalysisSchema.safeParse(JSON.parse(rawJson));

    if (!parsed.success) {
      throw new AIError('VALIDATION_ERROR', 'Invalid face analysis response', 422);
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof AIError) throw error;
    if (error?.status === 429) {
      throw new AIError('RATE_LIMITED', 'Too many requests', 429);
    }
    throw new AIError('UNAVAILABLE', 'Gemini API error', 502);
  }
}
```

## recommend 호출 (텍스트)

```typescript
async recommend(
  input: RecommendInput,
  candidateIds: string[],
  locale: 'ko' | 'en',
  prompt: string
): Promise<Recommendation[]> {
  try {
    const response = await this.model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 1200,
        temperature: 0.7, // 다양성
      },
    });

    const rawJson = response.response.text();
    const parsed = recommendationsSchema.safeParse(JSON.parse(rawJson));

    if (!parsed.success) {
      throw new AIError('VALIDATION_ERROR', 'Invalid recommendations response', 422);
    }

    // hairstyleId 검증: candidateIds 내에만
    const validated = parsed.data
      .filter((rec) => candidateIds.includes(rec.hairstyleId))
      .slice(0, 6); // MAX_RECS

    if (validated.length < 3) {
      // 부족하면 backfill (separate function)
      return backfillRecommendations(validated, candidateIds, input);
    }

    return validated;
  } catch (error) {
    if (error instanceof AIError) throw error;
    if (error?.status === 429) {
      throw new AIError('RATE_LIMITED', 'Too many requests', 429);
    }
    throw new AIError('UNAVAILABLE', 'Gemini API error', 502);
  }
}
```

## 에러 매핑

```typescript
private handleError(error: unknown): AIError {
  if (error instanceof AIError) return error;

  // Gemini SDK 에러
  const sdkError = error as any;
  
  if (sdkError?.status === 429 || sdkError?.message?.includes('rate limit')) {
    return new AIError('RATE_LIMITED', 'Request rate limited', 429);
  }

  if (sdkError?.status === 401 || sdkError?.message?.includes('authentication')) {
    return new AIError('UNAVAILABLE', 'Authentication failed', 502);
  }

  if (sdkError?.status >= 500) {
    return new AIError('UNAVAILABLE', 'API service unavailable', 502);
  }

  // 기본값
  return new AIError('UNAVAILABLE', 'Unexpected API error', 502);
}
```

## JSON 스키마 힌트

프롬프트에 임베드할 스키마:

```json
{
  "faceShape": "oval | round | square | heart | oblong | diamond | triangle",
  "confidence": "number between 0 and 1",
  "features": ["string", "..."],
  "notes": "string, max 240 chars"
}
```

권장:
```json
[
  {
    "hairstyleId": "string (kebab-case)",
    "reason": "string, max 280 chars, localized",
    "tips": ["string", "string", "string"]
  }
]
```

## 재시도 로직

```typescript
private async retryOnFailure<T>(
  fn: () => Promise<T>,
  validator: (result: unknown) => boolean,
  maxAttempts: number = 2
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (validator(result)) return result;
      if (attempt < maxAttempts) {
        // 다시 시도 신호를 프롬프트에 담기
        continue;
      }
      throw new AIError('INVALID_RESPONSE', 'Response validation failed', 422);
    } catch (error) {
      if (attempt === maxAttempts) throw error;
    }
  }
}
```

## 주요 차이점 (다른 프로바이더와 비교할 때)

- **Claude API**: `stop_sequences` 대신 `responseMimeType: application/json` 사용.
- **OpenAI**: `response_format: { type: "json_object" }` (유사하지만 SDK 인터페이스 다름).
- **Anthropic**: message 모드, `tool_use` 블록 대신 JSON 응답 직접 설정.
