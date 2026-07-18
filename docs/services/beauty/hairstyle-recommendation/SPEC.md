# Hairstyle Recommendation — AI Face-Shape Style Advisor — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation lives in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes. **Synchronized to ai.jurepi.kr DESIGN.md (2026-07-18): brand-red primary + 6-category accents (beauty = rose), Gmarket Sans display + Pretendard body, 16/32/pill radius. Updated 2026-07-18: wide tool-page shell, always-visible photo panel, AI style-preview image generation (platform `src/lib/ai` capability layer; dev = Ollama). Updated 2026-07-18 (rev 2): gender-aware recommendations (analyze detects perceived gender; auto-applied with manual override), face-preserving style previews (user photo + hair-only edit via an edit-capable image provider, opt-out toggle default ON), workspace RAIL moved to the LEFT, locale-correct backfill text, +10 masculine catalog entries with per-entry `genders` tags, `evals/` prompt-evaluation harness (uv + LangChain + Ollama).**
>
> Build specification for **Hairstyle Recommendation** (헤어스타일 추천) — the **first AI tool** on the new **ai.jurepi.kr** hub (an AI-powered sibling of the existing no-AI [apps.jurepi.kr](https://apps.jurepi.kr)). The user either **uploads a face photo** (analyzed by an AI vision model) or **picks their face shape manually**, refines a few attributes (preference, hair length, hair type, occasion), and receives **3–6 recommended hairstyles** — each with a "why it suits you" explanation, styling/maintenance tips, and a **curated reference image**. The analysis also detects **perceived gender presentation** (male/female/unknown); the detected gender is **auto-applied** so a male photo yields masculine-appropriate styles, with a **manual gender override** always available. The AI returns **structured text**; every card shows a curated reference image immediately, and — when an image provider is enabled — an **AI-generated style preview** progressively replaces it: **face-preserving** (the user's own photo with ONLY the hair changed; opt-out toggle, default ON) when a photo exists and the provider supports image editing, otherwise a generic model portrait matching the detected gender. **Nothing is ever stored or logged** — the photo and all previews are ephemeral.
>
> Internal service codename: `hairstyle-recommendation`. Registry id: `hairstyle-recommendation`. Public URL slug: `/[locale]/tools/hairstyle-recommendation`. Category: `beauty`. Accent: `rose` (6-category accent system, 2026-07-18).
>
> **CRITICAL — SERVER-SIDE AI, NOT STATIC EXPORT.** apps.jurepi.kr is a static export served by an assets-only Worker (no server). This tool **requires a server** to hold the AI key and run inference, so **ai.jurepi.kr is deployed on Cloudflare Workers via OpenNext** (`@opennextjs/cloudflare`), which keeps the identical Next.js 15 / React 19 / Tailwind v4 / next-intl stack and DESIGN system but enables **route handlers** (`src/app/api/hairstyle/**`). All model calls happen server-side; the API key never reaches the client.
>
> **CRITICAL — TEXT RECOMMENDATIONS + STYLE PREVIEWS (FACE-PRESERVING, CONSENT-GATED).** The AI produces structured **text** (face-shape analysis + gender + reasoning + tips + hairstyle IDs); reference images come from the **curated static library**. When `IMAGE_PROVIDER` is set, each recommendation card auto-generates a **style preview image** via the platform `ImageGenerator` port. Two preview modes (rev 2): **(a) face-preserving edit** — when the user uploaded a photo, the "Preview on my face" toggle is ON (default), and the provider supports image editing (`supportsImageEdit`), the user's photo is sent as `referenceImage` with a hair-only edit prompt (identity/skin/expression/clothing/background preserved); **(b) generic render** — otherwise, a text→image portrait of a generic model matching the recommendation's gender, built ONLY from catalog data. Free-text user input NEVER reaches the image model in either mode. If generation is disabled or fails, cards quietly keep the curated image.
>
> **CRITICAL — EPHEMERAL PHOTO, PRIVACY-FIRST.** This is a face-photo tool. The uploaded image is **resized client-side** and sent to the server only for (1) the analysis call and (2) — only while the "Preview on my face" toggle is ON — per-card face-preserving preview edits. In every case the image is **never persisted server-side, never logged, and discarded immediately** after each response; the toggle lets the user withhold their photo from the image model entirely. This is a hard rule (see `<security_considerations>`) and is surfaced in the UI.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO/ad infrastructure, and design tokens are provided by the platform. The ai.jurepi.kr platform `SPEC.md` / `DESIGN.md` define the visual truth:
> - Design system (single source of visual truth): **ai.jurepi.kr `docs/DESIGN.md`** (brand red `#e60023` primary, warm-cream neutral surfaces canvas #ffffff / surface-soft #fbfbf9 / surface-card #f6f6f3, Gmarket Sans display + Pretendard body, 16px md / 32px lg / pill radius, 6-category accent system — beauty/this tool = rose; wide tool-page shell standard max-w-screen-xl 1280px).
> - Tool registry pattern: apps.jurepi.kr `src/tools/registry.ts` + `src/tools/types.ts` (`ToolMeta` shape).
> - i18n routing: next-intl, locales `['ko','en']`, `defaultLocale: 'ko'`, `localePrefix: 'always'`.

```xml
<project_specification>

<project_name>Hairstyle Recommendation — AI Face-Shape Style Advisor (ai.jurepi.kr tool, codename hairstyle-recommendation, registry id hairstyle-recommendation)</project_name>

<overview>
Hairstyle Recommendation helps a user discover haircuts that suit their face. There are two entry paths. In the **photo path**, the user uploads or captures a face photo; an AI vision model analyzes the **face shape** (oval, round, square, heart, oblong, diamond, triangle), **perceived gender presentation** (male/female/unknown — auto-applied to filter styles, manually overridable), plus salient features, and returns a structured analysis. In the **no-photo path**, the user simply selects their face shape from labeled illustrations — no image, no upload, instant (gender selectable manually). Either way, the user then refines a few attributes (gender, style preference, current hair length, hair type, occasion) and receives a set of tailored recommendations.

Each recommendation is a card: the hairstyle name (ko/en), a short "why it suits your face shape" explanation written by the AI, two or three concrete styling/maintenance tips, and a **curated reference photo** so the user can see the look — progressively upgraded to an **AI-generated style preview** when image generation is enabled. The uploaded photo stays visible in a persistent "My photo" panel throughout the flow. The user can regenerate for fresh ideas, copy a shareable summary, and open a guide. The whole flow is fast, login-free, and mobile-first — a single-page interaction mounted on the platform's SSG shell.

CRITICAL (server-side AI): unlike apps.jurepi.kr (static export, no server), this tool calls an AI model, so ai.jurepi.kr runs on **Cloudflare Workers via OpenNext**. Two **route handlers** do the work: `POST /api/hairstyle/analyze` (image → face analysis) and `POST /api/hairstyle/recommend` (attributes → recommendations). The AI key lives only in the server environment; the browser never sees it and never calls the provider directly.

CRITICAL (face-preserving previews, consent-gated): the recommendation AI returns **text and IDs only**. Curated imagery (`public/hairstyles/**`) renders immediately on every card; when IMAGE_PROVIDER is enabled, a **style preview** is auto-generated per card via `POST /api/hairstyle/preview` and fades in progressively (client concurrency 2). With a photo + "Preview on my face" toggle ON (default) + an edit-capable provider, the preview is a **hair-only edit of the user's own photo** (identity preserved); otherwise it is a generic-model text→image render matching the recommendation's gender, prompt built ONLY from catalog data. User free text never reaches the image model.

CRITICAL (ephemeral, privacy-first): the face photo is resized in the browser (longest edge ≤ 1024px, JPEG q≈0.85) and sent to the server only for the analyze call and — while the face-preview toggle is ON — per-card preview edit calls. Each request is processed in memory and discarded. No image bytes are written to disk, cache, KV, R2, or logs, ever. The privacy guarantee and the toggle are stated in the UI.

CRITICAL (provider-swappable): all model access goes through the `HairstyleAI` port, with adapters composed from the platform capability layer (`src/lib/ai/` — StructuredModel + ImageGenerator; GeminiClient frontier / OllamaClient open-source / GeminiImageClient edit-capable image generation). `AI_PROVIDER` picks the analysis/recommendation provider (gemini | ollama); `IMAGE_PROVIDER` independently picks the image-generation provider (gemini | ollama | unset = disabled). Only `gemini` (`gemini-2.5-flash-image`) supports face-preserving edits (`supportsImageEdit=true`); Ollama previews stay generic. Dev runs fully on laptop Ollama at zero API cost; adding a provider is one new file; route handlers and UI never change.
</overview>

<platform_integration>
  - Route: /[locale]/tools/hairstyle-recommendation (SSG shell + client tool; registry slug "hairstyle-recommendation", id "hairstyle-recommendation", status "live", category "beauty").
  - API routes (server, OpenNext Worker runtime): POST /api/hairstyle/analyze, POST /api/hairstyle/recommend, POST /api/hairstyle/preview (style-preview image generation; 503 IMAGE_GEN_DISABLED when no image provider is configured). Node-compatible route handlers; NOT statically exported.
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, SEO metadata + JSON-LD builders, breadcrumb, ShareButtons.
  - Consumes: i18n namespace `tools.hairstyle-recommendation.*` (UI chrome: uploader labels, attribute labels + option labels, result labels, tips heading, empty/loading/error states, privacy notice, how-to, FAQ, share, breadcrumb). Also requires top-level `tools.hairstyle-recommendation.title` / `.description` (home card, footer, search). Face-shape names, hairstyle names, reasons, and tips that come from the model/catalog are localized in the catalog data + prompt, NOT in the i18n message files.
  - Platform dependency (NEW category + server): (1) add `'beauty'` to `ToolCategory`; (2) add ONE `ToolMeta` registry entry (no tool-specific accent; all tools use brand red); (3) add slug→component branch + generateMetadata branch in the tool route; (4) add the `content`/sitemap block for this tool; (5) FIRST tool to require the OpenNext server runtime + the `src/app/api/**` surface + provider env wiring — establish this once, reuse for every future AI tool.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Two entry paths: photo path (upload/capture → AI face-shape analysis) and no-photo path (manual face-shape pick from labeled illustrations).
    - Client-side image handling: file picker + drag-drop + (mobile) camera capture; validation (type/size); downscale to longest edge ≤ 1024px, JPEG q≈0.85 via canvas before upload; local preview.
    - `POST /api/hairstyle/analyze`: accepts the resized image (base64 JSON), returns FaceAnalysis (faceShape, confidence, **gender** (male/female/unknown — perceived presentation, 'unknown' allowed), features, notes). Ephemeral — image never stored/logged.
    - `POST /api/hairstyle/recommend`: accepts RecommendInput (faceShape + attributes incl. optional **gender**), returns Recommendation[] (3–6). Works with OR without a prior analyze call.
    - Gender-aware matching (rev 2): detected gender is auto-applied as the gender attribute (user can override or clear it); `matchCandidates` hard-filters the catalog by gender first (entry `genders` includes the requested gender), then applies preference — relaxing preference to a soft filter if the gender-filtered pool would drop below MIN_RECS.
    - Attribute refinement (both paths): **gender (male/female — auto-set from analysis in the photo path, manually selectable in both paths, optional)**, preference (feminine/masculine/neutral), hair length (short/medium/long), hair type (straight/wavy/curly/coily), occasion (daily/business/event/seasonal). Sensible defaults; all optional except faceShape.
    - Curated static hairstyle library (`public/hairstyles/**` + `catalog.ts`): ≥ 24 entries spanning all face shapes × preferences, **each tagged with `genders` (male/female/both = unisex; ≥ 15 entries must include 'male' after the rev-2 masculine expansion)**, each with a licensed/credited reference image; match logic selects/orders candidates for the AI to choose from and supplies the image for each returned hairstyleId.
    - `HairstyleAI` provider abstraction with default `GeminiProvider`; `AI_PROVIDER` env selects the impl; structured-JSON prompt with validation + guardrails.
    - Result UI: analysis card (face shape + confidence + features) + recommendation grid (3–6 cards: name, reason, tips, reference image → AI style preview). Regenerate, copy-summary/share, reset.
    - Persistent "My photo" panel (2026-07-18): after upload the photo remains visible (object URL, in-memory only) through attributes → results, with replace/remove actions; sticky side rail (desktop) / compact sticky chip (mobile).
    - Two-column workspace (rev 2 — RAIL LEFT): grid-cols-1 lg:grid-cols-3 — RAIL (1/3, lg:sticky, FIRST in DOM and leftmost on desktop): MyPhotoPanel (+ face-preview toggle) + AnalysisCard (+ gender badge) + AttributeSelectors + primary CTA; MAIN (2/3, right): stage flow / results. Input→output reads left→right (before/after adjacency for face-preserving previews). Mobile order unchanged (sticky photo chip on top).
    - `POST /api/hairstyle/preview` (rev 2): per-card style-preview generation via the platform ImageGenerator port. Request may carry the user photo (`image`/`mimeType`, same size limits as analyze) + `gender`. Route branches: photo present && generator.supportsImageEdit → face-preserving edit prompt (`buildFaceEditPrompt`, hair-only change) with the photo as `referenceImage`; otherwise generic catalog prompt with gender-matched model. 768×960; rate limit 30/min/IP; ephemeral (image bytes never stored/logged); disabled → 503 IMAGE_GEN_DISABLED with quiet client fallback.
    - "Preview on my face" toggle in MyPhotoPanel (rev 2): default ON when a photo exists; OFF (or no photo / non-edit provider) → generic previews; toggling invalidates already-generated previews and requeues.
    - Locale-correct output everywhere (rev 2): model reason/tips localized via prompt; catalog `backfill()` fallback text uses locale templates (ko/en); copy-summary uses the locale name. NO hardcoded-English leakage in ko responses.
    - Dev inference on laptop Ollama (AI_PROVIDER=ollama, IMAGE_PROVIDER=ollama): qwen3-vl vision analysis, qwen3.5 text recommendations, x/z-image-turbo image generation.
    - States: idle, uploading, analyzing (skeleton), recommending (skeleton), success, and every error (see error_handling). CLS-safe reserved heights.
    - Privacy notice inline at the uploader ("Your photo is analyzed once and never stored.") + a "no photo? pick your face shape" affordance.
    - Rate limiting on both endpoints; typed error envelope; input validation with zod on the server.
    - SEO/GEO: tool page metadata (title/description/canonical/hreflang/OG), SoftwareApplication + FAQPage + BreadcrumbList JSON-LD, localized long-form intro + FAQ (ko/en). Static, indexable copy rendered outside the interactive gate.
    - Reduced-motion fallbacks; WCAG 2.1 AA; full keyboard support.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots mechanism, tool registry mechanism (all platform).
    - **Free-form generative try-on** — arbitrary user-directed edits (custom colors, accessories, free-text style requests). Face-preserving previews are catalog-prompt-only hair edits; user free text NEVER reaches the image model.
    - Storing, caching, or logging the uploaded photo anywhere (KV, R2, D1, disk, logs). Ephemeral-only — applies to the analyze call AND every preview edit call.
    - Accounts / login / saved history / cross-device sync / result persistence beyond a shareable URL summary.
    - Real-time face landmark detection in the browser, AR overlays, live camera preview effects.
    - Salon booking, product purchase, price estimation, stylist directory.
    - Medical/dermatological claims (hair loss diagnosis, scalp treatment).
  </out_of_scope>
  <future_considerations>
    - ~~Generative virtual try-on~~ → **SHIPPED in rev 2** as face-preserving previews (`ImageGenerator.referenceImage` + `supportsImageEdit`, GeminiImageClient). Remaining: an Ollama edit-capable backend (img2img pending an upstream source-image regression fix) so dev can exercise the edit path offline.
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
    <ai_abstraction>Local port `HairstyleAI` + factory (ai/index.ts) selecting by AI_PROVIDER (gemini | ollama). Adapters are thin compositions over the platform capability layer `src/lib/ai/` (StructuredModel + ImageGenerator; GeminiClient / OllamaClient + shared guardrails). No provider SDK/fetch outside adapter+client files. Style previews use `getImageGenerator()` (IMAGE_PROVIDER) — independent of the analysis provider.</ai_abstraction>
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
    <note>Defaults to "gemini" when unset. Enum: gemini, ollama (extend as providers are added). Dev convention: ollama.</note>
  </variable>
  <variable>
    <name>GEMINI_API_KEY</name>
    <description>Google Gen AI API key — server-only, used exclusively inside GeminiProvider</description>
    <required>true</required>
    <example>AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</example>
    <note>CRITICAL: server-only. NEVER prefix with NEXT_PUBLIC_. Never referenced in client bundles. Validate presence at request time; return AI_UNAVAILABLE if missing.</note>
  </variable>
  <variable>
    <name>IMAGE_PROVIDER</name>
    <description>Image-generation provider for style previews (server-only). Unset/none = preview generation disabled → /api/hairstyle/preview returns 503 IMAGE_GEN_DISABLED and the UI quietly keeps curated imagery.</description>
    <required>false</required>
    <example>gemini</example>
    <note>Enum: gemini (edit-capable — enables face-preserving previews; uses GEMINI_API_KEY), ollama (dev; generic text→image only). Production enablement of 'gemini' is a deploy-time decision (per-image cost applies); until then the deployed site keeps image generation off.</note>
  </variable>
  <variable>
    <name>GEMINI_IMAGE_MODEL</name>
    <description>Model tag for GeminiImageClient (server-only)</description>
    <required>false</required>
    <example>gemini-2.5-flash-image</example>
    <note>Defaults to "gemini-2.5-flash-image". Shares GEMINI_API_KEY with the analysis provider.</note>
  </variable>
  <variable>
    <name>OLLAMA_BASE_URL / OLLAMA_VISION_MODEL / OLLAMA_TEXT_MODEL / OLLAMA_IMAGE_MODEL</name>
    <description>Ollama connection + per-capability model tags (server-only). Defaults: http://localhost:11434 / qwen3-vl:8b / qwen3.5:9b / x/z-image-turbo.</description>
    <required>false</required>
    <note>Dev image generation requires `ollama pull x/z-image-turbo` (Ollama ≥0.32, experimental image generation, macOS first). x/flux2-klein is an alternative.</note>
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
│   │   └── page.tsx                    # SSG shell (wide max-w-screen-xl): back+share row → ToolIntro → <HairstyleTool/> → how-to → FAQ + JSON-LD
│   └── api/hairstyle/
│       ├── analyze/route.ts            # POST: image → FaceAnalysis (ephemeral)
│       ├── recommend/route.ts          # POST: RecommendInput → Recommendation[]
│       └── preview/route.ts            # POST: { hairstyleId, locale } → generated style-preview image (ephemeral; 503 when disabled)
├── components/tools/hairstyle-recommendation/
│   ├── HairstyleTool.tsx               # "use client" root; useReducer(flowReducer); 2-col workspace (MAIN + sticky RAIL)
│   ├── EntryChooser.tsx                # photo path vs no-photo path
│   ├── PhotoDropzone.tsx               # picker + drag-drop + camera; client resize; privacy notice; emits objectUrl
│   ├── MyPhotoPanel.tsx                # persistent "My photo" rail card: preview + replace/remove + ephemeral note
│   ├── FaceShapePicker.tsx             # labeled face-shape illustrations (no-photo path)
│   ├── AttributeSelectors.tsx          # preference / length / type / occasion pills
│   ├── AnalysisCard.tsx                # face shape + confidence meter + features
│   ├── RecommendationGrid.tsx          # 3–6 RecommendationCard
│   ├── RecommendationCard.tsx          # name + reason + tips + PreviewImage
│   ├── PreviewImage.tsx                # 4:5 box: curated image → shimmer (aria-busy) → generated preview fade-in / quiet fallback
│   └── ResultActions.tsx               # regenerate / copy-summary / share / reset
├── lib/ai/                             # PLATFORM capability layer (platform SPEC): StructuredModel/ImageGenerator ports, GeminiClient, OllamaClient, guardrails, env, factory
├── lib/hairstyle-recommendation/
│   ├── flow.ts                         # pure reducer: stage machine + photo persistence + preview queue + gender/face-preview state (no react/SDK imports)
│   ├── flow.test.ts
│   ├── schema.ts                       # zod: AnalyzeRequest, RecommendRequest, PreviewRequest (+image/gender), FaceAnalysis (+gender), Recommendation, ApiEnvelope
│   ├── constants.ts                    # enums (+GENDERS), MAX_IMAGE_BYTES, MAX_EDGE_PX, JPEG_QUALITY, rate limits
│   ├── locale-templates.ts             # ko/en backfill reason/tips templates (rev 2 — no hardcoded-English fallbacks)
│   ├── catalog.ts                      # curated HairstyleLibraryEntry[] (+genders tags) + match(faceShape, attrs incl. gender) → candidate IDs
│   ├── catalog.test.ts
│   ├── resize.ts                       # client canvas downscale helper
│   ├── resize.test.ts
│   ├── prompt.ts                        # buildAnalyzePrompt / buildRecommendPrompt (structured-JSON contract)
│   ├── rate-limit.ts                   # per-IP token bucket (KV or in-memory)
│   ├── ai/
│   │   ├── types.ts                    # HairstyleAI interface + provider-facing types
│   │   ├── gemini.ts                   # GeminiProvider — thin adapter over platform GeminiClient
│   │   ├── ollama.ts                   # OllamaHairstyleProvider — thin adapter over platform OllamaClient
│   │   ├── index.ts                    # getProvider() factory (AI_PROVIDER: gemini | ollama)
│   │   └── gemini.test.ts              # provider mapping/guardrail tests (mocked SDK)
│   └── index.ts                        # barrel
├── i18n/messages/{ko,en}.json          # tools.hairstyle-recommendation.* namespace
└── tools/registry.ts                   # +1 ToolMeta entry (id hairstyle-recommendation)
public/hairstyles/                      # curated reference images (webp/avif, credited)
└── <hairstyleId>/<preference>.webp
scripts/
├── export-prompts.ts                   # dumps production prompt builders → evals/hairstyle/prompts.generated.json (single source)
└── generate-hairstyle-refs.ts          # batch-generates missing catalog reference images via the ImageGenerator port (manual review before commit)
evals/                                  # Python prompt-eval harness (uv + LangChain + Ollama) — see evals/README.md
└── hairstyle/{run.py, schemas.py, fixtures.json, prompts.generated.json}
wrangler.jsonc / open-next.config.ts    # OpenNext + Workers config, KV + env bindings
</file_structure>

<core_data_entities>
  <FaceAnalysis>
    - faceShape: enum (oval, round, square, heart, oblong, diamond, triangle) — required
    - confidence: number (0.0–1.0, model-reported certainty)
    - gender: enum (male, female, unknown) — perceived gender presentation; 'unknown' when the model is unsure (rev 2). Missing/invalid provider output clamps to 'unknown'.
    - features: string[] (0–5 short salient notes, e.g. "strong jawline", "high forehead"), localized to request locale
    - notes: string (optional, ≤ 240 chars, neutral non-medical description)
  </FaceAnalysis>
  <RecommendInput>
    - faceShape: enum (oval, round, square, heart, oblong, diamond, triangle) — required
    - gender: enum (male, female) — optional (rev 2); auto-filled from analysis (unless 'unknown'), user-overridable; omitted = no gender filter
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
    - genders: enum[] (subset of male, female; both = unisex) — rev 2, drives the gender hard filter + preview model gender
    - preference: enum (feminine, masculine, neutral)
    - length: enum (short, medium, long)
    - hairType: enum[] (subset of straight, wavy, curly, coily)
    - image: object { src: string, alt: string, credit: string, license: string }
    - tags: string[]
  </HairstyleLibraryEntry>
  <ApiEnvelope>
    - ok: boolean
    - data: FaceAnalysis | { recommendations: Recommendation[] } | { image: string, mimeType: string } | null
    - error: object { code: enum (see error codes), message: string } | null
  </ApiEnvelope>
  <PreviewRequest>
    - hairstyleId: string — must exist in the catalog (server-verified; unknown id → 400 VALIDATION_ERROR)
    - locale: enum (ko, en)
    - image: string (data URL or base64) — optional (rev 2); the user photo for the face-preserving edit path; same decoded-size limit as analyze (≤ MAX_IMAGE_BYTES → 413)
    - mimeType: enum ALLOWED_IMAGE_TYPES — required when image is present
    - gender: enum (male, female) — optional (rev 2); steers the generic-model prompt when no image/edit is possible
  </PreviewRequest>
  <PreviewResponse>
    - image: string (data URL, e.g. data:image/png;base64,...) — generated style preview, ephemeral (never stored server-side)
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
    - PREVIEW_IMAGE_SIZE = 768 (square generation; displayed in 4:5 object-cover boxes); PREVIEW_CONCURRENCY = 2 (client-side parallel preview requests)
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
      3. getProvider().analyzeFace(image) with buildAnalyzePrompt(locale) forcing structured JSON (includes perceived-gender instruction; 'unknown' allowed).
      4. Validate provider output against FaceAnalysis zod schema (missing/invalid gender clamps to 'unknown'); if no face → 422 NO_FACE_DETECTED.
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
      3. catalog.match(faceShape, attrs) → candidate hairstyleIds (superset). Gender hard filter first (entry.genders ∋ input.gender when set); preference relaxes to a soft filter if the gender-filtered pool < MIN_RECS.
      4. getProvider().recommend(input, candidates) with buildRecommendPrompt — AI selects/orders MIN..MAX and writes reason + tips per pick, choosing ONLY from candidate IDs.
      5. Validate each Recommendation (hairstyleId ∈ catalog; lengths; localized); drop invalid; ensure ≥ MIN_RECS (backfill from catalog if the model under-returns — backfill reason/tips use LOCALE TEMPLATES (ko/en), never hardcoded English).
      6. Attach referenceImage + name + tags from catalog. Return envelope.
    </flow>
    <errors>400 VALIDATION_ERROR, 429 RATE_LIMITED, 502 AI_UNAVAILABLE, 500 INTERNAL</errors>
  </endpoint>
  <endpoint name="preview">
    <method>POST</method>
    <path>/api/hairstyle/preview</path>
    <runtime>Cloudflare Worker (OpenNext) — Node-compatible route handler</runtime>
    <request>
      Content-Type: application/json
      Body (zod PreviewRequest): { hairstyleId: string, locale: enum (ko, en), image?: string (user photo, base64/data URL, ≤ MAX_IMAGE_BYTES decoded), mimeType?: enum ALLOWED_IMAGE_TYPES (required with image), gender?: enum (male, female) }
    </request>
    <response>200 ApiEnvelope { ok: true, data: { image: string (data URL), mimeType: string }, error: null }</response>
    <flow>
      1. Rate-limit check (IP, PREVIEW_RATE_LIMIT_PER_MIN=30) → 429 RATE_LIMITED.
      2. zod validate; verify hairstyleId exists in the catalog → 400 VALIDATION_ERROR otherwise. If image present: decode + size/type guard → 413 IMAGE_TOO_LARGE / 415 INVALID_IMAGE.
      3. getImageGenerator() — null (IMAGE_PROVIDER unset/none) → 503 IMAGE_GEN_DISABLED. Client treats this as a quiet, permanent fallback: drains its preview queue, keeps curated imagery, shows NO error surface.
      4. Branch (rev 2, decided by the ROUTE): (a) image present AND generator.supportsImageEdit → buildFaceEditPrompt(catalogEntry) — hair-only edit instruction (preserve identity, skin tone, expression, clothing, background; no text/watermark) + the photo as referenceImage; (b) otherwise → buildStylePreviewPrompt(catalogEntry, gender) — English factual description from catalog data ONLY, generic model matching gender. User free-text NEVER reaches the image model in either branch (prompt-injection safe).
      5. generateImage({ prompt, width: 768, height: 960, referenceImage? }) with a 180s timeout ceiling (local Ollama can take 1–3 min at 768px incl. model load; hosted providers return far sooner) → 502 AI_UNAVAILABLE on failure/timeout.
      6. Return envelope with data-URL image. Neither the user photo nor generated bytes are ever written to disk/KV/logs (ephemeral).
    </flow>
    <errors>400 VALIDATION_ERROR, 413 IMAGE_TOO_LARGE, 415 INVALID_IMAGE, 429 RATE_LIMITED, 502 AI_UNAVAILABLE, 503 IMAGE_GEN_DISABLED, 500 INTERNAL</errors>
    <client_behavior>Auto-generation: when recommendations render, the client enqueues ALL cards and requests previews with concurrency PREVIEW_CONCURRENCY (2). The request includes the user photo only while "Preview on my face" is ON and a photo exists (face-preserving mode); it always includes the effective gender when known. Cards show the curated image instantly; a shimmer overlay (aria-busy) indicates generation; the generated image fades in with an "AI generated" chip (face-preserving results may use a "My face" variant label). Failure → curated image stays with an "example image" chip. Disabled (503) → whole queue drains silently. Toggling the face-preview switch invalidates generated previews and requeues. Reduced-motion: no shimmer/fade, instant swap.</client_behavior>
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
    **Wide shell (2026-07-18, aligned with apps.jurepi.kr tool pages):** container max-w-screen-xl (1280px), centered, horizontal padding 16px (mobile) / 24px (≥768px). Page composition order: (1) back link + horizontal ShareButtons row, (2) ToolIntro — ToolCharacter avatar (w-16 sm:w-[72px], rounded-2xl, shadow-card) + rose category eyebrow ("뷰티 도구" / "Beauty tools"; text-xs bold uppercase tracking-widest) + display H1 (font-display) + description (max-w-2xl), (3) the interactive workspace IMMEDIATELY after, (4) how-to steps + sm:grid-cols-3 tip cards (border-t separated), (5) FAQ (details/summary), (6) footer note. How-to/FAQ stay SSR-prerendered (SEO/GEO).
    **Workspace (rev 2 — RAIL LEFT):** grid grid-cols-1 lg:grid-cols-3 gap-6. RAIL (lg:col-span-1, lg:sticky lg:top-20 self-start, FIRST in DOM → leftmost on desktop): MyPhotoPanel (always visible once a photo exists; replace/remove; ephemeral note; **"Preview on my face" toggle — default ON with a photo, switch-style, with a one-line ephemeral notice**) + AnalysisCard (**+ detected-gender badge**) + AttributeSelectors + primary CTA. MAIN (lg:col-span-2, right): stage flow — entry tiles → PhotoDropzone / FaceShapePicker → RecommendationGrid + ResultActions. Rationale: input→output reads left→right; the user's photo (before) sits beside the face-preserving previews (after). DOM order = visual order (tab order sane). Mobile: single column, order unchanged from rev 1; once a photo is selected, a compact sticky photo chip (thumbnail + face-shape badge) pins to the top of the workspace. Errors render as inline banners with retry (not full-stage replacement).
    Page ground surface-soft (#fbfbf9); card surfaces canvas white (#ffffff), radius 16px (md) / 32px (lg). Primary actions brand red (#e60023); rose category accent for eyebrow/identity touches per DESIGN.md.
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
    Five labeled rows (rev 2: Gender, Preference, Length, Hair type, Occasion). Each row: label (13px, text-secondary, 600) + a wrap of pill toggles (single-select per row). Pill: height 36px, padding 0 14px, radius full (9999px), hairline border #dadad3; default = surface-card (#f6f6f3); selected = ink background (#262622) + white text (#ffffff). Gender row (rev 2): Male / Female / Any pills — auto-selected from the analysis result (photo path, unless 'unknown'), freely overridable in both paths; an "auto-detected" hint appears when the value came from the analysis. Length/Type/Occasion optional (an "Any" pill is selectable). Preference defaults to Neutral. Changing an attribute after results are shown enables Regenerate.
  </attribute_selectors>

  <primary_cta>
    Full-width (mobile) / auto (desktop) button with background brand red (#e60023), text white (#ffffff), height 48px, radius 16px, label "Get recommendations". Disabled until faceShape is known (analyzed or picked). Hover/Pressed: #cc001f. Loading: spinner + "Finding styles…", button disabled. NOTE: all actions and emphasis use brand red (#e60023) — single accent across platform, per DESIGN.
  </primary_cta>

  <analysis_card>
    Shown only in the photo path after analyze. White card, 20px padding, radius 16px. Left: face-shape name (Pretendard 20px/700) + a small detected-gender badge (rev 2: "남성"/"여성" chip, surface-card fill; hidden when 'unknown'). Right: confidence meter — a 6px-tall track (hairline-soft #e5e5e0) with brand red fill (#e60023), width = confidence%, plus "NN% match" (12px, text-muted). Below: features as small chips (surface-card fill, 12px, text ash #91918c). If confidence < 0.5: a gentle note "Not fully sure — you can pick your face shape manually" + a "Pick manually" text button. Entrance: fade + rise 8px, 200ms.
  </analysis_card>

  <recommendation_grid>
    Responsive grid: 1 col (<640px), 2 col (640–1023px), 3 col (≥1024px), gap 16px. Reserved min-height while loading to protect CLS. Loading: 3–6 skeleton cards (shimmer, reduced-motion → static). Empty (shouldn't happen post-backfill, but): empty_state with "No matches — try different attributes" + reset.
  </recommendation_grid>

  <recommendation_card>
    White card, radius 16px, overflow hidden, flat (no shadow by default). Top: PreviewImage — fixed aspect-ratio 4:5 box (explicit dimensions, zero CLS) showing the curated reference image instantly (object-fit cover, loading="lazy", credit caption bottom-right on-image scrim); while a style preview is generating, a shimmer overlay + aria-busy; on success the AI-generated preview fades in with a small "AI generated" chip; on failure/disabled the curated image stays with a quiet "example image" chip. Body (16px padding): hairstyle name (Pretendard 17px/700), reason (14px/1.55, text-charcoal #262622), then a "Styling tips" label (12px, text-mute #62625b, 600) + 2–3 bullet tips (13px). Footer: tag chips (11px). Hover: lift translateY(-2px) + subtle background/border shift, 150ms. Focus-visible: brand red border if it links out.
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
    - 502 AI_UNAVAILABLE → "Our style advisor is briefly unavailable. Please try again." + Retry button. (/preview only: quiet per-card fallback to the curated image — no toast.)
    - 503 IMAGE_GEN_DISABLED (/preview only) → silent: client drains the preview queue and keeps curated imagery. No error surface.
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
    <guardrails>Structured JSON output enforced; temperature modest (~0.6) for recommend, low for analyze; missing/invalid gender clamps to 'unknown'; server rejects any hairstyleId outside candidates; caps on string lengths; no PII retained.</guardrails>
    <cost>Free-tier friendly for analysis; analyze = 1 image call, recommend = 1 text call per action. Face-preserving previews via GeminiImageClient (gemini-2.5-flash-image) bill PER IMAGE — production enablement of IMAGE_PROVIDER=gemini is an explicit deploy-time decision with the 30/min/IP rate limit as the cost guard.</cost>
  </integration>
  <integration name="Ollama (dev / open-source provider via platform OllamaClient)">
    <purpose>Zero-cost local inference during development: vision analysis (qwen3-vl:8b), text recommendations (qwen3.5:9b), style-preview image generation (x/z-image-turbo or x/flux2-klein)</purpose>
    <sdk>None — plain fetch to {OLLAMA_BASE_URL} (default http://localhost:11434): POST /api/chat (format: JSON schema, images[] base64, stream:false) + POST /v1/images/generations (OpenAI-compatible; Ollama ≥0.32 experimental image generation)</sdk>
    <guardrails>Same shared guardrails as Gemini (zod validation + fence stripping + 1 retry); structured outputs enforced via chat `format`; failures map to AI_UNAVAILABLE.</guardrails>
    <selection>AI_PROVIDER=ollama and/or IMAGE_PROVIDER=ollama (independent selections). Production keeps AI_PROVIDER=gemini and IMAGE_PROVIDER unset until a production image provider is chosen (deferred).</selection>
  </integration>
  <swap_note>To add a provider: implement HairstyleAI in a new file under ai/, register it in ai/index.ts, set AI_PROVIDER. Image generation providers implement the platform ImageGenerator port and register in src/lib/ai/factory.ts (IMAGE_PROVIDER). No route/UI changes.</swap_note>
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
    - CRITICAL: The uploaded image is EPHEMERAL. It is decoded in memory, passed to the provider (analyze call; and, only while the "Preview on my face" toggle is ON, per-card preview edit calls), and discarded after each response. It is NEVER written to disk, KV, R2, D1, cache, or logs. The analyze response never echoes the photo; preview responses contain only the newly generated image.
    - CRITICAL: The face-preserving path is CONSENT-GATED client-side: the photo is attached to /preview requests ONLY while the toggle is ON. Toggle OFF (or no photo / non-edit provider) → the photo never reaches the image model.
    - CRITICAL: Do not log request bodies on the analyze or preview routes. Error logs must exclude image bytes.
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
  <test_scenario_6>
    <description>Style-preview auto-generation (progressive, fallback, disabled) + persistent photo</description>
    <steps>
      1. With IMAGE_PROVIDER=ollama (or a mocked /api/hairstyle/preview), complete either path to results.
      2. Verify every card renders the curated image instantly (zero CLS) and preview requests fire with concurrency 2.
      3. Verify shimmer + aria-busy during generation; the generated image fades in with the "AI generated" chip.
      4. Force one preview request to fail → that card quietly keeps the curated image with the "example image" chip; no toast.
      5. With IMAGE_PROVIDER unset → the first preview returns 503 IMAGE_GEN_DISABLED; the client drains the queue; zero further preview requests; no error surface.
      6. Verify the uploaded photo remains visible in MyPhotoPanel from upload through results; Reset clears it (object URL revoked).
      7. Verify no preview or upload image bytes are persisted or logged server-side.
    </steps>
  </test_scenario_6>
  <test_scenario_7>
    <description>Gender-aware recommendations + face-preserving previews (rev 2)</description>
    <steps>
      1. Photo path with a clear MALE front-facing photo (ko locale).
      2. /analyze returns gender='male'; AnalysisCard shows the 남성 badge; the Gender pill row auto-selects 남성 with an "자동 감지" hint.
      3. Get recommendations → every returned hairstyleId belongs to a catalog entry whose genders include 'male'; preview images depict MALE styling.
      4. With IMAGE_PROVIDER=gemini and the MyPhotoPanel "내 얼굴로 미리보기" toggle ON (default), each /preview request carries the user photo; the generated previews preserve the user's face (hair changed only) and carry the AI-generated chip.
      5. Toggle OFF → previews invalidate and requeue; subsequent /preview requests contain NO image field; results are generic male-model renders.
      6. Override the Gender pill to 여성 → Regenerate → recommendations switch to female-tagged styles.
      7. Force a backfill (mock the provider to under-return) → backfilled card reason/tips are in KOREAN (locale templates), never English.
      8. Desktop ≥1024px: the rail (photo/analysis/attributes) renders LEFT of the results; DOM order matches visual order; mobile 375px keeps the sticky photo chip on top.
      9. Verify the photo was sent ONLY to /analyze and (while toggle ON) /preview — never persisted or logged.
    </steps>
  </test_scenario_7>
</final_integration_test>

<success_criteria>
  <functionality>
    - Both entry paths work; recommend succeeds with and without a prior analyze.
    - Gender correctness (rev 2): a male photo auto-yields male-tagged styles (and vice versa); the override pill changes results on regenerate; 'unknown' detection degrades gracefully (no filter, manual pick offered).
    - Locale correctness (rev 2): ALL response text (model reason/tips AND backfill templates AND copy-summary) follows the request locale — zero hardcoded-English leakage in ko.
    - Every returned hairstyleId exists in the catalog; ≥ 3 recommendations guaranteed (backfill).
    - No-face / low-confidence / rate-limit / provider-outage all handled without dead ends.
    - Style previews auto-generate per card when IMAGE_PROVIDER is set; failure/disabled degrade quietly to curated imagery and never block recommendations.
    - The uploaded photo stays visible in MyPhotoPanel through the entire flow (upload → results); Reset revokes the object URL.
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
    - Matches ai.jurepi.kr DESIGN tokens; brand red primary + rose category accent (eyebrow/identity); wide 1280px tool shell with ToolIntro header + share row. Light theme polished (dark = Phase 2).
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
  <phase_2_seam>Face-preserving previews SHIPPED (rev 2) via `ImageGenerator.referenceImage` + `supportsImageEdit` (GeminiImageClient, gemini-2.5-flash-image). The route owns the branch decision; the consent gate is the client-side MyPhotoPanel toggle. Remaining seam: an edit-capable local/dev backend (Ollama img2img pending an upstream source-image regression fix) so the edit path can run offline.</phase_2_seam>
</key_implementation_notes>

</project_specification>
```
