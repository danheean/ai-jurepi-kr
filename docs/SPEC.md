# ai.jurepi.kr — Platform & Main Dashboard SPEC

> **AI-Powered Online Tools Hub** — the AI sibling of [apps.jurepi.kr](https://apps.jurepi.kr).
>
> This document specifies the **platform + shell + infrastructure** that every AI tool on this hub inherits. Individual tools (e.g., Hairstyle Recommendation) are specified in their own service SPECs: `docs/services/[category]/[tool-id]/SPEC.md`.
>
> Visual design system (tokens, component styling): [`DESIGN.md`](DESIGN.md) is the single source of truth. This SPEC references design decisions by name but does NOT duplicate token values. See DESIGN.md for all color/spacing/typography tokens.
>
> **Visual Identity (Confirmed 2026-07-18):** Brand red primary (#e60023) for all primary CTAs, active states, and brand emphasis. **6-category accent colors** (coral/mint/sky/sun/grape/rose) via per-tool `ToolMeta.accent` field. Dual typography: Gmarket Sans (700 weight) for display roles (hero H1, heading-xl, wordmark); Pretendard (400/600/700) for body/UI. Common platform features: **favorites** (localStorage, rose accent), **SNS share** (6 platforms + copy + native), **tool characters** (1:1 WebP/SVG, 300×300px). See DESIGN.md "Design Decisions > Confirmed 2026-07-18" for details.

```xml
<project_specification>

<project_name>ai.jurepi.kr — AI-Powered Free Online Tools Hub (platform shell + infrastructure)</project_name>

<overview>
ai.jurepi.kr is a **server-backed AI tools hub**, the AI sibling of the static-export tools hub (apps.jurepi.kr). It hosts free, AI-powered online utilities — each a single-tool discovery page, each calling a backend AI model (Gemini, Claude, etc.) to analyze images, generate text, make recommendations, or transform data. The platform provides a shared shell, tool registry, SEO infrastructure, i18n routing, theming, consent/monetization, and — crucially — a provider-abstraction layer that lets AI implementations be **swapped without touching UI or route handlers**.

The platform also provides **three mandatory common features** ported from apps.jurepi.kr: (1) **Favorites** — localStorage-backed heart toggles with rose accent and a favorites-only filter pill on home; (2) **SNS Sharing** — one-click sharing to 6 social platforms plus copy link + Web Share API (native mobile); (3) **Tool Characters** — per-tool 1:1 visual mascots (SVG/WebP, 300×300px intrinsic) appearing on home hero and tool detail pages.

**CRITICAL: Server Runtime.** Unlike apps.jurepi.kr (static export, no backend), ai.jurepi.kr is a **Next.js 15 application deployed on Cloudflare Workers via OpenNext** (`@opennextjs/cloudflare`). This enables server `src/app/api/**` route handlers where AI keys live, inference runs, and responses are typed. The static SSG shell (home, tool pages) reuses the apps.jurepi.kr pattern; only the server surface is new.

**CRITICAL: Provider Abstraction.** Each AI capability (e.g., "analyze face shape from a photo") is defined as a **domain port interface** (e.g., `HairstyleAI`). Implementations (adapters) are provider-specific (e.g., `GeminiProvider`). The active provider is selected by the `AI_PROVIDER` environment variable. Adding a new provider = implementing the interface in one file; route handlers and UI never change.

**CRITICAL: Ephemeral Input Policy.** User inputs (photos, documents, audio clips) are **never stored, cached, logged, or persisted**. They are resized/validated in the browser, sent once to the server, passed to the AI provider for a single inference call, and immediately discarded. This is a platform-wide guarantee and is enforced at every layer.

**CRITICAL: Typed API Contracts.** All endpoints return a consistent `ApiEnvelope { ok, data, error }` shape with typed error codes. Request validation via Zod on the server. Rate limiting is built into the platform layer, reusable by all tools.

**CRITICAL: Tool Extensibility.** New tools are added by (1) a ToolMeta registry entry (including `accent` field for category color), (2) a service SPEC, (3) UI components, (4) optionally new API routes. Some tools are pure-client (no AI), some call AI endpoints. The platform supports both.

This SPEC is **platform and shell only**. Internals of any individual tool (flow logic, domain-specific validation, result rendering) are in that tool's own service SPEC.
</overview>

<scope_boundaries>
  <in_scope>
    - Shared application shell: Header (wordmark in Gmarket Sans, search trigger, locale switch, theme toggle), Footer, Breadcrumb, Toast system, ConsentBanner, AdSlot (height-reserved, consent-gated).
    - Main dashboard screen: Hero, Search, Category Filter, responsive Tool Card grid (SSG) with category accent icon tiles.
    - Typed tool registry (single source of truth): ToolMeta[] in src/tools/registry.ts, drives grid, sitemap, SEO, dynamic routes, **includes new `accent` field**.
    - Dynamic tool route /[locale]/tools/[slug] with SSG (generateStaticParams per live tool × locale); mounts tool module per slug.
    - **Server runtime via OpenNext:** Cloudflare Workers deployment, Node-compatible route handlers in src/app/api/**, environment secrets (AI keys), rate limiting.
    - **AI Provider Abstraction Layer:** Platform-wide port interface pattern; factory-based provider selection via AI_PROVIDER env; example: HairstyleAI (port) → GeminiProvider (adapter).
    - **Platform API Contract:** Consistent typed envelope (ok/data/error), Zod input validation, typed error codes, rate-limit infrastructure (per-IP token bucket, KV or in-memory).
    - **Ephemeral Input Policy:** Platform rules: no user input stored/cached/logged; validated + streamed + discarded; enforced in architecture + docs + code review.
    - **i18n Routing:** next-intl (ko/en), localePrefix "always", dual-language messages, dynamic route translation.
    - **Theming:** Light (default) + optional dark, flash-free SSR, persisted.
    - **Monetization:** Google AdSense (height-reserved, consent-gated, after idle), consent flow (Google CMP or lightweight banner).
    - **SEO:** sitemap.xml, robots.txt, manifest, canonical/hreflang, WebSite JSON-LD, OG defaults, LD+JSON per tool (SoftwareApplication, FAQPage, etc.), llms.txt.
    - **Static Legal Pages:** About, Privacy, Terms, Contact (localized).
    - **Error Handling:** 404 (localized), Error Boundary around tool modules, toast notifications, input validation feedback.
    - **Accessibility:** WCAG 2.1 AA, keyboard nav, visible focus, prefers-reduced-motion, semantic HTML, correct lang + hreflang.
    - **Common Features:** Favorites (localStorage, rose accent, filter toggle), SNS Share (6 platforms + copy + native), Tool Characters (1:1 WebP/SVG per tool).
  </in_scope>

  <out_of_scope>
    - Internals of individual tools (each tool has its own service SPEC).
    - Accounts, authentication, user history, saved results, cross-device sync (Phase 2+).
    - Payments, premium tiers (site is fully free).
    - Native apps (responsive web only).
    - CMS or admin UI (tools added via registry + code).
    - Database (ephemeral-only; optional KV for rate limiting).
  </out_of_scope>

  <future_considerations>
    - More AI tools via registry + service SPECs (AI image upscaler, text summarizer, code generator, etc.).
    - Alternative AI providers (Claude, GPT, Llama, etc.) via the provider abstraction.
    - Offline mode / Progressive Web App (Phase 2).
    - Advanced rate limiting + quotas per user/plan (Phase 2).
    - Analytics dashboard for tool creators (Phase 3).
    - Optional accounts for saved results + cross-device sync (Phase 3).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited_from_apps_jurepi>
    <frontend>
      - Framework: Next.js 15 (App Router), React 19, TypeScript 5.7 strict.
      - Rendering: SSG via generateStaticParams for tool pages; Server Components by default; interactive tool UIs are Client Components.
      - Styling: Tailwind CSS v4 driven by CSS custom-property tokens (src/styles/tokens.css ↔ DESIGN.md).
      - i18n: next-intl v3.x — locales ["ko","en"], defaultLocale "ko", localePrefix "always".
      - State: React Context (theme, consent, toast); no global client store at platform level.
      - Icons: lucide-react v0.468 (stroke 1.75).
      - Fonts: Gmarket Sans (weight 700 only, self-hosted) for display roles + Pretendard (weights 400/500/600/700, self-hosted) for body/UI. Subset, font-display: swap, preload Pretendard 400 only.
      - Validation (client + server): zod v4.
    </frontend>
    <persistence>
      - localStorage only: theme, consent, **home-favorites** (versioned JSON schema), per-tool ephemeral state (no cross-session persistence).
      - NO database, NO first-party backend (except API routes for AI inference).
    </persistence>
  </inherited_from_apps_jurepi>

  <new_ai_layer>
    <runtime>
      - Deployment: Cloudflare Workers via OpenNext (@opennextjs/cloudflare, latest).
      - Route handlers (src/app/api/**): Node.js-compatible, not statically exported.
      - Only the API surface is server-rendered; tool pages themselves are static SSG + Client Components.
    </runtime>
    <ai_abstraction>
      - **Port Interface Pattern:** Each AI capability is a domain interface (e.g., HairstyleAI). Implementations (providers) inherit or implement the interface.
      - Factory: src/lib/[tool]/ai/index.ts exports getProvider() which selects by AI_PROVIDER env var.
      - Example: HairstyleAI (port) ← GeminiProvider, OllamaProvider (adapters) — route handlers call getProvider().analyzeFace(...), UI unchanged.
      - No provider SDK is imported outside its provider file; all AI logic is isolated and swappable.
      - **Platform capability layer (src/lib/ai/, added 2026-07-18):** shared, tool-agnostic provider clients that tool adapters compose. Every tool on this hub is AI-backed, so frontier and open-source models must stay swappable behind common ports:
        - `StructuredModel.generateJson<T>({ prompt, image?, schema, maxRetries? })` — structured text/vision JSON generation, zod-validated via shared guardrails (markdown-fence stripping + 1 retry).
        - `ImageGenerator.generateImage({ prompt, width?, height?, seed?, referenceImage? })` + readonly `supportsImageEdit` — text→image generation; `referenceImage` is the Phase-2 try-on seam (unused in v1).
        - Providers: `GeminiClient` (frontier, @google/generative-ai SDK) and `OllamaClient` (open-source, plain fetch → `{OLLAMA_BASE_URL}/api/chat` with JSON-schema format + `{OLLAMA_BASE_URL}/v1/images/generations` OpenAI-compatible).
        - Factories: `getStructuredModel()` selects by AI_PROVIDER (gemini|ollama); `getImageGenerator()` selects by IMAGE_PROVIDER (ollama | unset→null = image generation disabled; callers must degrade gracefully to curated imagery).
        - Dev default: Ollama on the developer laptop (zero API cost). Production: AI_PROVIDER=gemini, IMAGE_PROVIDER unset — image generation stays off in production until a production image provider is chosen (deferred decision).
    </ai_abstraction>
    <environment_secrets>
      - Server-only: GEMINI_API_KEY, CLAUDE_API_KEY, etc. (NEVER NEXT_PUBLIC_*).
      - Selection: AI_PROVIDER env (default: "gemini"); routes validate presence at request time.
      - Validation: startup + per-request; return typed error (502 AI_UNAVAILABLE) if missing.
      - Rotation: use GitHub Actions secrets for deployment; no hardcoding in repo.
    </environment_secrets>
    <rate_limiting>
      - Platform layer: per-IP token bucket, per-endpoint limits (e.g., 10/min for analyze, 20/min for recommend).
      - Backend: Cloudflare KV (RATE_LIMIT_KV binding, optional) or in-memory per-isolate fallback.
      - Exceeded: 429 with typed envelope { ok: false, error: { code: 'RATE_LIMITED', message: '...' } }.
      - Configuration: env vars (e.g., HAIRSTYLE_RATE_LIMIT_PER_MIN).
    </rate_limiting>
    <api_contract>
      - Request: Content-Type application/json, Zod-validated shape. Client sends base64 image or structured input.
      - Response: Consistent ApiEnvelope shape across all endpoints:
        ```typescript
        { ok: true, data: T, error: null } | { ok: false, data: null, error: { code: string, message: string } }
        ```
      - Error codes: VALIDATION_ERROR, IMAGE_TOO_LARGE, INVALID_IMAGE, NO_FACE_DETECTED, RATE_LIMITED, AI_UNAVAILABLE, IMAGE_GEN_DISABLED (503 — image generation off; clients fall back quietly to curated imagery), INTERNAL, etc.
      - Validation: server-side only, using Zod. Client receives feedback via error envelope.
    </api_contract>
    <ephemeral_policy>
      - **Platform Rule:** No user input (image, text, audio, document) is written to disk, KV, R2, D1, memory caches, or logs.
      - **Enforcement:**
        - Resize client-side; upload as stream, not stored in multipart buffer.
        - Route handler: decode, validate, pass to provider in single call, discard immediately after response.
        - Provider: use input only for inference; do NOT cache, log, or return raw input data.
        - Monitoring: log message counts, error codes, and aggregated metrics (no PII, no input samples).
      - **Documentation:** Privacy notice in UI; Privacy/Terms disclose the policy; code comments enforce it.
      - **Audit:** Code review checklist item: "Verify no input persisted, cached, or logged."
    </ephemeral_policy>
  </new_ai_layer>

  <platform_libraries>
    - @opennextjs/cloudflare (latest) — Next.js ↔ Workers adapter
    - zod (v4) — request + response validation, server + client
    - @google/genai (latest) — Gemini API (server-only, inside providers)
    - next-intl (v3) — routing + i18n
    - lucide-react (^0.468) — icons
    - nanoid (v5) — ephemeral IDs (if needed by tools)
    - Tailwind CSS (v4) + PostCSS
  </platform_libraries>

  <note_no_database>CRITICAL: This platform has NO database (no D1, no Postgres, no MongoDB). The only optional stateful binding is Cloudflare KV for rate-limit counters, which stores only hashed-IP → count (never user input).</note_no_database>
</technology_stack>

<prerequisites>
  <environment_setup>
    - Node.js v20+, pnpm v9 or npm v10.
    - Cloudflare account (for Workers, KV, deployment).
    - Modern browser (Chrome 100+, Firefox 100+, Safari 15+).
    - AI provider accounts + API keys (Gemini, Claude, etc.).
    - Google AdSense account (optional, for production ads).
  </environment_setup>
  <build_configuration>
    - TS strict mode; Tailwind v4 with @tailwindcss/postcss; tokens.css vars.
    - Path alias @/* → src/*.
    - next-intl plugin in next.config.ts; localePrefix "always".
    - ESLint (next/core-web-vitals) + Prettier.
    - OpenNext config (open-next.config.ts) for Workers adapter.
  </build_configuration>
</prerequisites>

<environment_variables>
  <public_variables>
    <variable>
      <name>NEXT_PUBLIC_SITE_URL</name>
      <description>Canonical base URL (canonical tags, sitemap, OG). Public.</description>
      <required>true</required>
      <example>https://ai.jurepi.kr</example>
    </variable>
    <variable>
      <name>NEXT_PUBLIC_ADSENSE_CLIENT</name>
      <description>AdSense publisher client ID. Public.</description>
      <required>false</required>
      <example>ca-pub-0000000000000000</example>
      <note>Ads render only when set AND user consented. Reserve slot height always.</note>
    </variable>
    <variable>
      <name>NEXT_PUBLIC_GA_ID</name>
      <description>GA4 measurement ID. Public. Loaded only after consent.</description>
      <required>false</required>
      <example>G-XXXXXXXXXX</example>
    </variable>
    <variable>
      <name>NEXT_PUBLIC_DEFAULT_LOCALE</name>
      <description>Default locale for redirect from /.</description>
      <required>false</required>
      <example>ko</example>
    </variable>
  </public_variables>

  <server_only_secrets>
    <variable>
      <name>AI_PROVIDER</name>
      <description>Active AI provider (server-only). Selects the implementation (e.g., HairstyleAI → GeminiProvider vs ClaudeProvider).</description>
      <required>false</required>
      <default>gemini</default>
      <example>gemini</example>
      <note>Enum: gemini, ollama, claude, etc. (extend as providers are added). NOT public. Dev convention: ollama (laptop inference, zero API cost).</note>
    </variable>
    <variable>
      <name>GEMINI_API_KEY</name>
      <description>Google Generative AI API key (server-only). Used exclusively inside provider implementations.</description>
      <required>conditionally</required>
      <example>AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</example>
      <note>CRITICAL: server-only. NEVER prefix with NEXT_PUBLIC_. Validate presence at startup + per-request; return 502 AI_UNAVAILABLE if missing. Rotate on exposure.</note>
    </variable>
    <variable>
      <name>CLAUDE_API_KEY</name>
      <description>Anthropic Claude API key (server-only, future provider).</description>
      <required>conditionally</required>
      <note>Only required if AI_PROVIDER=claude. Same rotation + validation rules.</note>
    </variable>
    <variable>
      <name>IMAGE_PROVIDER</name>
      <description>Active image-generation provider for getImageGenerator() (server-only). Unset (or "none") = image generation disabled; features degrade gracefully to curated catalog imagery.</description>
      <required>false</required>
      <default>(unset — disabled)</default>
      <example>ollama</example>
      <note>Enum: ollama (dev). Production image provider is a deferred decision — deployed site keeps image generation off until one is chosen (e.g., Workers AI or a tunneled Ollama).</note>
    </variable>
    <variable>
      <name>OLLAMA_BASE_URL</name>
      <description>Base URL of the Ollama server used by OllamaClient.</description>
      <required>false</required>
      <default>http://localhost:11434</default>
      <example>http://localhost:11434</example>
    </variable>
    <variable>
      <name>OLLAMA_VISION_MODEL / OLLAMA_TEXT_MODEL / OLLAMA_IMAGE_MODEL</name>
      <description>Ollama model tags per capability.</description>
      <required>false</required>
      <default>qwen3-vl:8b / qwen3.5:9b / x/z-image-turbo</default>
      <note>Image generation requires `ollama pull x/z-image-turbo` (Ollama ≥0.32; experimental image generation, macOS first). x/flux2-klein is an alternative image model.</note>
    </variable>
    <variable>
      <name>[TOOL]_RATE_LIMIT_PER_MIN</name>
      <description>Max requests per minute per IP for a specific tool endpoint (e.g., HAIRSTYLE_RATE_LIMIT_PER_MIN).</description>
      <required>false</required>
      <example>12</example>
      <note>Defaults per tool's SPEC. Overridable at deployment time.</note>
    </variable>
    <variable>
      <name>RATE_LIMIT_KV</name>
      <description>Cloudflare KV binding name for cross-isolate rate-limit counter storage (Wrangler binding, not a value).</description>
      <required>false</required>
      <note>If unbound, rate limiting falls back to per-isolate in-memory token bucket (weaker but functional).</note>
    </variable>
  </server_only_secrets>

  <note>CRITICAL: no secrets in NEXT_PUBLIC_* or in code. All server secrets go in .env.local (dev) or Cloudflare/GitHub deployment secrets (prod). Startup validation ensures required keys are present before the app starts.</note>
</environment_variables>

<file_structure>
src/
├── app/
│   ├── layout.tsx                  # Root <html lang>, font vars, base metadata, theme bootstrap
│   ├── globals.css                 # Tailwind import + token bridge
│   ├── sitemap.ts                  # Entries for every live tool × locale + static pages
│   ├── robots.ts
│   ├── manifest.ts
│   ├── [locale]/
│   │   ├── layout.tsx              # Providers, Header, Footer, ConsentBanner
│   │   ├── page.tsx                # ★ MAIN DASHBOARD (Hero + ToolGrid + Favorites toggle)
│   │   ├── not-found.tsx
│   │   ├── tools/[slug]/
│   │   │   ├── page.tsx            # SSG; mounts tool module + JSON-LD + breadcrumb + ShareButtons + ToolCharacter
│   │   │   ├── layout.tsx          # Tool-level layout (if shared across tool variants)
│   │   ├── about/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── contact/page.tsx
│   └── api/
│       └── [tool]/
│           ├── [endpoint]/route.ts # Server route handlers (e.g., /api/hairstyle/analyze)
│           │                       # Each tool defines its own endpoints; follows ApiEnvelope contract
│
├── components/
│   ├── ui/                         # Button, Input, Toggle, Badge, Card, Modal, Toast, EmptyState, Skeleton
│   ├── layout/                     # Header, Footer, LocaleSwitcher, ThemeToggle, ConsentBanner, Breadcrumb, ShareButtons, FavoriteButton
│   ├── home/                       # Hero, SearchBar, CategoryFilter, ToolGrid, ToolCard, FavoritesFilterToggle, ShareButtons
│   ├── ads/                        # AdSlot
│   └── tools/                      # one folder per tool (see each tool's SPEC) — e.g. hairstyle-recommendation/
│
├── tools/
│   ├── registry.ts                 # ToolMeta[] — single source of truth (now includes `accent` field)
│   └── types.ts                    # ToolCategory, ToolMeta, ToolStatus, AccentColor
│
├── lib/
│   ├── seo.ts                      # buildMetadata, websiteJsonLd
│   ├── consent.ts                  # consent state, banner logic
│   ├── analytics.ts                # GA4 event tracking (consent-gated)
│   ├── api-envelope.ts             # Typed ApiEnvelope builder, error codes
│   ├── rate-limit.ts               # Platform-wide rate limiter (per-IP, KV or in-memory)
│   ├── utils.ts                    # cn(), search matcher, clamp, localization helpers
│   ├── home-favorites.ts           # Favorites domain logic (pure functions): loadFavorites, saveFavorites, toggleFavorite, filterByFavorites
│   ├── share.ts                    # Share targets: shareFacebook, shareX, shareNaver, shareThreads, shareTelegram, shareWhatsapp, copyLink, nativeShare
│   │
│   ├── ai/                         # ★ Platform AI capability layer (tool-agnostic, 2026-07-18)
│   │   ├── types.ts                # StructuredModel + ImageGenerator ports, AiError (incl. IMAGE_GEN_DISABLED)
│   │   ├── env.ts                  # readRuntimeEnv (Cloudflare context → process.env fallback) + config getters
│   │   ├── guardrails.ts           # JSON extraction (fence strip) + zod validation + 1 retry
│   │   ├── gemini.ts               # GeminiClient (frontier; @google/generative-ai)
│   │   ├── ollama.ts               # OllamaClient (open-source; fetch → /api/chat, /v1/images/generations)
│   │   └── factory.ts              # getStructuredModel() / getImageGenerator()
│   │
│   └── [tool-name]/
│       ├── ai/
│       │   ├── types.ts            # Port interface (e.g., HairstyleAI), provider-facing types
│       │   ├── gemini.ts           # GeminiProvider implementation (uses @google/genai)
│       │   ├── claude.ts           # ClaudeProvider implementation (future, uses @anthropic-sdk)
│       │   ├── index.ts            # getProvider() factory (AI_PROVIDER env)
│       │   └── gemini.test.ts      # Unit tests (mocked SDK)
│       ├── schema.ts               # Zod: Request, Response, domain types
│       ├── constants.ts            # Enums, limits, defaults
│       ├── catalog.ts              # Tool-specific data (e.g., curated hairstyles)
│       └── index.ts                # Barrel export
│
├── i18n/
│   ├── routing.ts
│   ├── request.ts
│   └── messages/
│       ├── ko.json                 # Platform keys + tools.* namespace
│       └── en.json
│
├── hooks/
│   ├── useReducedMotion.ts
│   ├── useLocalStorage.ts
│   ├── useConsent.ts
│   ├── useToast.ts
│   ├── useHomeFavorites.ts         # Loads/saves favorites from localStorage, auto-prunes missing tools
│   └── [tool-specific hooks]
│
└── styles/
    └── tokens.css                  # Design tokens (mirror of DESIGN.md, includes accent colors)

public/
├── characters/                     # Tool character images (one per tool + home.webp)
│   ├── home.webp                   # Home/hero character
│   ├── hairstyle-recommendation.webp
│   └── [other tool slugs].webp
├── hairstyles/                     # Curated reference images (future tools will have their own /public/[tool]/)
│   ├── soft-layered-bob/
│   │   ├── feminine.webp
│   │   └── masculine.webp
│   └── ...
└── [other static assets]

wrangler.jsonc / open-next.config.ts  # OpenNext + Workers config, KV bindings, env secrets

.env.local (dev) / GitHub Secrets (prod)
├── AI_PROVIDER=gemini
├── GEMINI_API_KEY=...
└── RATE_LIMIT_KV=[binding]
</file_structure>

<core_data_entities>
  <tool_meta>
    Compile-time registry entry (src/tools/types.ts, src/tools/registry.ts). Drives hub UI, sitemap, SEO, static params.
    - id: string (stable key, e.g. "hairstyle-recommendation")
    - slug: string (URL segment, e.g. "hairstyle-recommendation")
    - category: enum (beauty, text, dev, random, converter, calculator, fun, mindset, news, etc. — extend as needed)
    - accent: enum (coral, mint, sky, sun, grape, rose) — **NEW** — signals category color identity for icon tiles, badges, category pills. Drives tint of tool card icon background + accompanying chips.
    - icon: string (lucide icon name)
    - status: enum (live, coming_soon)
    - addedAt: string (ISO YYYY-MM-DD) — NEW badge derives from last 7 days
    - isPopular?: boolean (may pin to top)
    - order: number (manual sort weight, lower first)
    - keywords: string[] (search + SEO; localized variants resolved from messages)
    - hasServer?: boolean (default false) — marks AI tools that require /api/** routes
    - note: name/description resolved at render from messages[`tools.${id}.*`]
  </tool_meta>

  <home_favorites>
    localStorage only, versioned schema for forward-compat.
    - Key: `ai-jurepi-home-favorites`
    - Value: `{ version: 1, ids: string[] }`
    - Methods (in src/lib/home-favorites.ts):
      - `loadFavorites(): { version: 1, ids: string[] }` — loads from localStorage, auto-prunes invalid tool slugs
      - `saveFavorites(ids: string[])` — persists to localStorage, validates against live tools
      - `toggleFavorite(slug: string, isFavorite: boolean)` — adds/removes, returns new state
      - `filterByFavorites(tools: ToolMeta[], favoriteIds: string[]): ToolMeta[]` — filters registry
    - Hook: `useHomeFavorites(liveSlugs: string[])` in src/hooks/useHomeFavorites.ts — SSR-safe, returns { favorites, toggleFavorite, filterActive }
  </home_favorites>

  <sns_share>
    Platform-wide share logic in src/lib/share.ts (pure functions, no side effects).
    - Targets: facebook, x (formerly twitter), naver, threads, telegram, whatsapp, copy, native
    - Functions:
      - `shareFacebook(url: string, title: string)` — opens Facebook share dialog
      - `shareX(url: string, text: string)` — opens X (Twitter) intent
      - `shareNaver(url: string, title: string, description?: string)` — Naver share
      - `shareThreads(url: string, text: string)` — Threads share
      - `shareTelegram(url: string, title: string)` — Telegram share
      - `shareWhatsapp(url: string, message: string)` — Whatsapp share
      - `copyLink(url: string)` — copies to clipboard, shows toast
      - `nativeShare(title: string, text: string, url: string)` — Web Share API (mounted-gated)
    - Component: `ShareButtons` in src/components/layout/ShareButtons.tsx (mounted-gated, renders buttons for each target)
    - Placement: Below hero on home page; near tool result on tool detail pages
  </sns_share>

  <tool_characters>
    1:1 WebP/SVG images stored in public/characters/, mounted as decorative visuals.
    - Naming: `public/characters/[slug].webp` (e.g., `hairstyle-recommendation.webp`) + `public/characters/home.webp`
    - Intrinsic size: 300×300px (CSS scales responsively)
    - Component: `ToolCharacter` in src/components/layout/ToolCharacter.tsx — renders <img src={`/characters/${slug}.webp`} alt="..." />
    - Placement: Home hero (home.webp), tool detail pages (tool-specific), optional result cards
    - Usage: Reuse existing jurepi mascot for now; phase in per-tool characters as designs mature
  </tool_characters>

  <user_preferences>
    localStorage only (no server sync).
    - jurepi-theme: enum (light, dark, system) — default "light"
    - jurepi-consent: { ads: boolean; analytics: boolean; ts: number } | null
    - ai-jurepi-home-favorites: { version: 1, ids: string[] } — see above
  </user_preferences>

  <api_envelope>
    Consistent shape across ALL endpoints (platform-wide contract):
    ```typescript
    type ApiEnvelope<T> = 
      | { ok: true; data: T; error: null }
      | { ok: false; data: null; error: { code: ErrorCode; message: string } };
    
    type ErrorCode = 
      | 'VALIDATION_ERROR' | 'IMAGE_TOO_LARGE' | 'INVALID_IMAGE' 
      | 'NO_FACE_DETECTED' | 'RATE_LIMITED' | 'AI_UNAVAILABLE' | 'IMAGE_GEN_DISABLED' | 'INTERNAL';
    ```
  </api_envelope>

  <rate_limit_state>
    Per IP (hash), per endpoint. Stored in KV (cross-isolate) or memory (per-isolate).
    - key: `hash(clientIP):endpoint` (e.g., `abc123:analyze`)
    - value: { tokens: number, lastRefilled: timestamp }
    - Tokens refill at configured rate (e.g., 10 per minute); checked on each request; 429 if exhausted.
  </rate_limit_state>

  <note>Per-tool runtime state (e.g., hairstyle recommendation history) is defined in that tool's SPEC, not here. Platform owns theme + consent + favorites.</note>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/" redirect="/ko" status="307" />
    <route path="/:locale" page="HomePage (main dashboard with favorites toggle + share buttons)" />
    <route path="/:locale/tools/:slug" page="ToolPage (mounts tool module, SSG, with tool character + share buttons)" />
    <route path="/:locale/about" page="AboutPage" />
    <route path="/:locale/privacy" page="PrivacyPage" />
    <route path="/:locale/terms" page="TermsPage" />
    <route path="/:locale/contact" page="ContactPage" />
  </public_routes>

  <api_routes>
    <route path="/api/:tool/:endpoint" method="POST" handler="src/app/api/[tool]/[endpoint]/route.ts" runtime="Cloudflare Worker (Node)" />
    <note>Each tool defines its own endpoints (e.g., /api/hairstyle/analyze, /api/hairstyle/recommend). ALL return ApiEnvelope shape. Route handlers execute server-side only; never statically exported.</note>
  </api_routes>

  <generated_static>
    <route path="/sitemap.xml" handler="app/sitemap.ts" />
    <route path="/robots.txt" handler="app/robots.ts" />
    <route path="/manifest.webmanifest" handler="app/manifest.ts" />
  </generated_static>

  <rules>
    - generateStaticParams for /:locale/tools/:slug iterates registry.filter(status==='live') × locales.
    - coming_soon tools have NO static route; cards are non-clickable UI placeholders.
    - Unknown slug → localized 404.
  </rules>
</route_definitions>

<component_hierarchy>
  <app_root>
    <html lang={locale}>
      <locale_layout>     <!-- NextIntlClientProvider → ThemeProvider → ConsentProvider → ToastProvider -->
        <header>          <!-- sticky 64px -->
          <wordmark /> <search_trigger /> <locale_switcher /> <theme_toggle />
        </header>
        <main>
          <home_page>                    <!-- ★ MAIN DASHBOARD -->
            <hero> <eyebrow /> <h1 /> <subhead /> <search_bar /> <tool_character home/> </hero>
            <ad_slot variant="leaderboard" />
            <category_filter /> <favorites_filter_toggle />  <!-- pill row -->
            <tool_grid> <tool_card /> ... </tool_grid>
            <share_buttons />            <!-- Below grid or in hero -->
          </home_page>
          <tool_page>                    <!-- mounts a tool module (statically rendered) -->
            <breadcrumb />
            <tool_character tool-specific />
            <tool_module />               <!-- e.g. <HairstyleTool/> (see tool SPEC) -->
            <share_buttons />
            <ad_slot variant="in_content" />
          </tool_page>
        </main>
        <ad_slot variant="footer" />
        <footer />
        <consent_banner />
      </locale_layout>
    </html>
  </app_root>

  <shared_primitives>
    <button /> <text_input /> <toggle /> <badge /> <card /> <modal /> <toast /> <empty_state /> <skeleton /> <ad_slot /> <favorite_button /> <share_buttons /> <tool_character />
  </shared_primitives>

  <provider_order>NextIntlClientProvider → ThemeProvider → ConsentProvider → ToastProvider</provider_order>
</component_hierarchy>

<pages_and_interfaces>
  <container>Home/marketing surfaces: max-w-screen-2xl. Tool detail pages: max-w-screen-xl (1280px) — the tool-page shell standard (2026-07-18). Horizontal padding 24px (≥768px) / 16px (mobile). Vertical rhythm: 48–64px between sections, 16–20px within.</container>

  <home_page>
    - Hero: centered, padding 64px/40px (desktop) / 40px/24px (mobile). Eyebrow + H1 (Gmarket Sans 700, clamp 32–56px) + subhead + SearchBar (56px tall, rounded, leading icon, placeholder "Search tools…") + optional ToolCharacter (home.webp, 1:1, responsive width).
    - SearchBar: filters grid client-side by name/description/keywords (debounced 120ms); mirrored to URL query (?search=...).
    - CategoryFilter + FavoritesFilterToggle: horizontal pill row (scroll-snap mobile). Pills derived from categories in registry + favorites. Category pills show category accent on text; Favorites pill (rose accent) toggles favorite-only view.
    - ToolGrid: 1-col <480px, 2-col 480–767, 3-col 768–1023, 4-col ≥1024; gap 20px. Sort: isPopular first → order asc → coming_soon last. If favorites filter active, show only favorite tools. Empty state (no match): illustration + "No results" + reset button.
    - ToolCard: surface card (16px radius, no padding, category accent icon tile top-left). Icon tile (48px, accent-soft background + accent icon). Title (18px/600 Pretendard) + description (14px/400, 2-line clamp). Badges: NEW, Popular, coming-soon + FavoriteButton (rose heart, 44px, positioned top-right outside card or bottom-right corner). Hover (live): shadow lift, 200ms ease-out; press scale 0.99. Focus-visible: 2px primary ring. coming_soon: opacity 0.7, no hover, cursor default. Entire card is Link target (live) or button (coming-soon for future interest capture).
    - ShareButtons: renders below tool grid or in footer area. Buttons for each platform (facebook, x, naver, threads, telegram, whatsapp, copy, native). Each 44×44px, pill-shaped, with platform icon.
  </home_page>

  <tool_page>
    **Tool page shell standard (2026-07-18 — aligned with apps.jurepi.kr tool pages, e.g. find-replace):**
    - Container: wide — max-w-screen-xl (1280px), px-4 mobile / px-6 ≥768px, py-8/py-12. Tool workspaces need room; the old narrow prose column (max-w-3xl) is retired for tool pages.
    - Top row: back link (left, ← home) + ShareButtons horizontal (right, "공유하기" label + 6 SNS + copy link + native share).
    - ToolIntro header (shared component): ToolCharacter avatar (w-16 sm:w-[72px], rounded-2xl, shadow-card) beside a category eyebrow (text-xs bold uppercase tracking-widest, tool accent ink color) + H1 (font-display) + one-paragraph description (max-w-2xl).
    - Workspace: the interactive tool module mounts IMMEDIATELY after ToolIntro (before how-to/FAQ) — users act first, read later.
    - Below the workspace: how-to (numbered step list + sm:grid-cols-3 tip cards, border-t separated), FAQ (native details/summary), footer note. These stay SSR/prerendered (SEO/GEO) outside any client gate.
    - Tool Module: the tool's Client Component (e.g., <HairstyleTool/>). Tool internals per its own SPEC; platform provides Error Boundary + loader context.
    - InContent Ad: placed below the interactive tool, height-reserved, consent-gated.
  </tool_page>

  <keyboard_shortcuts>
    - "/" → focus home search
    - "Esc" → close search overlay / modal / consent details
    - Tab order: header controls → category pills → favorites pill → grid cards (DOM order)
  </keyboard_shortcuts>

  <legal_pages>
    About / Privacy / Terms / Contact — simple prose layout (max-width 720px, heading in Gmarket Sans or Pretendard). Privacy + Terms disclose AdSense/GA cookies, consent mechanism, **ephemeral input guarantee**, and favorites/share/character features.
  </legal_pages>
</pages_and_interfaces>

<core_functionality>
  <tool_hub>
    - Registry-driven grid: ToolGrid maps registry; adding a tool = ToolMeta entry (including `accent`) + messages + module + (optionally) API routes + service SPEC + character WebP.
    - Category filter + favorites filter + client-side search over localized name/description/keywords.
    - Filter/search/favorites state mirrored to URL; shareable, back-button friendly.
    - Live cards → navigate to tool page; coming_soon → non-clickable or interest-capture CTA (Phase 2).
  </tool_hub>

  <favorites>
    - Domain logic: src/lib/home-favorites.ts (pure functions, no side effects). Zod schema validates { version: 1, ids: string[] }.
    - Hook: useHomeFavorites(liveSlugs) — loads favorites, auto-prunes invalid slugs, exports toggleFavorite + filterActive + favorites state.
    - UI: FavoriteButton (rose heart icon, 44×44px, aria-pressed toggle) on each ToolCard. FavoritesFilterToggle (rose pill, "Show favorites only") in home filter row.
    - Flow: User clicks heart → toggleFavorite(slug) → persists to localStorage → component re-renders. Click favorites filter → grid re-filters to favorite tools only.
    - Persistence: localStorage key `ai-jurepi-home-favorites`, versioned schema, survives page reloads + browser restarts, cleared only on localStorage reset.
  </favorites>

  <sns_share>
    - Domain logic: src/lib/share.ts (pure functions). No API calls; all share methods construct URLs or use native APIs.
    - Targets: facebook, x, naver, threads, telegram, whatsapp, copy (to clipboard), native (Web Share API).
    - ShareButtons component: Renders 8 buttons (or fewer if native not available). Each mounted-gated for no SSR issues. On click, calls appropriate share function (copyLink shows toast).
    - Placement: Below hero on home; below/near tool result on tool pages. Optional sticky footer version for mobile.
    - URL & messaging: Share current page URL + i18n'd message per tool (e.g., "Check out Hairstyle Recommendation on ai.jurepi.kr").
  </sns_share>

  <tool_characters>
    - Component: ToolCharacter (src/components/layout/ToolCharacter.tsx). Props: slug? (defaults to "home"), alt text.
    - Renders: <img src={`/characters/${slug}.webp`} alt={alt} /> with 300×300px intrinsic size, responsive width, rounded corners per DESIGN.md.
    - Placement: Home hero (home.webp). Tool detail pages (tool-specific WebP). Optional on result cards.
    - Images: Public/characters/[slug].webp. Reuse existing jurepi mascot for now; add per-tool characters as designs are ready.
  </tool_characters>

  <i18n>
    - All visible strings from messages/{ko,en}.json.
    - Locale switch preserves path + query; sets <html lang>.
    - Tool names, descriptions, UI labels keyed by tools.${toolId}.*.
    - Share message templates keyed by tools.${toolId}.share_message.
  </i18n>

  <theming>
    - Light (default) + dark, persisted in localStorage, SSR flash-free (inline bootstrap before paint).
    - CSS custom properties driven by DESIGN.md tokens (including accent colors with light/dark variants).
  </theming>

  <consent>
    - First visit → banner; choice persisted in localStorage.
    - Ads + GA gated on consent.ads + consent.analytics respectively.
    - Re-openable from footer.
    - Privacy/Terms explain cookies, tracking, **ephemeral input guarantee**, and common features.
  </consent>

  <provider_abstraction>
    - Each AI capability defined as domain port (e.g., HairstyleAI: { analyzeFace(...), recommend(...) }).
    - Factory getProvider() selects implementation by AI_PROVIDER env.
    - Route handlers call getProvider().Port.method(...); no SDK logic in routes.
    - Adding provider = one new file (gemini.ts, claude.ts, etc.) + unit tests; routes unchanged.
  </provider_abstraction>

  <ephemeral_guarantee>
    - Platform rule: user inputs (images, text, docs, audio) are validated, processed, and immediately discarded.
    - Never cached, logged, or persisted. Privacy notice in UI + Terms.
    - Code review checklist ensures compliance.
  </ephemeral_guarantee>
</core_functionality>

<error_handling>
  <user_facing>
    <toast_notifications>Success var(--success) 2.5s; Error var(--danger) persistent; max 3 stacked; bottom-center mobile / bottom-right desktop; reduced-motion fade only.</toast_notifications>
    <validation_feedback>Form errors inline; API errors rendered as typed toast (e.g., "Rate limited — try again in 30s" for 429).</validation_feedback>
    <error_pages>404 localized; tool render failure caught by Error Boundary → friendly retry message + home link, never crashes shell.</error_pages>
    <empty_states>No search results, no data, no consent → illustrated, friendly message, CTA (reset, retry, enable, etc.).</empty_states>
  </user_facing>

  <server_errors>
    - Validation errors (400): return envelope { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Field X is invalid' } }.
    - Image errors (413, 415): too large, invalid type — envelope { ok: false, error: { code: 'IMAGE_TOO_LARGE' / 'INVALID_IMAGE' } }.
    - Rate limit (429): envelope { ok: false, error: { code: 'RATE_LIMITED', message: 'Max 10 requests/min. Try again in Xs.' } }.
    - AI unavailable (502): envelope { ok: false, error: { code: 'AI_UNAVAILABLE', message: 'Service temporarily unavailable.' } }.
    - Internal (500): generic message; log full error server-side (no input PII).
  </server_errors>

  <runtime>
    <localstorage>Private-mode/quota errors caught; theme + consent + favorites degrade to in-memory defaults.</localstorage>
    <api_failures>Retry with backoff (exponential, max 3 attempts) for transient failures (5xx); fail fast for client errors (4xx).
    <ads>AdSense load failure → AdSlot renders nothing (collapses), never blocks content.
  </runtime>
</error_handling>

<third_party_integrations>
  <integration name="Google AdSense">
    <purpose>Display advertising (monetization)</purpose>
    <sdk>next/script strategy="lazyOnload", only after ad consent</sdk>
    <ad_slots>
      - leaderboard (home, below hero): reserve 90px mobile / up to 250px desktop
      - footer (all pages): reserve 90px
      - in_content (tool pages): reserve ≥250px, placed per-tool
    </ad_slots>
    <rules>CRITICAL: reserve fixed height (CLS < 0.1); never above H1; ads off until consent.ads === true; load after idle.</rules>
  </integration>

  <integration name="Consent CMP">
    <purpose>Lawful basis for ad/analytics cookies (GDPR/ePrivacy/K-ICT)</purpose>
    <flow>First visit (cleared storage) → ConsentBanner ("수락"/"거부"/"설정"); choice → localStorage jurepi-consent; gate scripts; re-open from footer.</flow>
    <message>Include ephemeral input guarantee, favorites, SNS share, and character features in Privacy policy.</message>
  </integration>

  <integration name="Google Analytics 4" optional="true">
    <events>tool_open (slug), locale_switch, search_query, favorite_toggled (no PII); consent.analytics gated</events>
  </integration>

  <integration name="AI Providers (Gemini, Claude, etc.)">
    <purpose>Run inference (vision, text, etc.) server-side</purpose>
    <pattern>Abstracted via port interface + provider factory. Each provider is one file (gemini.ts, claude.ts); route handlers never import provider SDKs directly.</pattern>
    <env>AI_PROVIDER env selects active impl; provider-specific keys (GEMINI_API_KEY, CLAUDE_API_KEY, etc.) server-only; validated at startup + per-request.</env>
    <no_input_persistence>CRITICAL: provider receives input, performs single inference, and MUST NOT cache/log/return the raw input. Response only.</no_input_persistence>
  </integration>

  <integration name="Cloudflare Workers + KV">
    <purpose>Server runtime + optional rate-limit counter storage</purpose>
    <deployment>OpenNext adapter (@opennextjs/cloudflare) → Workers; KV binding RATE_LIMIT_KV (optional, falls back to memory).</deployment>
  </integration>

  <integration name="Fonts">Self-hosted Gmarket Sans (weight 700 only) + Pretendard (weights 400/500/600/700) via next/font/local, subset, font-display: swap. Gmarket Sans for display roles; Pretendard for body/UI. Preload Pretendard 400 only.</integration>
</third_party_integrations>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is the single source of truth for tokens and component styling. src/styles/tokens.css mirrors it exactly. This SPEC references DESIGN decisions by name but does NOT duplicate token values.</source>

  <direction>Bright, friendly, playful, light-first. White cards on warm-cream ground lifted by soft shadows; brand red (#e60023) primary for CTAs and active states; **category accents** (coral/mint/sky/sun/grape/rose) on icon tiles, category pills, favorites, and accent chips; rounded corners (16–32px); all interactive elements follow accent discipline per DESIGN.md.</direction>

  <main_screen_usage>
    - Hero H1 in Gmarket Sans 700; everything else Pretendard.
    - Tool cards: category accent tints icon tile (soft background + saturated icon + glyph). FavoriteButton rose heart sits top-right or corner-overlay.
    - Cards lift on hover (--shadow-card → --shadow-card-hover), press scale 0.99, focus-visible brand ring.
    - Section rhythm 48–64px; grid gap 20px; container max 1120px.
  </main_screen_usage>

  <responsive>
    Breakpoints: 0–479 (1-col) / 480–767 (2-col) / 768–1023 (3-col) / 1024+ (4-col, 1120px).
    Header stays compact (no hamburger). Touch targets ≥44px (especially FavoriteButton + ShareButtons).
  </responsive>

  <accessibility>
    WCAG 2.1 AA: main text >=4.5:1 contrast, large text >=3:1, buttons >=3:1.
    Full keyboard nav, visible focus-visible rings, prefers-reduced-motion honored (no transforms, fade only).
    Semantic <header>/<main>/<footer>/<nav>, one H1 per page, correct <html lang> + hreflang.
    Color not sole indicator of state. Images have alt text. Form inputs have labels. FavoriteButton uses aria-pressed.
  </accessibility>
</aesthetic_guidelines>

<security_considerations>
  <client_security>
    - CRITICAL: no secrets in code or NEXT_PUBLIC_* (only public URLs, AdSense client, GA ID).
    - CSP: default-src 'self'; script-src 'self' + nonce + Google (pagead2.googlesyndication.com, www.googletagmanager.com); frame-src ad iframes; object-src 'none'; base-uri 'self'.
    - Headers: HSTS, X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera/mic/geo none).
    - XSS prevention: never use innerHTML/dangerouslySetInnerHTML for user content; React escapes by default.
    - CSRF: form state-changes use POST + SameSite cookies (next/navigation handles).
  </client_security>

  <server_security>
    - CRITICAL: AI API keys are server-only (GEMINI_API_KEY, CLAUDE_API_KEY, etc.). NEVER NEXT_PUBLIC_.
    - Validate presence at startup; log absence without the value; return 502 AI_UNAVAILABLE if missing at request time.
    - All route handlers validate input via Zod; fail fast with 400 + typed error.
    - Rate limiting enforced server-side; never trust client-supplied limits.
    - Input validation: type check (image MIME), size limit, encoding validation.
  </server_security>

  <ephemeral_guarantee>
    - CRITICAL: user inputs (images, text, etc.) are **never written to disk, KV, cache, logs, or any persistent store**.
    - Route handler: decode, stream to provider, discard after response. No intermediate saves.
    - Monitoring: log request counts + error codes (aggregated, no PII or input samples).
    - Audit: code review checklist + privacy/terms disclosure + Privacy page privacy guarantee.
  </ephemeral_guarantee>

  <privacy>
    - No tracking before consent.
    - AdSense + GA strictly consent-gated.
    - Privacy/Terms disclose cookies, tracking, **input ephemeralness**, favorites (localStorage), share (URL only, no logging), and character images (CDN).
    - Input data never shared with third parties (goes only to selected AI provider for inference).
  </privacy>

  <secret_rotation>
    - Suspect exposure: immediately regenerate API keys in provider console.
    - CI/CD: use GitHub Actions secrets; rotate on schedule (e.g., quarterly).
    - Deployment: Cloudflare/Vercel environment variables (encrypted at rest, masked in logs).
  </secret_rotation>
</security_considerations>

<advanced_functionality>
  <extensible_tool_registry>
    Registry is the backbone: hub UI, sitemap, static params, SEO all derive from it. New tool = (1) ToolMeta entry (including `accent` field), (2) i18n messages (tools.${id}.*), (3) UI component folder, (4) character WebP (public/characters/[slug].webp), (5) optional API routes (if AI-enabled), (6) service SPEC. coming_soon tools need only ToolMeta + messages.
  </extensible_tool_registry>

  <theme_switching>Light/dark/system, persisted, SSR flash-free. Accent colors adapt per DESIGN.md (light vs dark variant tokens).</theme_switching>

  <provider_swapping>
    Change AI_PROVIDER env → factory selects different implementation → same routes + UI work with a new provider. E.g., swap Gemini → Claude without touching any route handler or component.
  </provider_swapping>

  <pwa>
    manifest.webmanifest + maskable icons + theme-color; installable to home screen. Offline SW optional (Phase 2).
  </pwa>

  <rate_limit_customization>
    Per-tool, per-endpoint limits configurable via env vars (e.g., HAIRSTYLE_RATE_LIMIT_PER_MIN). Fallback to platform defaults.
  </rate_limit_customization>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Main dashboard: browse, filter, search, favorites, share</description>
    <steps>
      1. Visit / → 307 redirect to /ko; home renders hero + tool grid with live + coming_soon cards. Tool cards show category accent icon tiles.
      2. Verify live cards (e.g., hairstyle-recommendation) are clickable; coming_soon show "준비중" badge + non-clickable.
      3. Click heart on tool card → FavoriteButton toggles, favorites update in localStorage.
      4. Click "Show favorites only" filter pill → grid shows only favorite tools.
      5. Click category pill → grid filters; URL updates ?cat=... (e.g., ?cat=beauty).
      6. Type search term → grid narrows; debounced 120ms; URL gains ?search=....
      7. Click share button → Share sheet or platform-specific intent opens.
      8. Click a live card → navigate to /ko/tools/[slug] (static page + tool module + tool character + share buttons).
      9. Non-matching search → EmptyState + reset link.
    </steps>
  </test_scenario_1>

  <test_scenario_2>
    <description>i18n + theme persistence + favorites cross-session</description>
    <steps>
      1. From /ko, switch locale to en → navigate to /en preserving page + query.
      2. Verify all UI + tool names switch to English; <html lang="en">; hreflang alternates present.
      3. Click favorites + reload → favorites persisted in localStorage, visible on page load.
      4. Toggle dark theme → tokens switch, no flash on reload. Reload → theme persists.
      5. OS reduced-motion on → card hovers render without transforms (fade/shadow only).
    </steps>
  </test_scenario_2>

  <test_scenario_3>
    <description>Consent + ads + no-input-persist guarantee</description>
    <steps>
      1. First visit (cleared storage) → ConsentBanner; no AdSense/GA in DOM.
      2. Click "거부" → no ad/GA scripts; AdSlots reserve height, render empty.
      3. Re-open consent from footer → click "수락" → AdSense loads post-idle; units fill.
      4. Lighthouse CLS < 0.1 on home + tool pages (reserved ad heights).
      5. Upload photo to AI tool → verify it's never logged/cached (via server logs inspection + Network tab).
    </steps>
  </test_scenario_3>

  <test_scenario_4>
    <description>AI endpoint contract + error handling</description>
    <steps>
      1. POST /api/hairstyle/analyze with valid image → 200 { ok: true, data: {...}, error: null }.
      2. POST with oversized image → 413 { ok: false, error: { code: 'IMAGE_TOO_LARGE', message: '...' } }.
      3. POST 11 times within 1min (limit 10) → 11th is 429 { ok: false, error: { code: 'RATE_LIMITED', message: '...' } }.
      4. No GEMINI_API_KEY at startup → app logs and returns 502 on first inference call.
      5. Client receives ApiEnvelope shape on all responses; can render typed error messages.
    </steps>
  </test_scenario_4>

  <test_scenario_5>
    <description>Provider abstraction + swappability</description>
    <steps>
      1. Deploy with AI_PROVIDER=gemini → requests use GeminiProvider.
      2. Swap to AI_PROVIDER=claude (add ClaudeProvider, update CLAUDE_API_KEY) → same routes/UI work with new provider.
      3. No code changes to route handlers or components.
    </steps>
  </test_scenario_5>

  <test_scenario_6>
    <description>SEO + static generation + tool characters</description>
    <steps>
      1. Production build → every live tool page statically generated per-locale.
      2. /sitemap.xml lists live tools × locales + static pages; all absolute URLs; canonicals match.
      3. /robots.txt allows all + references sitemap.
      4. Tool page has SoftwareApplication + FAQPage JSON-LD + OG defaults.
      5. Unknown slug → localized 404 (not server error).
      6. Home page loads home.webp character; tool pages load tool-specific character (e.g., hairstyle-recommendation.webp).
    </steps>
  </test_scenario_6>
</final_integration_test>

<success_criteria>
  <functionality>
    - Home grid renders all live registry tools with category accent icon tiles; filter + search + favorites work and mirror to URL.
    - Live cards navigate; coming_soon non-clickable.
    - i18n/theme/consent/favorites correct; every live tool is separately indexable SSG page.
    - API endpoints return typed ApiEnvelope; validation works; rate limit enforced.
    - Input is ephemeral (verified via logs + code review).
    - FavoriteButton toggles persist to localStorage; FavoritesFilterToggle filters grid correctly.
    - ShareButtons render on home + tool pages; click opens appropriate share intent (platform or native).
    - ToolCharacter images load correctly (home + per-tool).
  </functionality>

  <user_experience>
    - Core Web Vitals (Lighthouse mobile): LCP <2.5s, FCP <1.5s, INP <200ms, CLS <0.1, TBT <200ms.
    - Search keystroke→filter <50ms (debounced).
    - Visible focus + ≥44px tap targets (especially FavoriteButton + ShareButtons).
    - Reduced-motion respected.
    - Favorites persist across sessions.
  </user_experience>

  <technical_quality>
    - Zero TS errors (strict mode).
    - Zero console errors in prod.
    - No file >800 lines; feature-based file org.
    - Unit + integration + E2E tests; 80%+ coverage.
  </technical_quality>

  <visual_design>
    - Matches DESIGN.md tokens; category accent icon tiles visible on every tool card.
    - Intentional hover/press/focus states.
    - Light (and optional dark) feel designed with accent colors.
    - Brand red primary for CTAs; category accents for secondary UI (icon tiles, badges, pills); cohesive per-category system per DESIGN.md.
  </visual_design>

  <build>
    - Landing JS <150kb gz, CSS <30kb gz.
    - API routes execute server-side only; no API JS bundled to client.
    - Deployable to Cloudflare Workers via OpenNext; no database required.
    - Chrome 100+, Firefox 100+, Safari 15+ support.
  </build>
</success_criteria>

<build_output>
  <build_command>pnpm build</build_command>
  <output>
    - Static HTML/CSS for home + every live tool page (per-locale, SSG via generateStaticParams).
    - Server code in .wrangler/ (OpenNext build artifact); deployed to Cloudflare Workers.
    - Artifacts: sitemap.xml, robots.txt, manifest.webmanifest, static pages (HTML).
  </output>
  <deployment>
    - Cloudflare Pages or Workers (via open-next.config.ts + wrangler.toml).
    - Set environment secrets: AI_PROVIDER, GEMINI_API_KEY, RATE_LIMIT_KV (KV binding), rate-limit overrides.
    - Configure CSP + security headers (via _headers file or wrangler.toml).
    - Ensure public/characters/*.webp files are deployed as static assets.
  </deployment>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Tool registry + types (including `accent` field) + dynamic SSG route (hub backbone).
    2. AI provider abstraction + factory (enables provider swapping).
    3. API envelope contract + Zod validation (platform-wide consistency).
    4. Rate-limit layer (per-IP, reusable by all tools).
    5. Design tokens (tokens.css ↔ DESIGN.md, including 6 category accents).
    6. Ephemeral input enforcement (code review + docs).
    7. OpenNext config + Workers deployment (server runtime).
    8. **Favorites domain logic** (pure functions in src/lib/home-favorites.ts + useHomeFavorites hook).
    9. **Share targets** (pure functions in src/lib/share.ts + ShareButtons component).
    10. **Tool characters** (ToolCharacter component + public/characters/*.webp assets).
  </critical_paths>

  <recommended_implementation_order>
    1. Scaffold Next.js 15 + TS strict + Tailwind v4 + tokens.css (WITH 6 accent colors) + next-intl (ko/en).
    2. Install Gmarket Sans + Pretendard fonts via next/font/local.
    3. UI primitives + layout shell (Header/Footer with Gmarket Sans wordmark/ThemeProvider flash-free/LocaleSwitcher).
    4. Tool registry + types (add `accent: AccentColor` field) + ko/en messages.
    5. Main dashboard: Hero (Gmarket Sans H1), SearchBar, CategoryFilter, FavoritesFilterToggle, ToolGrid, ToolCard (category accent icon tile + FavoriteButton) (all states + empty).
    6. Favorites domain (src/lib/home-favorites.ts) + useHomeFavorites hook + localStorage integration.
    7. ShareButtons component + share targets (src/lib/share.ts).
    8. ToolCharacter component + public/characters/ assets (reuse jurepi mascot for now).
    9. OpenNext config + Workers adapter setup (local dev + Cloudflare deployment).
    10. API envelope + Zod schema + rate-limit layer (shared platform code).
    11. Dynamic tool route + Error Boundary + breadcrumb.
    12. First AI tool: HairstyleAI port interface + GeminiProvider + route handlers + tool component.
    13. Consent + AdSlot + AdSense wiring (consent-gated, lazy).
    14. SEO: buildMetadata, WebSite JSON-LD, sitemap.ts, robots.ts, manifest.ts, hreflang/canonical.
    15. Legal pages (About/Privacy/Terms/Contact with updated copy for common features); GA optional (consent-gated).
    16. Responsive + a11y pass; Lighthouse/visual regression at 320/375/768/1024/1440.
    17. Test coverage (>=80%); integration tests (provider mock, rate-limit, envelope contract, favorites, share, characters).
    18. Polish: empty states, 404, toast, edge cases, reduced-motion.
    19. Deployment runbook + monitoring + log analysis (ephemeral-input verification).
  </recommended_implementation_order>

  <tool_registry_example>
    ```typescript
    // src/tools/types.ts
    export type ToolCategory = 'beauty' | 'text' | 'dev' | 'random' | 'converter' | 'calculator' | 'fun' | 'mindset' | 'news';
    export type AccentColor = 'coral' | 'mint' | 'sky' | 'sun' | 'grape' | 'rose';
    
    export interface ToolMeta {
      id: string; slug: string; category: ToolCategory; icon: string;
      accent: AccentColor; // NEW — per-category color identity
      status: 'live' | 'coming_soon';
      addedAt: string; isPopular?: boolean; order: number; keywords: string[];
      hasServer?: boolean; // marks tools that require /api/** routes
    }

    // src/tools/registry.ts
    export const tools: ToolMeta[] = [
      {
        id: 'hairstyle-recommendation', slug: 'hairstyle-recommendation', category: 'beauty',
        accent: 'rose', // Beauty tools use rose accent
        icon: 'Scissors', status: 'live', addedAt: '2026-06-20',
        isPopular: true, order: 10, hasServer: true,
        keywords: ['헤어스타일', '얼굴형', 'hairstyle', 'face shape', 'recommendation', 'AI'],
      },
      // ... other tools
    ];
    ```
  </tool_registry_example>

  <api_provider_example>
    ```typescript
    // src/lib/hairstyle-recommendation/ai/types.ts
    export interface HairstyleAI {
      analyzeFace(image: ImageData, locale: string): Promise<FaceAnalysis>;
      recommend(input: RecommendInput, candidates: string[]): Promise<Recommendation[]>;
    }

    // src/lib/hairstyle-recommendation/ai/gemini.ts
    import { GoogleGenerativeAI } from '@google/genai';
    export class GeminiProvider implements HairstyleAI {
      private client: GoogleGenerativeAI;
      constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI({ apiKey });
      }
      async analyzeFace(image: ImageData, locale: string) { ... }
      async recommend(input: RecommendInput, candidates: string[]) { ... }
    }

    // src/lib/hairstyle-recommendation/ai/index.ts
    export function getProvider(): HairstyleAI {
      const provider = process.env.AI_PROVIDER ?? 'gemini';
      const key = process.env[`${provider.toUpperCase()}_API_KEY`];
      if (!key) throw new Error(`Missing ${provider.toUpperCase()}_API_KEY`);
      
      switch (provider) {
        case 'gemini': return new GeminiProvider(key);
        case 'claude': return new ClaudeProvider(key);
        default: throw new Error(`Unknown provider: ${provider}`);
      }
    }
    ```
  </api_provider_example>

  <rate_limit_example>
    ```typescript
    // src/lib/rate-limit.ts (platform-wide)
    import { RateLimiterMemory } from 'rate-limiter-flexible';
    
    const limiters = new Map<string, RateLimiter>();
    
    export function createRateLimiter(endpoint: string, requestsPerMinute: number) {
      return limiters.get(endpoint) ?? new RateLimiterMemory({
        points: requestsPerMinute,
        duration: 60,
      });
    }
    
    export async function checkRateLimit(clientIp: string, endpoint: string, limit: number) {
      const limiter = createRateLimiter(endpoint, limit);
      try {
        await limiter.consume(clientIp);
        return { allowed: true };
      } catch (e) {
        return { allowed: false, retryAfterMs: e.msBeforeNext };
      }
    }

    // src/app/api/hairstyle/analyze/route.ts
    import { checkRateLimit } from '@/lib/rate-limit';
    
    export async function POST(req: Request) {
      const ip = req.headers.get('cf-connecting-ip') ?? '0.0.0.0';
      const rl = await checkRateLimit(ip, 'analyze', 10);
      if (!rl.allowed) {
        return Response.json({ ok: false, data: null, error: { code: 'RATE_LIMITED', message: '...' } }, { status: 429 });
      }
      // ... rest of handler
    }
    ```
  </rate_limit_example>

  <performance>
    - Tool pages are Server Components; only tool subtree is "use client".
    - Defer AdSense/GA via lazyOnload post-consent.
    - Self-host + subset both Gmarket Sans + Pretendard fonts; reserve ad heights (CLS).
    - Optimize images: explicit dimensions, lazy-loading (below-fold), AVIF/WebP + fallback. ToolCharacter images (public/characters/*.webp) lazy-loaded.
    - Dynamic imports for heavy provider SDKs (only in route handlers, never client).
  </performance>

  <testing_strategy>
    - Unit (Vitest): favorites domain (loadFavorites, toggleFavorite, filterByFavorites), share targets (all platform functions), search matcher, consent gating, schema validation, provider mocks.
    - Component (Playwright): FavoriteButton states, ShareButtons rendering, ToolCard with accent, CategoryFilter, FavoritesFilterToggle, SearchBar.
    - E2E (Playwright): the six integration test scenarios above + favorites persistence.
    - Visual regression: home at 320/768/1024/1440, both themes (including accent colors + character images).
    - A11y (axe + manual): keyboard nav (favorite toggle, share buttons), color contrast (accent colors on soft backgrounds), reduced-motion, labels.
    - API contract tests: envelope shape, error codes, rate-limit responses (mocked provider).
  </testing_strategy>

  <code_organization>
    - Each tool gets a folder under lib/[tool-name]/; API endpoints under app/api/[tool]/.
    - Shared platform code: lib/api-envelope.ts, lib/rate-limit.ts, lib/seo.ts, lib/consent.ts, **lib/home-favorites.ts**, **lib/share.ts**.
    - UI primitives: components/ui/; layout: components/layout/ (Header, Footer, **ShareButtons**, **FavoriteButton**, **ToolCharacter**); home: components/home/.
    - Tool UI: components/tools/[tool-name]/.
    - Common features: hooks/useHomeFavorites.ts, lib/home-favorites.ts, lib/share.ts, components/layout/ShareButtons.tsx.
    - No file >800 lines; aim for 200–400.
  </code_organization>
</key_implementation_notes>

</project_specification>
```
