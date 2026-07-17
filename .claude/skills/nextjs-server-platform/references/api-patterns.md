# API 라우트 패턴 — Route Handlers 구현 체크리스트

## 일반 Route Handler 템플릿

```ts
// src/app/api/[resource]/[action]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

// Request schema
const MyRequest = z.object({
  input: z.string(),
  locale: z.enum(['ko', 'en']),
});

// Response schema
const MyResponse = z.object({
  result: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit by IP
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const allowed = await checkRateLimit(ip, 'my-endpoint', 30);  // 30/min
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: '요청이 많습니다.' } },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    
    // 2. Parse body
    const body = await req.json();
    
    // 3. Validate input (zod will throw on fail)
    const validated = MyRequest.parse(body);
    
    // 4. Call business logic / provider
    const result = await myBusinessLogic(validated.input, validated.locale);
    
    // 5. Validate output
    const validatedResult = MyResponse.parse(result);
    
    // 6. Return typed envelope
    return NextResponse.json({
      ok: true,
      data: validatedResult,
      error: null,
    });
    
  } catch (error) {
    // Handle specific errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request format' } },
        { status: 400 }
      );
    }
    
    if (error instanceof MyCustomError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    // Generic server error
    console.error('Route handler error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

async function myBusinessLogic(input: string, locale: string) {
  // 🔒 Server-only operations:
  // - Access process.env.SECRET
  // - Call external APIs with secrets
  // - Database queries
  return { result: `Processed ${input}` };
}
```

## 에러 처리 패턴

### 에러 정의

```ts
// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ApiErrorCodes = {
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400 },
  IMAGE_TOO_LARGE: { code: 'IMAGE_TOO_LARGE', status: 413 },
  INVALID_IMAGE: { code: 'INVALID_IMAGE', status: 415 },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  RATE_LIMITED: { code: 'RATE_LIMITED', status: 429 },
  PROVIDER_ERROR: { code: 'PROVIDER_ERROR', status: 502 },
  INTERNAL: { code: 'INTERNAL', status: 500 },
} as const;

export function raiseError(
  key: keyof typeof ApiErrorCodes,
  message: string
): never {
  const { code, status } = ApiErrorCodes[key];
  throw new ApiError(code, status, message);
}
```

### Route Handler에서 사용

```ts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = InputSchema.safeParse(body);
    
    if (!validated.success) {
      raiseError('VALIDATION_ERROR', 'Invalid request format');
    }
    
    const { image } = validated.data;
    
    // File size check
    if (image.length > 5 * 1024 * 1024) {
      raiseError('IMAGE_TOO_LARGE', 'Image exceeds 5MB limit');
    }
    
    // Provider call
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      raiseError('PROVIDER_ERROR', 'AI service unavailable');
    }
    
    return NextResponse.json({ ok: true, data: result });
    
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

## Rate Limiting 상세

### 메모리 기반 (로컬 dev)

```ts
// src/lib/rate-limit.ts (간단한 버전)
const limits = new Map<string, { count: number; reset: number }>();

export async function checkRateLimit(
  ip: string,
  endpoint: string,
  perMinute: number
): Promise<boolean> {
  const key = `${endpoint}:${ip}`;
  const now = Date.now();
  const window = 60 * 1000;  // 1 minute
  
  let entry = limits.get(key);
  
  if (!entry || now - entry.reset > window) {
    entry = { count: 0, reset: now };
    limits.set(key, entry);
  }
  
  if (entry.count >= perMinute) {
    return false;  // Rate limited
  }
  
  entry.count++;
  return true;
}
```

### KV 기반 (프로덕션, Workers 런타임)

```ts
export async function checkRateLimitKV(
  ip: string,
  endpoint: string,
  perMinute: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const kv = (globalThis as any).RATE_LIMIT_KV as KVNamespace;
  if (!kv) {
    // Fallback to memory
    return { allowed: await checkRateLimit(ip, endpoint, perMinute) };
  }
  
  const key = `ratelimit:${endpoint}:${hashIp(ip)}`;
  const now = Date.now();
  const window = 60;  // seconds
  
  const stored = await kv.get(key, 'json');
  let entry = stored ?? { count: 0, reset: now };
  
  if (now / 1000 - entry.reset > window) {
    entry = { count: 0, reset: Math.floor(now / 1000) };
  }
  
  if (entry.count >= perMinute) {
    return { allowed: false, retryAfter: window };
  }
  
  entry.count++;
  await kv.put(key, JSON.stringify(entry), {
    expirationTtl: window,
  });
  
  return { allowed: true };
}

function hashIp(ip: string): string {
  // Simple hash (production should use crypto)
  return Buffer.from(ip).toString('base64').substring(0, 16);
}
```

## 클라이언트에서 API 호출

### useTransition 패턴 (권장)

```tsx
'use client';

import { useTransition } from 'react';
import { ApiEnvelope } from '@/lib/api-schema';

export function MyComponent() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = (input: string) => {
    startTransition(async () => {
      try {
        setError(null);
        
        const res = await fetch('/api/my-endpoint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, locale: 'ko' }),
        });
        
        // Parse as typed envelope
        const envelope: ApiEnvelope = await res.json();
        
        if (!envelope.ok) {
          // User-facing error from server
          setError(envelope.error.message);
          return;
        }
        
        // Success: envelope.data is available
        console.log('Result:', envelope.data);
        
      } catch (err) {
        // Network error
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    });
  };
  
  return (
    <div>
      <button onClick={() => handleAction('test')} disabled={isPending}>
        {isPending ? 'Loading...' : 'Submit'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### 타입 안전 버전

```tsx
// 클라이언트도 schema를 import해 fetch 반환값을 parse
import { ApiEnvelope, MyResponse } from '@/lib/api-schema';

async function callMyApi(input: string): Promise<MyResponse> {
  const res = await fetch('/api/my-endpoint', {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
  
  const envelope = ApiEnvelope.parse(await res.json());
  
  if (!envelope.ok) {
    throw new Error(envelope.error.message);
  }
  
  return MyResponse.parse(envelope.data);  // Type-safe!
}
```

## Secret 처리 체크리스트

- [ ] `GEMINI_API_KEY` = `process.env`에서 읽음 (route handler 안만)
- [ ] `NEXT_PUBLIC_*` 변수는 client-safe 데이터만 (URL, ID, 설정 etc)
- [ ] `.env.local` = gitignored (개발 로컬 키)
- [ ] `wrangler.jsonc` = `vars` (public) + secrets는 CLI `wrangler secret put`
- [ ] 로그에 secret 쓰지 않음 (에러 메시지도 마찬가지)
- [ ] 응답 body에 secret 절대 포함 안 함
- [ ] 클라이언트 번들에 secret 미포함 확인 (build 후 grep)

## 배포 검증

```bash
# 1. 로컬 빌드
pnpm build

# 2. route handler 번들 확인
grep -r "GEMINI_API_KEY\|AIzaSy" .opennext/client/  # 있으면 안 됨!
grep -r "my-endpoint" .opennext/server/  # route handler 있어야 함

# 3. 로컬 프리뷰
wrangler dev

# 4. API 테스트
curl -X POST http://localhost:8787/api/my-endpoint \
  -H "Content-Type: application/json" \
  -d '{...}' \
  -w '\nStatus: %{http_code}\n'

# 5. 배포 후 실 도메인 테스트
curl -X POST https://ai.jurepi.kr/api/my-endpoint \
  -H "Content-Type: application/json" \
  -d '{...}'
```
