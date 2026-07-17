# Hairstyle Recommendation — AI Face-Shape Style Advisor — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation lives in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes. **Synchronized to ai.jurepi.kr DESIGN.md (2026-07-17): single brand-red accent, Pretendard, flat elevation, 16/32/pill radius, no per-tool accents.**
>
> Build specification for **Hairstyle Recommendation** (헤어스타일 추천) — the **first AI tool** on the new **ai.jurepi.kr** hub (an AI-powered sibling of the existing no-AI [apps.jurepi.kr](https://apps.jurepi.kr)). The user either **uploads a face photo** (analyzed by an AI vision model) or **picks their face shape manually**, refines a few attributes (preference, hair length, hair type, occasion), and receives **3–6 recommended hairstyles** — each with a "why it suits you" explanation, styling/maintenance tips, and a **curated reference image**. It is **recommendation-only**: the AI returns **text**, and every image shown comes from a curated static library. No image of the user's face is ever generated, stored, or logged.
>
> Internal service codename: `hairstyle-recommendation`. Registry id: `hairstyle-recommendation`. Public URL slug: `/[locale]/tools/hairstyle-recommendation`. Category: `beauty`. **Note: accent is NOT tool-specific; all tools share the single brand accent.**
>
> **CRITICAL — SERVER-SIDE AI, NOT STATIC EXPORT.** apps.jurepi.kr is a static export served by an assets-only Worker (no server). This tool **requires a server** to hold the AI key and run inference, so **ai.jurepi.kr is deployed on Cloudflare Workers via OpenNext** (`@opennextjs/cloudflare`), which keeps the identical Next.js 15 / React 19 / Tailwind v4 / next-intl stack and DESIGN system but enables **route handlers** (`src/app/api/hairstyle/**`). All model calls happen server-side; the API key never reaches the client.
>
> **CRITICAL — RECOMMENDATION-ONLY (NO IMAGE GENERATION).** This build performs **no** generative try-on. The AI produces structured **text** (face-shape analysis + reasoning + tips + hairstyle IDs). Reference images are matched from a **curated static library** keyed by `(hairstyleId, gender, faceShape)`. Generative virtual try-on is explicitly **Phase 2** — the provider seam and `Recommendation` shape are designed so a `generateTryOn()` method and a result-image slot can be added later without rework.
>
> **CRITICAL — EPHEMERAL PHOTO, PRIVACY-FIRST.** This is a face-photo tool. The uploaded image is **resized client-side**, streamed to the provider for a **single** analysis call, and **never persisted server-side, never logged, and discarded immediately** after the response. This is a hard rule (see `<security_considerations>`) and is surfaced in the UI.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO/ad infrastructure, and design tokens are provided by the platform. The ai.jurepi.kr platform `SPEC.md` / `DESIGN.md` define the visual truth:
> - Design system (single source of visual truth): **ai.jurepi.kr `docs/DESIGN.md`** (brand red `#e60023`, warm-cream neutral surfaces canvas #ffffff / surface-soft #fbfbf9 / surface-card #f6f6f3, Pretendard display/body, 16px md / 32px lg / pill radius, flat elevation, single brand accent—no per-tool accents, no honey-gold, no per-category tint).
> - Tool registry pattern: apps.jurepi.kr `src/tools/registry.ts` + `src/tools/types.ts` (`ToolMeta` shape).
> - i18n routing: next-intl, locales `['ko','en']`, `defaultLocale: 'ko'`, `localePrefix: 'always'`.

```xml
<project_specification>

<project_name>Hairstyle Recommendation — AI Face-Shape Style Advisor (ai.jurepi.kr tool, codename hairstyle-recommendation, registry id hairstyle-recommendation)</project_name>

<overview>
Hairstyle Recommendation helps a user discover haircuts that suit their face. There are two entry paths. In the **photo path**, the user uploads or captures a face photo; an AI vision model analyzes the **face shape** (oval, round, square, heart, oblong, diamond, triangle) plus salient features, and returns a structured analysis. In the **no-photo path**, the user simply selects their face shape from labeled illustrations — no image, no upload, instant. Either way, the user then refines a few attributes (style preference, current hair length, hair type, occasion) and receives a set of tailored recommendations.

Each recommendation is a card: the hairstyle name (ko/en), a short "why it suits your face shape" explanation written by the AI, two or three concrete styling/maintenance tips, and a **curated reference photo** so the user can see the look. The user can regenerate for fresh ideas, copy a shareable summary, and open a guide. The whole flow is fast, login-free, and mobile-first — a single-page interaction mounted on the platform's SSG shell.

CRITICAL (server-side AI): unlike apps.jurepi.kr (static export, no server), this tool calls an AI model, so ai.jurepi.kr runs on **Cloudflare Workers via OpenNext**. Two **route handlers** do the work: `POST /api/hairstyle/analyze` (image → face analysis) and `POST /api/hairstyle/recommend` (attributes → recommendations). The AI key lives only in the server environment; the browser never sees it and never calls the provider directly.

CRITICAL (recommendation-only, no generation): the AI returns **text and IDs only**. All hairstyle imagery is served from a **curated static library** (`public/hairstyles/**`) matched by `(hairstyleId, gender, faceShape)`. There is no synthesis of the user's face. This keeps the tool free to run and privacy-safe. Generative try-on is Phase 2.

CRITICAL (ephemeral, privacy-first): the face photo is resized in the browser (longest edge ≤ 1024px, JPEG q≈0.85), sent once to the analyze endpoint, forwarded to the provider for a single call, and then discarded. No image bytes are written to disk, cache, KV, R2, or logs. The privacy guarantee is stated in the UI next to the uploader.

CRITICAL (provider-swappable): all model access goes through a single `HairstyleAI` interface with a default `GeminiProvider`. The active provider is chosen by the `AI_PROVIDER` env var. Adding a provider is one new file implementing the interface; route handlers and UI never change.
</overview>

<platform_integration>
  - Route: /[locale]/tools/hairstyle-recommendation (SSG shell + client tool; registry slug "hairstyle-recommendation", id "hairstyle-recommendation", status "live", category "beauty").
  - API routes (server, OpenNext Worker runtime): POST /api/hairstyle/analyze, POST /api/hairstyle/recommend. Node-compatible route handlers; NOT statically exported.
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, SEO metadata + JSON-LD builders, breadcrumb, ShareButtons.
  - Consumes: i18n namespace `tools.hairstyle-recommendation.*` (UI chrome: uploader labels, attribute labels + option labels, result labels, tips heading, empty/loading/error states, privacy notice, how-to, FAQ, share, breadcrumb). Also requires top-level `tools.hairstyle-recommendation.title` / `.description` (home card, footer, search). Face-shape names, hairstyle names, reasons, and tips that come from the model/catalog are localized in the catalog data + prompt, NOT in the i18n message files.
  - Platform dependency (NEW category + server): (1) add `'beauty'` to `ToolCategory`; (2) add ONE `ToolMeta` registry entry (no tool-specific accent; all tools use brand red); (3) add slug→component branch + generateMetadata branch in the tool route; (4) add the `content`/sitemap block for this tool; (5) FIRST tool to require the OpenNext server runtime + the `src/app/api/**` surface + provider env wiring — establish this once, reuse for every future AI tool.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Two entry paths: photo path (upload/capture → AI face-shape analysis) and no-photo path (manual face-shape pick from labeled illustrations).
    - Client-side image handling: file picker + drag-drop + (mobile) camera capture; validation (type/size); downscale to longest edge ≤ 1024px, JPEG q≈0.85 via canvas before upload; local preview.
    - `POST /api/hairstyle/analyze`: accepts the resized image (base64 JSON), returns FaceAnalysis (faceShape, confidence, features, notes). Ephemeral — image never stored/logged.
    - `POST /api/hairstyle/recommend`: accepts RecommendInput (faceShape + attributes), returns Recommendation[] (3–6). Works with OR without a prior analyze call.
    - Attribute refinement (both paths): preference (feminine/masculine/neutral), hair length (short/medium/long), hair type (straight/wavy/curly/coily), occasion (daily/business/event/seasonal). Sensible defaults; all optional except faceShape.
    - Curated static hairstyle library (`public/hairstyles/**` + `catalog.ts`): ≥ 24 entries spanning all face shapes × preferences, each with a licensed/credited reference image; match logic selects/orders candidates for the AI to choose from and supplies the image for each returned hairstyleId.
    - `HairstyleAI` provider abstraction with default `GeminiProvider`; `AI_PROVIDER` env selects the impl; structured-JSON prompt with validation + guardrails.
    - Result UI: analysis card (face shape + confidence + features) + recommendation grid (3–6 cards: name, reason, tips, reference image). Regenerate, copy-summary/share, reset.
    - States: idle, uploading, analyzing (skeleton), recommending (skeleton), success, and every error (see error_handling). CLS-safe reserved heights.
    - Privacy notice inline at the uploader ("Your photo is analyzed once and never stored.") + a "no photo? pick your face shape" affordance.
    - Rate limiting on both endpoints; typed error envelope; input validation with zod on the server.
    - SEO/GEO: tool page metadata (title/description/canonical/hreflang/OG), SoftwareApplication + FAQPage + BreadcrumbList JSON-LD, localized long-form intro + FAQ (ko/en). Static, indexable copy rendered outside the interactive gate.
    - Reduced-motion fallbacks; WCAG 2.1 AA; full keyboard support.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots mechanism, tool registry mechanism (all platform).
    - **Generative virtual try-on** — synthesizing the user's face with a new hairstyle. No image generation of any kind in this build. (Phase 2.)
    - Storing, caching, or logging the uploaded photo anywhere (KV, R2, D1, disk, logs). Ephemeral-only.
    - Accounts / login / saved history / cross-device sync / result persistence beyond a shareable URL summary.
    - Real-time face landmark detection in the browser, AR overlays, live camera preview effects.
    - Salon booking, product purchase, price estimation, stylist directory.
    - Medical/dermatological claims (hair loss diagnosis, scalp treatment).
  </out_of_scope>
  <future_considerations>
    - **Generative virtual try-on (Phase 2):** add `generateTryOn(image, hairstyleId)` to `HairstyleAI`, a result-image slot on the recommendation card, and an image-gen provider (e.g. Gemini image editing). Same UI shell, opt-in per card.
    - Color/hair-dye suggestions matched to skin tone (Phase 2).
    - Save/compare shortlists via localStorage (Phase 2).
    - Seasonal / trending style packs curated over time (Phase 3).
    - Optional accounts for saved looks + cloud sync (Phase 3).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited_from_platform>
    - Framework: Next.js 15 (App Router), React 19, TypeScript strict.
    - Styling: Tailwind v4 + DESIGN.md tokens (tokens.css).
    - i18n: next-intl (ko/en, localePrefix 'always').
    - Icons: lucide-react.
    - Validation: zod.
  </inherited_from_platform>
  <tool_specific>
    <runtime>Cloudflare Workers via OpenNext (@opennextjs/cloudflare, latest) — enables server route handlers. Replaces apps.jurepi.kr's static export for this hub.</runtime>
    <ai_sdk>@google/genai (Google Gen AI SDK for JS, latest) — used only inside GeminiProvider on the server. Model: gemini-2.5-flash (vision + text, structured JSON output).</ai_sdk>
    <ai_abstraction>Local interface `HairstyleAI` (src/lib/hairstyle-recommendation/ai/types.ts) + factory (index.ts) selecting by AI_PROVIDER. No provider SDK is imported outside its own provider file.</ai_abstraction>
    <image_resize>Browser canvas downscale (no library) — createImageBitmap + OffscreenCanvas/Canvas → toBlob('image/jpeg', 0.85). Guard longest edge ≤ 1024px.</image_resize>
    <rate_limit>Cloudflare Workers KV or in-memory token bucket per IP (see security). KV binding name: RATE_LIMIT_KV (optional; falls back to per-isolate limiter if unbound).</rate_limit>
    <note>NO database. NO photo storage. The ONLY stateful platform binding is the optional rate-limit KV, which stores counters keyed by hashed IP — never image data.</note>
  </tool_specific>
  <libraries>
    <genai>@google/genai (latest) — Gemini vision + text, server-only, inside GeminiProvider</genai>
    <opennext>@opennextjs/cloudflare (latest) — Next.js → Cloudflare Workers adapter</opennext>
    <zod>zod v4 — request + provider-response validation</zod>
    <lucide>lucide-react (^0.468) — icons (Scissors, Sparkles, Upload, Camera, ShieldCheck, RefreshCw, Share2)</lucide>
  </libraries>
</technology_stack>

<environment_variables>
  <variable>
    <name>AI_PROVIDER</name>
    <description>Selects the HairstyleAI implementation (server-only)</description>
    <required>false</required>
    <example>gemini</example>
    <note>Defaults to "gemini" when unset. Enum: gemini (extend as providers are added).</note>
  </variable>
  <variable>
    <name>GEMINI_API_KEY</name>
    <description>Google Gen AI API key — server-only, used exclusively inside GeminiProvider</description>
    <required>true</required>
    <example>AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</example>
    <note>CRITICAL: server-only. NEVER prefix with NEXT_PUBLIC_. Never referenced in client bundles. Validate presence at request time; return AI_UNAVAILABLE if missing.</note>
  </variable>
  <variable>
    <name>HAIRSTYLE_RATE_LIMIT_PER_MIN</name>
    <description>Max requests per minute per client IP for the analyze/recommend endpoints</description>
    <required>false</required>
    <example>12</example>
    <note>Defaults: analyze 10/min, recommend 20/min. This var, if set, overrides the analyze limit.</note>
  </variable>
  <variable>
    <name>RATE_LIMIT_KV</name>
    <description>Cloudflare KV binding for cross-isolate rate-limit counters (wrangler binding, not a value)</description>
    <required>false</required>
    <note>If unbound, the route falls back to a best-effort per-isolate in-memory limiter.</note>
  </variable>
</environment_variables>

<file_structure>
src/
├── app/
│   ├── [locale]/tools/hairstyle-recommendation/
│   │   └── page.tsx                    # SSG shell + long-form intro/FAQ + <HairstyleTool/> (client) + JSON-LD
│   └── api/hairstyle/
│       ├── analyze/route.ts            # POST: image → FaceAnalysis (ephemeral)
│       └── recommend/route.ts          # POST: RecommendInput → Recommendation[]
├── components/tools/hairstyle-recommendation/
│   ├── HairstyleTool.tsx               # "use client" root; owns flow state machine
│   ├── EntryChooser.tsx                # photo path vs no-photo path
│   ├── PhotoDropzone.tsx               # picker + drag-drop + camera; client resize; privacy notice
│   ├── FaceShapePicker.tsx             # labeled face-shape illustrations (no-photo path)
│   ├── AttributeSelectors.tsx          # preference / length / type / occasion pills
│   ├── AnalysisCard.tsx                # face shape + confidence meter + features
│   ├── RecommendationGrid.tsx          # 3–6 RecommendationCard
│   ├── RecommendationCard.tsx          # name + reason + tips + reference image
│   └── ResultActions.tsx               # regenerate / copy-summary / share / reset
├── lib/hairstyle-recommendation/
│   ├── schema.ts                       # zod: AnalyzeRequest, RecommendRequest, FaceAnalysis, Recommendation, ApiEnvelope
│   ├── constants.ts                    # enums, MAX_IMAGE_BYTES, MAX_EDGE_PX, JPEG_QUALITY, rate limits
│   ├── catalog.ts                      # curated HairstyleLibraryEntry[] + match(faceShape, attrs) → candidate IDs
│   ├── catalog.test.ts
│   ├── resize.ts                       # client canvas downscale helper
│   ├── resize.test.ts
│   ├── prompt.ts                        # buildAnalyzePrompt / buildRecommendPrompt (structured-JSON contract)
│   ├── rate-limit.ts                   # per-IP token bucket (KV or in-memory)
│   ├── ai/
│   │   ├── types.ts                    # HairstyleAI interface + provider-facing types
│   │   ├── gemini.ts                   # GeminiProvider (uses @google/genai, GEMINI_API_KEY)
│   │   ├── index.ts                    # getProvider() factory (AI_PROVIDER)
│   │   └── gemini.test.ts              # provider mapping/guardrail tests (mocked SDK)
│   └── index.ts                        # barrel
├── i18n/messages/{ko,en}.json          # tools.hairstyle-recommendation.* namespace
└── tools/registry.ts                   # +1 ToolMeta entry (id hairstyle-recommendation)
public/hairstyles/                      # curated reference images (webp/avif, credited)
└── <hairstyleId>/<gender>.webp
wrangler.jsonc / open-next.config.ts    # OpenNext + Workers config, KV + env bindings
</file_structure>

<core_data_entities>
  <FaceAnalysis>
    - faceShape: enum (oval, round, square, heart, oblong, diamond, triangle) — required
    - confidence: number (0.0–1.0, model-reported certainty)
    - features: string[] (0–5 short salient notes, e.g. "strong jawline", "high forehead"), localized to request locale
    - notes: string (optional, ≤ 240 chars, neutral non-medical description)
  </FaceAnalysis>
  <RecommendInput>
    - faceShape: enum (oval, round, square, heart, oblong, diamond, triangle) — required
    - preference: enum (feminine, masculine, neutral) — default neutral
    - length: enum (short, medium, long) — optional (no constraint if omitted)
    - hairType: enum (straight, wavy, curly, coily) — optional
    - occasion: enum (daily, business, event, seasonal) — default daily
    - locale: enum (ko, en) — drives language of reason/tips
  </RecommendInput>
  <Recommendation>
    - hairstyleId: string (references a HairstyleLibraryEntry.id) — required, must exist in catalog
    - name: object { ko: string, en: string } (from catalog)
    - reason: string (AI: why it suits this faceShape + attributes, ≤ 280 chars, localized)
    - tips: string[] (AI: 2–3 styling/maintenance tips, each ≤ 120 chars, localized)
    - referenceImage: object { src: string (e.g. /hairstyles/soft-layered-bob/feminine.webp), alt: string, credit: string }
    - tags: string[] (from catalog: e.g. ["volume", "low-maintenance"])
  </Recommendation>
  <HairstyleLibraryEntry>  <!-- curated static catalog; source of truth for imagery -->
    - id: string (kebab-case, stable, unique)
    - name: object { ko: string, en: string }
    - suitableFaceShapes: enum[] (subset of the 7 face shapes)
    - preference: enum (feminine, masculine, neutral)
    - length: enum (short, medium, long)
    - hairType: enum[] (subset of straight, wavy, curly, coily)
    - image: object { src: string, alt: string, credit: string, license: string }
    - tags: string[]
  </HairstyleLibraryEntry>
  <ApiEnvelope>
    - ok: boolean
    - data: FaceAnalysis | { recommendations: Recommendation[] } | null
    - error: object { code: enum (see error codes), message: string } | null
  </ApiEnvelope>
  <constants>
    - FACE_SHAPES = [oval, round, square, heart, oblong, diamond, triangle]
    - PREFERENCES = [feminine, masculine, neutral]; LENGTHS = [short, medium, long]
    - HAIR_TYPES = [straight, wavy, curly, coily]; OCCASIONS = [daily, business, event, seasonal]
    - MAX_IMAGE_BYTES = 5 * 1024 * 1024 (5 MB); MAX_EDGE_PX = 1024; JPEG_QUALITY = 0.85
    - MIN_RECS = 3; MAX_RECS = 6
    - RATE_LIMIT_ANALYZE_PER_MIN = 10; RATE_LIMIT_RECOMMEND_PER_MIN = 20
    - ALLOWED_IMAGE_TYPES = [image/png, image/jpeg, image/webp]
  </constants>
</core_data_entities>

<api_endpoints>
  <endpoint name="analyze">
    <method>POST</method>
    <path>/api/hairstyle/analyze</path>
    <runtime>Cloudflare Worker (OpenNext) — Node-compatible route handler</runtime>
    <request>
      Content-Type: application/json
      Body (zod AnalyzeRequest): { image: string (data URL or base64, ≤ MAX_IMAGE_BYTES decoded), mimeType: enum ALLOWED_IMAGE_TYPES, locale: enum (ko, en) }
    </request>
    <response>200 ApiEnvelope { ok: true, data: FaceAnalysis, error: null }</response>
    <flow>
      1. Rate-limit check (IP) → 429 RATE_LIMITED if exceeded.
      2. zod validate; decode + size/type guard → 413 IMAGE_TOO_LARGE / 415 INVALID_IMAGE.
      3. getProvider().analyzeFace(image) with buildAnalyzePrompt(locale) forcing structured JSON.
      4. Validate provider output against FaceAnalysis zod schema; if no face → 422 NO_FACE_DETECTED.
      5. Return envelope. Discard image bytes (never written anywhere).
    </flow>
    <errors>400 VALIDATION_ERROR, 413 IMAGE_TOO_LARGE, 415 INVALID_IMAGE, 422 NO_FACE_DETECTED, 429 RATE_LIMITED, 502 AI_UNAVAILABLE, 500 INTERNAL</errors>
  </endpoint>
  <endpoint name="recommend">
    <method>POST</method>
    <path>/api/hairstyle/recommend</path>
    <request>
      Content-Type: application/json
      Body (zod RecommendRequest = RecommendInput). No image. Works standalone (no prior analyze required).
    </request>
    <response>200 ApiEnvelope { ok: true, data: { recommendations: Recommendation[] (MIN_RECS–MAX_RECS) }, error: null }</response>
    <flow>
      1. Rate-limit check (IP) → 429 RATE_LIMITED.
      2. zod validate input.
      3. catalog.match(faceShape, attrs) → candidate hairstyleIds (superset).
      4. getProvider().recommend(input, candidates) with buildRecommendPrompt — AI selects/orders MIN..MAX and writes reason + tips per pick, choosing ONLY from candidate IDs.
      5. Validate each Recommendation (hairstyleId ∈ catalog; lengths; localized); drop invalid; ensure ≥ MIN_RECS (backfill from catalog if the model under-returns).
      6. Attach referenceImage + name + tags from catalog. Return envelope.
    </flow>
    <errors>400 VALIDATION_ERROR, 429 RATE_LIMITED, 502 AI_UNAVAILABLE, 500 INTERNAL</errors>
  </endpoint>
  <envelope_rule>All endpoints return the ApiEnvelope shape (200 with ok:false is NOT used — errors use their HTTP status AND an ok:false body with a typed code).</envelope_rule>
</api_endpoints>

<component_hierarchy>
  <app_shell>  <!-- provided by platform: ThemeProvider → IntlProvider → ConsentProvider → ToastProvider -->
    <tool_page route="/[locale]/tools/hairstyle-recommendation">
      <breadcrumb />                     <!-- platform -->
      <intro_prose />                    <!-- static, indexable (outside interactive gate) -->
      <hairstyle_tool>                   <!-- "use client"; owns the flow state machine -->
        <entry_chooser />                <!-- photo path | no-photo path -->
        <photo_dropzone />               <!-- picker/drag/camera + client resize + privacy notice -->
        <face_shape_picker />            <!-- no-photo path: labeled illustrations -->
        <attribute_selectors />          <!-- preference / length / type / occasion pills -->
        <analysis_card />                <!-- face shape + confidence meter + features -->
        <recommendation_grid>
          <recommendation_card />        <!-- ×3–6: name, reason, tips, reference image -->
        </recommendation_grid>
        <result_actions />               <!-- regenerate / copy-summary / share / reset -->
      </hairstyle_tool>
      <faq_prose />                      <!-- static, indexable -->
      <ad_slot in_content />             <!-- platform, height-reserved -->
    </tool_page>
  </app_shell>

  <shared>  <!-- platform-provided primitives reused here -->
    <toast />                            <!-- success/error/warning -->
    <share_buttons />                    <!-- entity absolute URL -->
    <skeleton />                         <!-- analyzing / recommending placeholders -->
    <empty_state />                      <!-- icon + message + CTA -->
  </shared>
</component_hierarchy>

<pages_and_interfaces>
  <tool_page_layout>
    Container max-width 960px, centered, horizontal padding 20px (mobile) / 24px (≥768px). Vertical rhythm: 24px between major blocks, 16px within a block. Page ground surface-soft (#fbfbf9); card surfaces canvas white (#ffffff), radius 16px (md) / 32px (lg), flat (no shadow except modal scrim). No tool-specific accent; all actions and highlights use brand red (#e60023).
  </tool_page_layout>

  <entry_chooser>
    Two large option tiles side-by-side (stacked on mobile), each 1:1-ish, radius 16px, 20px padding, icon tile (44px) top-left in surface-card (#f6f6f3).
    - Tile A "Upload a photo" (icon Camera): subtitle "AI reads your face shape."
    - Tile B "Pick my face shape" (icon Scissors): subtitle "No photo needed — choose from illustrations."
    Hover: lift translateY(-2px) + subtle border/background shift, 150ms ease-out. Focus-visible: 2px outer #435ee5 + inner #ffffff (double-ring), offset 2px. Selected: 2px brand red (#e60023) border + surface-card fill (#f6f6f3).
  </entry_chooser>

  <photo_dropzone>
    Dashed 2px hairline border (#dadad3), radius 16px, min-height 200px, centered content: Upload icon (32px, text-muted), "Drag a photo here or tap to choose", tiny "PNG/JPG/WebP · up to 5 MB".
    Below the border: an inline privacy line with a ShieldCheck icon (16px, semantic-success) — "Your photo is analyzed once and never stored." Always visible in the photo path.
    States: idle (as above); drag-over (2px brand red border #e60023 + surface-card fill #f6f6f3); selected (thumbnail preview 96×96 radius 8px + filename + "Remove" text button); uploading/analyzing (thumbnail dimmed + centered spinner + "Analyzing your face shape…"). Camera capture on mobile via input capture="user".
    Tap target ≥ 44px. On invalid file: shake 200ms + inline error text (semantic-danger #ef4444, 13px) + toast.
  </photo_dropzone>

  <face_shape_picker>
    Grid of 7 face-shape illustrations (auto-fit, min 96px, gap 12px). Each: labeled SVG silhouette in white card, radius 16px, label below (13px, text-secondary). Selected: 2px brand red border (#e60023) + surface-card fill (#f6f6f3) + check badge. Keyboard: roving tabindex, arrows move, Enter/Space select.
  </face_shape_picker>

  <attribute_selectors>
    Four labeled rows (Preference, Length, Hair type, Occasion). Each row: label (13px, text-secondary, 600) + a wrap of pill toggles (single-select per row). Pill: height 36px, padding 0 14px, radius full (9999px), hairline border #dadad3; default = surface-card (#f6f6f3); selected = ink background (#262622) + white text (#ffffff). Length/Type/Occasion optional (an "Any" pill is selectable). Preference defaults to Neutral. Changing an attribute after results are shown enables Regenerate.
  </attribute_selectors>

  <primary_cta>
    Full-width (mobile) / auto (desktop) button with background brand red (#e60023), text white (#ffffff), height 48px, radius 16px, label "Get recommendations". Disabled until faceShape is known (analyzed or picked). Hover/Pressed: #cc001f. Loading: spinner + "Finding styles…", button disabled. NOTE: all actions and emphasis use brand red (#e60023) — single accent across platform, per DESIGN.
  </primary_cta>

  <analysis_card>
    Shown only in the photo path after analyze. White card, 20px padding, radius 16px. Left: face-shape name (Pretendard 20px/700). Right: confidence meter — a 6px-tall track (hairline-soft #e5e5e0) with brand red fill (#e60023), width = confidence%, plus "NN% match" (12px, text-muted). Below: features as small chips (surface-card fill, 12px, text ash #91918c). If confidence < 0.5: a gentle note "Not fully sure — you can pick your face shape manually" + a "Pick manually" text button. Entrance: fade + rise 8px, 200ms.
  </analysis_card>

  <recommendation_grid>
    Responsive grid: 1 col (<640px), 2 col (640–1023px), 3 col (≥1024px), gap 16px. Reserved min-height while loading to protect CLS. Loading: 3–6 skeleton cards (shimmer, reduced-motion → static). Empty (shouldn't happen post-backfill, but): empty_state with "No matches — try different attributes" + reset.
  </recommendation_grid>

  <recommendation_card>
    White card, radius 16px, overflow hidden, flat (no shadow by default). Top: reference image, aspect-ratio 4:5, object-fit cover, explicit width/height to prevent CLS, loading="lazy", credit as tiny caption bottom-right (10px, on-image scrim). Body (16px padding): hairstyle name (Pretendard 17px/700), reason (14px/1.55, text-charcoal #262622), then a "Styling tips" label (12px, text-mute #62625b, 600) + 2–3 bullet tips (13px). Footer: tag chips (11px). Hover: lift translateY(-2px) + subtle background/border shift, 150ms. Focus-visible: brand red border if it links out.
  </recommendation_card>

  <result_actions>
    Row under the grid: "Regenerate" (secondary button, icon RefreshCw — re-calls recommend with same input for fresh picks), "Copy summary" (copies a text digest: face shape + style names + reasons), Share (platform ShareButtons), "Start over" (text button — resets state, clears any preview). Regenerate is rate-limit aware; on 429 show the wait toast and disable for the cooldown.
  </result_actions>

  <keyboard_shortcuts_reference>
    - Tab / Shift+Tab: move between controls; visible focus ring always.
    - Arrow keys: move within face-shape picker and pill groups (roving tabindex).
    - Enter / Space: select a tile/pill/face shape; activate buttons.
    - Esc: in photo path, clear the selected image; close any open menu.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <entry_and_input>
    - Choose photo path or no-photo path; switch freely without losing attribute selections.
    - Photo path: validate → resize (canvas) → preview → POST /analyze → AnalysisCard.
    - No-photo path: pick face shape from illustrations → straight to attributes.
  </entry_and_input>
  <recommendation>
    - POST /recommend with faceShape + attributes; catalog.match narrows candidates; AI selects/orders 3–6 and authors reason + tips; server attaches imagery from catalog.
    - Regenerate for a fresh set (same input); results vary via prompt-level diversity, not stored randomness.
  </recommendation>
  <output_and_share>
    - Render analysis + recommendations; copy a text summary; share via platform ShareButtons.
    - Reset clears all state and any in-memory image preview.
  </output_and_share>
  <resilience>
    - No-face / low-confidence → nudge to manual pick (no dead end).
    - Model under-returns → backfill from catalog to guarantee ≥ 3.
    - Provider down → typed AI_UNAVAILABLE with retry affordance.
  </resilience>
</core_functionality>

<error_handling>
  <user_facing>
    <toast_notifications>
      - Success: semantic-success (#22c55e), 3s auto-dismiss.
      - Error: semantic-danger (#ef4444), persistent until dismissed.
      - Warning (e.g. rate limit cooldown): semantic-warning (#f59e0b), 5s.
      - Max 3 stacked, oldest dismissed first (platform Toast).
    </toast_notifications>
    <inline_validation>
      - Invalid file type/size: inline text under the dropzone (semantic-danger, 13px) + shake 200ms + toast. Message names the limit ("Up to 5 MB · PNG, JPG, WebP").
    </inline_validation>
    <domain_errors>
      - NO_FACE_DETECTED (422): AnalysisCard replaced by an inline notice "We couldn't detect a face — try a clearer, front-facing photo, or pick your face shape manually" + "Pick manually" button (switches to no-photo path, keeps attributes).
      - Low confidence (<0.5): non-blocking note + manual-pick affordance.
      - Empty recommendations: empty_state with reset (guarded by backfill).
    </domain_errors>
    <offline>
      - fetch failure: toast "You appear to be offline — check your connection and try again." Buttons re-enable for retry.
    </offline>
  </user_facing>
  <api_error_mapping>
    - 400 VALIDATION_ERROR → "Something looks off with the request. Please try again."
    - 413 IMAGE_TOO_LARGE → "That photo is too large (max 5 MB). Try a smaller image."
    - 415 INVALID_IMAGE → "Unsupported image. Use PNG, JPG, or WebP."
    - 422 NO_FACE_DETECTED → domain notice (above).
    - 429 RATE_LIMITED → warning toast "You're going a bit fast — please wait a moment." Disable trigger for the cooldown window (from Retry-After).
    - 502 AI_UNAVAILABLE → "Our style advisor is briefly unavailable. Please try again." + Retry button.
    - 500 INTERNAL → generic error toast; log server-side (no image data).
  </api_error_mapping>
  <error_boundary>Platform Error Boundary wraps the tool module; fallback UI = "Something went wrong" + reset button. Dev logs to console; prod logs exclude any request image.</error_boundary>
</error_handling>

<third_party_integrations>
  <integration name="Google Gemini (via HairstyleAI/GeminiProvider)">
    <purpose>Vision face-shape analysis + text reasoning for recommendations</purpose>
    <sdk>@google/genai (JS), model gemini-2.5-flash, server-only</sdk>
    <usage>
      - analyzeFace(image, locale): image part + buildAnalyzePrompt; responseMimeType application/json + responseSchema mirroring FaceAnalysis; parse + zod-validate.
      - recommend(input, candidateIds, locale): text prompt listing ONLY candidate hairstyleIds; responseSchema mirroring Recommendation[] (id + reason + tips); parse + zod-validate; reject ids not in candidates.
    </usage>
    <guardrails>Structured JSON output enforced; temperature modest (~0.6) for recommend, low for analyze; server rejects any hairstyleId outside candidates; caps on string lengths; no PII retained.</guardrails>
    <cost>Free-tier friendly; analyze = 1 image call, recommend = 1 text call per action. No image generation (no image-gen cost).</cost>
  </integration>
  <swap_note>To add a provider: implement HairstyleAI in a new file under ai/, register it in ai/index.ts, set AI_PROVIDER. No route/UI changes.</swap_note>
</third_party_integrations>

<aesthetic_guidelines>
  <inherited>Full DESIGN system inherited from ai.jurepi.kr/docs/DESIGN.md (brand red #e60023, warm-cream neutral surfaces canvas #ffffff / surface-soft #fbfbf9 / surface-card #f6f6f3, Pretendard display/body across all scales, md 16px / lg 32px / pill full radius, flat elevation—no shadows except modal scrim, semantic colors, focus double-ring outer #435ee5 + inner #ffffff). Actions and all emphasis = brand red (#e60023); no tool-specific accents or category tints.</inherited>
  <typography>Face-shape + hairstyle names: Pretendard 700 (17–20px, line-height 1.1–1.2, tight tracking where needed). Body/reason/tips: Pretendard 500/600 (13–14px, line-height 1.5–1.55).</typography>
  <spacing>Base unit 4px; card padding 16–20px; grid gap 16px; block rhythm 24px.</spacing>
  <animations>
    - Card hover lift: translateY(-2/-3px) + shadow, 150ms ease-out (transform/opacity only).
    - Result entrance: fade + rise 8px, 200ms, staggered ~40ms per card.
    - Skeleton shimmer while analyzing/recommending.
    - Invalid input: shake 200ms.
    - prefers-reduced-motion: no lift/shimmer/shake — static reveals, instant states.
  </animations>
  <responsive_design>
    <breakpoints>
      - mobile 0–639px: single column; entry tiles stack; grid 1 col; primary CTA full-width.
      - tablet 640–1023px: entry tiles side-by-side; grid 2 col.
      - desktop 1024px+: grid 3 col; container max 960px centered.
    </breakpoints>
    <mobile_adaptations>
      - Camera capture available (input capture="user").
      - Sticky primary CTA within the tool block on small screens once faceShape is known.
      - Reference images keep 4:5 aspect with explicit dimensions (no CLS).
      - Tap targets ≥ 44px; pills wrap.
    </mobile_adaptations>
  </responsive_design>
  <icons>lucide-react: Camera, Scissors, Upload, ShieldCheck, RefreshCw, Share2, Sparkles. 16–32px, stroke ~2.</icons>
  <accessibility>WCAG 2.1 AA. Body contrast ≥4.5:1 across all color pairings. Full keyboard nav + visible focus-visible ring. Face-shape picker + pills use roving tabindex + aria-pressed/aria-selected. Confidence meter has aria-valuenow. Images have meaningful alt. State never conveyed by color alone. prefers-reduced-motion honored.</accessibility>
</aesthetic_guidelines>

<security_considerations>
  <image_privacy>
    - CRITICAL: The uploaded image is EPHEMERAL. It is decoded in memory, passed to the provider for ONE call, and discarded. It is NEVER written to disk, KV, R2, D1, cache, or logs, and NEVER returned in a response.
    - CRITICAL: Do not log request bodies on the analyze route. Error logs must exclude image bytes.
    - Client downscales before upload (MAX_EDGE_PX 1024, JPEG_QUALITY 0.85) to minimize data sent.
    - The privacy guarantee is shown in the UI at the uploader.
  </image_privacy>
  <input_validation>
    - CRITICAL: zod-validate every request body server-side. Enforce ALLOWED_IMAGE_TYPES + MAX_IMAGE_BYTES on the decoded image. Enforce enums on all attributes. Reject unknown fields.
    - Validate provider output with zod before use; reject hairstyleIds outside the candidate set; clamp string lengths.
  </input_validation>
  <key_isolation>
    - CRITICAL: GEMINI_API_KEY is server-only. Never expose via NEXT_PUBLIC_. The browser never calls the provider directly. Verify no client bundle references the key.
  </key_isolation>
  <rate_limiting>
    - Per-IP token bucket: analyze 10/min, recommend 20/min (configurable). 429 with Retry-After. KV-backed when RATE_LIMIT_KV is bound; per-isolate fallback otherwise. IPs are hashed before use as keys.
  </rate_limiting>
  <headers_and_cors>
    - API routes accept same-origin only; reject cross-origin POSTs (check Origin). Standard security headers via platform (X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, HSTS, Permissions-Policy camera=(self)).
    - Permissions-Policy allows camera for the tool origin only (mobile capture); microphone/geolocation denied.
  </headers_and_cors>
</security_considerations>

<advanced_functionality>
  - Manual face-shape fallback everywhere a photo fails or is declined (no dead ends).
  - Regenerate for fresh recommendations without re-analyzing.
  - Copy-summary produces a shareable plain-text digest (localized).
  - Full keyboard operation + reduced-motion parity.
  - Provider-swap seam ready for a second provider or the Phase 2 try-on method.
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Photo path happy flow (ko)</description>
    <steps>
      1. Open /ko/tools/hairstyle-recommendation.
      2. Choose "사진 업로드"; confirm the privacy line is visible.
      3. Select a clear front-facing JPG (~2 MB).
      4. Verify it is downscaled client-side (longest edge ≤ 1024px) before POST /analyze.
      5. Verify AnalysisCard shows a face shape + confidence meter + feature chips.
      6. Set Preference=Feminine, Length=Medium, Occasion=Daily.
      7. Tap "추천 받기" → POST /recommend.
      8. Verify 3–6 recommendation cards, each with name, reason (ko), 2–3 tips, and a reference image with explicit dimensions.
      9. Confirm no layout shift when images load (CLS < 0.1).
      10. Tap Regenerate → a fresh valid set returns; all hairstyleIds exist in the catalog.
      11. Copy summary → clipboard holds face shape + style names + reasons.
      12. Confirm no network request ever carried the full-size original and the server stored nothing.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>No-photo path (en)</description>
    <steps>
      1. Open /en/tools/hairstyle-recommendation; choose "Pick my face shape".
      2. Select "Square" from the illustrations via keyboard (arrows + Enter).
      3. Leave Length/Type as "Any"; set Occasion=Business.
      4. Get recommendations → POST /recommend fires with NO image and NO prior analyze.
      5. Verify ≥ 3 cards with English reasons/tips.
      6. Verify the analyze endpoint was never called.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Oversized / invalid image</description>
    <steps>
      1. Photo path; drop a 12 MB HEIC/large PNG.
      2. Verify client-side reject (or post-resize guard) → inline error + shake + toast naming the 5 MB / PNG·JPG·WebP limit.
      3. Force a malformed base64 to /analyze → 415 INVALID_IMAGE mapped to the friendly message.
      4. Confirm no server-side persistence or logging of the payload.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>No face detected → manual fallback</description>
    <steps>
      1. Upload a photo with no clear face (landscape).
      2. /analyze returns 422 NO_FACE_DETECTED.
      3. Verify the inline notice + "Pick manually" button.
      4. Click it → switches to no-photo path, attributes preserved.
      5. Pick a face shape → recommendations succeed.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Rate limiting + provider outage</description>
    <steps>
      1. Fire /recommend rapidly beyond the per-minute limit.
      2. Verify 429 RATE_LIMITED with Retry-After; warning toast; trigger disabled for the cooldown.
      3. Simulate provider failure (unset/invalid key) → 502 AI_UNAVAILABLE.
      4. Verify friendly error + Retry button; server logs contain NO image data.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>
    - Both entry paths work; recommend succeeds with and without a prior analyze.
    - Every returned hairstyleId exists in the catalog; ≥ 3 recommendations guaranteed (backfill).
    - No-face / low-confidence / rate-limit / provider-outage all handled without dead ends.
  </functionality>
  <user_experience>
    - Time-to-first-recommendation ≈ ≤ 4s on a typical connection (single analyze + single recommend call).
    - CLS < 0.1 (reserved heights, explicit image dimensions). Fully keyboard-operable. Mobile-first, ≥44px targets.
  </user_experience>
  <technical_quality>
    - Provider access only through HairstyleAI; no provider SDK imported outside its provider file.
    - Server-side zod validation on all inputs AND provider outputs; typed error envelope.
    - Unit tests for catalog match, resize, prompt building, and provider output mapping (mocked SDK) ≥ 80% on the tool's lib.
  </technical_quality>
  <security_privacy>
    - No image is ever stored or logged (verified). Key is server-only (verified absent from client bundle). Rate limiting active. Same-origin enforced.
  </security_privacy>
  <visual_design>
    - Matches ai.jurepi.kr DESIGN tokens; single brand red accent for all actions and emphasis; no tool-specific accents. Light theme polished (dark = Phase 2).
  </visual_design>
  <build>
    - `next build` + OpenNext build succeed; deploys to Cloudflare Workers; env + optional KV bound; tool page is indexable (JSON-LD valid).
  </build>
</success_criteria>

<build_output>
  - Build: `next build` then `opennextjs-cloudflare build` (OpenNext adapter) → Cloudflare Workers artifact.
  - Deploy: `wrangler deploy` with GEMINI_API_KEY as a secret (`wrangler secret put GEMINI_API_KEY`), AI_PROVIDER + rate-limit vars as vars, optional RATE_LIMIT_KV binding.
  - The tool page is SSG/streamed; /api/hairstyle/* run as Worker route handlers (NOT static).
  - Custom domain ai.jurepi.kr (already owned). workers_dev disabled (mirror apps.jurepi.kr) to avoid duplicate indexable host.
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Establish the ai.jurepi.kr platform on OpenNext/Workers (this is the FIRST tool to need a server) — get `src/app/api/**` running end-to-end with the provider seam and secret handling before building UI polish.
    2. The privacy invariant (ephemeral image, no logging) — bake into the analyze route from the first commit; add a test asserting no persistence.
    3. The provider abstraction seam — keep the SDK strictly inside gemini.ts.
  </critical_paths>
  <recommended_implementation_order>
    1. Platform scaffold: OpenNext + Workers config, tokens (add `beauty` category; no tool-specific accent—all tools use brand red), registry entry, i18n namespace, tool route shell + intro/FAQ prose + JSON-LD.
    2. lib: constants + zod schema + catalog (seed ≥ 24 entries + images) + resize + prompt.
    3. AI seam: types + GeminiProvider + factory (+ mocked tests).
    4. API: recommend route first (no image, simplest), then analyze route (with privacy test).
    5. UI: EntryChooser → FaceShapePicker + AttributeSelectors → recommend flow → RecommendationGrid/Card → ResultActions. Then PhotoDropzone + client resize + AnalysisCard → analyze flow.
    6. Error/edge states, a11y pass, reduced-motion, responsive check (320/375/768/1024/1440).
    7. Rate limiting + headers, SEO/JSON-LD verification, Lighthouse/CWV.
  </recommended_implementation_order>
  <testing_strategy>Unit-test the pure lib (catalog match, resize math, prompt shape, provider output→Recommendation mapping with a mocked SDK). Integration-test the two routes (validation, error codes, backfill, no-persistence). E2E the 5 scenarios above with Playwright; screenshot 320/768/1024/1440. Mock the provider in tests — never call the live API in CI.</testing_strategy>
  <phase_2_seam>For generative try-on: add `generateTryOn(image, hairstyleId): Promise<{ image: string }>` to HairstyleAI, an opt-in "Try it on me" action + result-image slot on RecommendationCard, and an image-gen provider. No change to analyze/recommend contracts.</phase_2_seam>
</key_implementation_notes>

</project_specification>
```
