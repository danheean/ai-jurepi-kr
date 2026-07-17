---
name: nextjs-server-platform
description: >-
  ai.jurepi.kr의 Next.js 15 App Router 플랫폼 아키텍처. SSG 도구 페이지 + 서버 route handlers(/api/**)의 이중 성격,
  Server/Client 경계(Server Components 기본·클라이언트는 잎), 레지스트리 기반 동적 라우트(generateStaticParams),
  next-intl 로케일(ko/en), 입력 검증(zod)·에러 envelope 타입화·rate-limit,
  SEO 인프라(sitemap/robots/JSON-LD), SPA 도구 패턴(SSG 셸 + 클라이언트 인터랙션). 
  라우팅·SSG·Server/Client·API 라우트·입력 검증·에러 처리·i18n·SEO·CWV·rate-limit 작업 시 필수.
  (OpenNext/Workers 배포는 opennext-cloudflare-deploy 스킬.)
---

# Next.js Server Platform — ai.jurepi.kr 플랫폼 구조

이 스킬은 ai.jurepi.kr의 **아키텍처 계층**을 다룬다. 핵심: **이 플랫폼은 SSG 도구 페이지와 서버 API 라우트의 하이브리드다.**

- **도구 페이지** (`/[locale]/tools/[slug]/page.tsx`): 빌드타임 정적 생성(SSG) → 크롤러/SEO 최적. 레지스트리 기반 `generateStaticParams`.
- **API 라우트** (`/api/**`): On-demand 서버 실행(OpenNext Worker) → AI 호출·시크릿 보관·rate-limit. 클라이언트는 절대 직접 호출 안 함.
- **Server/Client 경계**: 기본 Server Component. 인터랙티브 도구만 클라이언트 SPA로 마운트.

## 비타협 제약 (ai.jurepi.kr SPEC)

- **정적 도구 페이지 + 동적 API.** 도구는 SSG로 페이지 생성(메타·JSON-LD·장문 콘텐츠), API는 실시간 호출.
- **클라이언트는 API 의존.** 브라우저는 `/api/**`로만 AI 호출, 절대 AI 제공사 직접 호출 안 함.
- **시크릿 보호.** `GEMINI_API_KEY` 같은 API 키는 route handler 안에서만, 클라이언트 번들 = `NEXT_PUBLIC_*` + 안전한 설정만.
- **rate-limit 필수.** 무료 API 보호 + DDoS 방어. 오픈 엔드포인트는 모두 rate-limiting(KV 또는 per-isolate).

## 도구 페이지 — SSG 골격

### 라우트 구조

```
src/app/
├── [locale]/
│   ├── layout.tsx             # Provider 스택 + shell (Server)
│   ├── tools/
│   │   ├── [slug]/
│   │   │   ├── page.tsx       # generateStaticParams + SSG + JSON-LD (Server)
│   │   │   └── loading.tsx    # Suspense fallback (선택)
│   │   └── layout.tsx         # 도구 공통 레이아웃
│   └── …
└── api/
    ├── hairstyle/
    │   ├── analyze/
    │   │   └── route.ts        # POST /api/hairstyle/analyze (server handler)
    │   └── recommend/
    │       └── route.ts        # POST /api/hairstyle/recommend (server handler)
    └── …
```

### Page 구현 패턴 (Server Component)

```tsx
// src/app/[locale]/tools/[slug]/page.tsx
import { generateStaticParams } from 'next';
import { getMessages } from 'next-intl/server';
import { buildToolMetadata } from '@/lib/seo';
import { getToolRegistry } from '@/tools/registry';

export const dynamic = 'error';  // SSG 강제 (build fail이면 생성 안 됨 = 배포 방지)

export async function generateStaticParams() {
  const registry = getToolRegistry();
  const locales = ['ko', 'en'];
  
  return registry
    .filter(tool => tool.status === 'live')  // coming_soon 제외
    .flatMap(tool =>
      locales.map(locale => ({
        locale,
        slug: tool.slug,
      }))
    );
}

export async function generateMetadata({ params }) {
  const { locale, slug } = params;
  const tool = getToolRegistry().find(t => t.slug === slug);
  
  if (!tool) return { title: 'Not Found' };
  
  return buildToolMetadata({
    locale,
    slug,
    // 도구별 title/description 키는 tools.registry entry에서 읽음
  });
}

export default async function ToolPage({ params, searchParams }) {
  const { locale, slug } = params;
  const messages = await getMessages({ locale });
  const tool = getToolRegistry().find(t => t.slug === slug);
  
  if (!tool || tool.status !== 'live') {
    notFound();  // 404 페이지
  }
  
  return (
    <div>
      <header>
        <Breadcrumb locale={locale} tool={tool} />
        <h1>{tool.title}</h1>
      </header>
      
      {/* 정적 SEO 섹션 (Server에서 항상 렌더, JSON-LD 크롤러 보임) */}
      <section>
        <Prose>{/* HowTo, FAQ, 장문 콘텐츠 */}</Prose>
      </section>
      
      {/* 인터랙티브 도구 (클라이언트 SPA) */}
      <HairstyleTool locale={locale} />
      
      {/* 광고 슬롯 (높이 예약 = CLS<0.1) */}
      <AdSlot height={250} />
      
      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(buildToolJsonLd({ locale, tool }))}
      </script>
    </div>
  );
}
```

**핵심:**
- `dynamic = 'error'` → build 시 생성 불가 = 배포 차단 (SSG 강제).
- `generateStaticParams` → 레지스트리 × locales 조합. coming_soon 필터.
- 정적 콘텐츠(HowTo/FAQ/JSON-LD)는 Server에서 렌더 → 프리렌더 HTML에 남음.
- 클라이언트 도구는 `"use client"` 컴포넌트로만 마운트.

## Server vs Client 경계 (중요)

### Server Components (기본)

```tsx
// ✅ Server Component (기본)
// src/app/[locale]/tools/[slug]/page.tsx
export default async function ToolPage({ params }) {
  // ✅ 서버만 접근 가능:
  // - 비밀 환경변수 (절대 client 아님)
  // - 데이터베이스/API 직접 호출 (없지만 원칙)
  // - 파일 시스템
  
  return (
    <>
      {/* ✅ 정적 콘텐츠 SSR → 크롤러 보임 */}
      <Prose>{t('howTo.intro')}</Prose>
      
      {/* ✅ 클라이언트 도구만 별도 컴포넌트로 */}
      <HairstyleTool />  {/* "use client" 컴포넌트 */}
    </>
  );
}
```

### Client Component (상호작용만)

```tsx
// ✅ Client Component (잎에 가깝게)
'use client';

import { useTransition, useReducer } from 'react';
import { FileUpload } from '@/components/file-upload';
import { useToast } from '@/hooks/use-toast';

export function HairstyleTool({ locale }) {
  const [state, dispatch] = useReducer(toolReducer, initialState);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  // ✅ API 호출은 클라이언트에서 (절대 provider 직접 호출 아님)
  async function handleAnalyze(image: string) {
    startTransition(async () => {
      try {
        const res = await fetch('/api/hairstyle/analyze', {
          method: 'POST',
          body: JSON.stringify({ image, locale }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();  // { ok: false, error: { code, message } }
          throw new Error(errorData.error.message);
        }
        
        const data = await res.json();  // { ok: true, data: FaceAnalysis }
        dispatch({ type: 'SET_ANALYSIS', payload: data.data });
      } catch (err) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    });
  }
  
  return (
    <div>
      <FileUpload onUpload={handleAnalyze} />
      {state.analysis && <AnalysisCard analysis={state.analysis} />}
    </div>
  );
}
```

**원칙:**
- Server Component가 정적 콘텐츠(메타·JSON-LD·HowTo)를 렌더 → 크롤러/SEO 보임.
- 클라이언트 도구(상태·클릭·API 호출)는 `"use client"` 컴포넌트로 **잎에 가깝게 분리**.
- 클라이언트는 `/api/**`만 호출, 절대 AI provider 직접 호출 없음.

## API 라우트 (Route Handlers) — Server 유일 권한

### Route Handler 구조

```ts
// src/app/api/hairstyle/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProvider } from '@/lib/hairstyle-recommendation/ai';
import { checkRateLimit } from '@/lib/hairstyle-recommendation/rate-limit';
import { AnalyzeRequest } from '@/lib/hairstyle-recommendation/schema';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit check (IP-based)
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const allowed = await checkRateLimit(ip, 'analyze');
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: { code: 'RATE_LIMITED', message: '요청이 많습니다. 잠시 후 다시 시도하세요.' } },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    
    // 2. Parse & validate request
    const body = await req.json();
    const validated = AnalyzeRequest.parse(body);  // throws ZodError
    
    // 3. Validate image bytes
    const imageBuffer = Buffer.from(validated.image.split(',')[1] || '', 'base64');
    if (imageBuffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { ok: false, error: { code: 'IMAGE_TOO_LARGE', message: '이미지가 너무 큽니다 (최대 5MB).' } },
        { status: 413 }
      );
    }
    
    // 4. Server-only: get API key & call provider
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return NextResponse.json(
        { ok: false, error: { code: 'AI_UNAVAILABLE', message: 'AI 서비스가 일시적으로 불가합니다.' } },
        { status: 502 }
      );
    }
    
    const provider = getProvider(apiKey);
    const analysis = await provider.analyzeFace(imageBuffer, validated.locale);
    
    // 5. Validate provider output
    const validatedAnalysis = FaceAnalysis.parse(analysis);
    
    // 6. Return typed envelope
    return NextResponse.json({ ok: true, data: validatedAnalysis });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } },
        { status: 400 }
      );
    }
    
    console.error('Analyze error:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

**핵심:**
1. **Rate limit** (IP-based) → 429
2. **Input validation** (zod) → 400
3. **Business validation** (image size/type) → 413/415
4. **Server-only secret access** (`process.env.GEMINI_API_KEY`)
5. **Provider call** (절대 클라이언트 아님)
6. **Output validation** (zod) → 500 (provider 버그)
7. **Typed envelope** (`{ ok, data, error }`)

### 에러 Envelope 정의

```ts
// src/lib/hairstyle-recommendation/schema.ts
import { z } from 'zod';

export const ApiErrorCode = z.enum([
  'VALIDATION_ERROR',
  'IMAGE_TOO_LARGE',
  'INVALID_IMAGE',
  'NO_FACE_DETECTED',
  'RATE_LIMITED',
  'AI_UNAVAILABLE',
  'INTERNAL',
]);

export const ApiError = z.object({
  code: ApiErrorCode,
  message: z.string(),
});

export const ApiEnvelope = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    data: z.unknown(),  // FaceAnalysis | { recommendations: Recommendation[] }
    error: z.null(),
  }),
  z.object({
    ok: z.literal(false),
    data: z.null(),
    error: ApiError,
  }),
]);

export type ApiEnvelope = z.infer<typeof ApiEnvelope>;
```

클라이언트에서 항상 이 contract를 믿고 사용:

```tsx
const res = await fetch('/api/hairstyle/analyze', { /* ... */ });
const envelope = ApiEnvelope.parse(await res.json());

if (!envelope.ok) {
  // envelope.error는 { code: '...', message: '...' }
  toast({ description: envelope.error.message });
} else {
  // envelope.data는 FaceAnalysis 또는 { recommendations }
  handleSuccess(envelope.data);
}
```

## Rate Limiting (필수)

### KV 기반 (권장, 배포 환경)

```ts
// src/lib/hairstyle-recommendation/rate-limit.ts
export async function checkRateLimit(
  ip: string,
  endpoint: 'analyze' | 'recommend'
): Promise<boolean> {
  const kv = (globalThis as any).RATE_LIMIT_KV;
  if (!kv) {
    // KV 바인딩 없으면 per-isolate 폴백
    return checkRateLimitMemory(ip, endpoint);
  }
  
  const key = `rate:${endpoint}:${hashIp(ip)}`;
  const limit = endpoint === 'analyze' ? 10 : 20;  // per min
  const window = 60;  // seconds
  
  const current = (await kv.get(key, 'json')) ?? { count: 0, reset: Date.now() };
  
  if (Date.now() - current.reset > window * 1000) {
    current.count = 0;
    current.reset = Date.now();
  }
  
  if (current.count >= limit) return false;
  
  current.count++;
  await kv.put(key, JSON.stringify(current), { expirationTtl: window });
  
  return true;
}

function hashIp(ip: string): string {
  // SHA256(ip)로 익명화
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
}

// 폴백: per-isolate 메모리 (로컬 dev, KV 미바인딩)
const inMemoryLimits = new Map<string, { count: number; reset: number }>();

function checkRateLimitMemory(ip: string, endpoint: 'analyze' | 'recommend'): boolean {
  // ... 동일 로직이지만 메모리 (재시작 시 리셋, multi-instance 비공유)
}
```

**주의:**
- KV가 없으면 per-isolate 메모리 폴백 (Worker 재시작 시 리셋, 여러 인스턴스 간 비공유).
- 프로덕션에선 KV 바인딩 필수 (배포 안정성).
- IP 해싱 필수 (프라이버시 + PII 금지).

## i18n — next-intl 로케일 라우팅

### 라우팅 설정

```ts
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { getRequestConfig } from 'next-intl/server';

export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'always',  // /ko/*, /en/*
});

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));
```

### API 라우트에서 locale 받기

```ts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const locale = body.locale ?? 'ko';  // 클라이언트에서 전달
  
  // locale 기반 AI 응답 언어
  const analysis = await provider.analyzeFace(image, locale);
  
  return NextResponse.json({ ok: true, data: analysis });
}
```

## SEO 인프라 (Platform 제공)

### Metadata Routes

```ts
// src/app/sitemap.ts
import { getToolRegistry } from '@/tools/registry';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ai.jurepi.kr';
  const locales = ['ko', 'en'];
  const registry = getToolRegistry().filter(t => t.status === 'live');
  
  return registry.flatMap(tool =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}/tools/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: {
        languages: {
          ko: `${baseUrl}/ko/tools/${tool.slug}`,
          en: `${baseUrl}/en/tools/${tool.slug}`,
        },
      },
    }))
  );
}
```

### JSON-LD Helpers

```ts
// src/lib/seo.ts
export function buildToolJsonLd({
  locale,
  tool,
  title,
  description,
}: {
  locale: string;
  tool: ToolMeta;
  title: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: title,
    description,
    url: `https://ai.jurepi.kr/${locale}/tools/${tool.slug}`,
    applicationCategory: 'Utility',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    image: `https://ai.jurepi.kr/tools/${tool.slug}/og-image.png`,
  };
}
```

**원칙:**
- `dynamic = 'force-static'`로 metadata routes 강제 SSG.
- sitemap은 live 도구만 포함.
- JSON-LD는 Server에서 렌더 → `<script type="application/ld+json">`.

## CWV & 성능 체크리스트

- [ ] **LCP < 2.5s** (도구 페이지 최초 상호작용 가능). 이미지 명시 크기 + `loading="eager"` hero만 + `loading="lazy"` 나머지.
- [ ] **CLS < 0.1** (예약된 높이). 광고 슬롯·skeleton·result grid 모두 min-height 예약.
- [ ] **INP < 200ms** (상호작용 지연). useTransition으로 pending 상태 표시 + 무거운 연산은 Worker(route handler)로.
- [ ] **JS 번들 < 150kb gz** (도구 페이지). Server Component 덕분에 클라이언트는 상호작용 SPA만 → 자동 최소화.
- [ ] **이미지 명시 dimensions** (`width`, `height`) → CLS 0.
- [ ] **폰트 subset + preload** (hero 텍스트 font-display:swap).

## 레지스트리 패턴 (새 도구 추가 시)

### 1. Registry Entry

```ts
// src/tools/registry.ts
export const registry: ToolMeta[] = [
  {
    id: 'hairstyle-recommendation',
    slug: 'hairstyle-recommendation',
    status: 'live',  // or 'coming_soon'
    title: 'Hairstyle Recommendation',
    category: 'beauty',
    accent: 'blossom',
    icon: 'Scissors',
  },
  // ...
];
```

### 2. i18n Messages

```json
// src/i18n/messages/ko.json
{
  "tools": {
    "hairstyle-recommendation": {
      "title": "헤어스타일 추천",
      "description": "당신의 얼굴형에 맞는 스타일을 찾아보세요",
      "meta": {
        "title": "AI 헤어스타일 추천 - 얼굴형 분석",
        "description": "사진을 올리면 AI가 당신의 얼굴형을 분석해 어울리는 헤어스타일을 추천합니다."
      },
      "intro": { "title": "...", "content": "..." },
      "howTo": { "title": "...", "items": [...] },
      "faq": { "title": "...", "items": [...] }
    }
  }
}
```

### 3. Component Branch

```tsx
// src/app/[locale]/tools/[slug]/page.tsx
async function ToolPage({ params }) {
  const tool = getToolRegistry().find(t => t.slug === params.slug);
  
  if (tool.id === 'hairstyle-recommendation') {
    return <HairstyleTool locale={params.locale} />;
  }
  
  // 다른 도구...
  notFound();
}
```

**새 도구 = registry entry + i18n + component branch + `/api/...` route(필요시)**

## 검증 (TDD)

```ts
// src/app/[locale]/tools/[slug]/page.test.tsx
describe('ToolPage - SSG', () => {
  test('generateStaticParams returns live tools only', () => {
    const params = generateStaticParams();
    expect(params).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          locale: 'ko',
          slug: 'hairstyle-recommendation',
        }),
      ])
    );
    expect(params.map(p => p.slug)).not.toContain('some-coming-soon-tool');
  });
  
  test('generateMetadata builds correct meta tags', async () => {
    const meta = await generateMetadata({ params: { locale: 'ko', slug: 'hairstyle-recommendation' } });
    expect(meta.title).toBeDefined();
    expect(meta.description).toBeDefined();
  });
});

// src/app/api/hairstyle/analyze/route.test.ts
describe('POST /api/hairstyle/analyze', () => {
  test('returns 429 when rate limited', async () => {
    // mock checkRateLimit to return false
    // POST with valid payload
    // expect 429 response
  });
  
  test('returns 400 on invalid input', async () => {
    const res = await POST(new NextRequest('http://localhost/api/hairstyle/analyze', {
      method: 'POST',
      body: JSON.stringify({ image: '', locale: 'xyz' }),
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
  
  test('returns 502 when GEMINI_API_KEY unset', async () => {
    // unset env var, POST valid payload
    // expect 502 AI_UNAVAILABLE
  });
});
```

## 비타협 원칙

- **Server Components 기본** — 정적 콘텐츠는 서버에서 렌더 → 크롤러 보임.
- **클라이언트는 SPA** — 인터랙티브 도구만 `"use client"`, 잎에 가깝게.
- **API는 서버 유일** — 절대 클라이언트 → provider 직접 호출 금지.
- **rate-limit 필수** — 모든 open `/api/**` 엔드포인트.
- **입력 검증** (zod) + **출력 검증** (zod) → 타입 안전.
- **typed error envelope** — `{ ok, data, error }` contract 항상.
- **시크릿 격리** — `GEMINI_API_KEY` = route handler만, 절대 `NEXT_PUBLIC_*` 아님.
- **배포본 검증** — curl로 API + 번들 시크릿 누출 확인.
