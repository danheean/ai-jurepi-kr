---
version: alpha
name: ai.jurepi.kr Design System
description: |
  A free AI tools hub (Korean-first, mobile-first) organized around a single brand accent, a warm-cream neutral chrome, and a grid of tool cards that prioritize clarity. The home page discovery dashboard uses large display headlines, geometric sans-serif typography, and fully-rounded pill buttons on a cream-tinted palette. Tool imagery and result samples are supportive — the tool card grid is the load-bearing visual element. The chrome is quiet: warm grays, true whites, and a single saturated brand accent — no decorative gradients, no atmospheric backgrounds, no shadows beyond a soft modal scrim. Each tool has its own detailed page showing analysis results, recommendations, and action buttons. Privacy-first: user images are analyzed once, never stored.

colors:
  primary: "#e60023"
  on-primary: "#ffffff"
  primary-pressed: "#cc001f"
  ink: "#000000"
  ink-soft: "#211922"
  body: "#33332e"
  charcoal: "#262622"
  mute: "#62625b"
  ash: "#91918c"
  stone: "#c8c8c1"
  hairline: "#dadad3"
  hairline-soft: "#e5e5e0"
  on-secondary: "#000000"
  secondary-bg: "#e5e5e0"
  secondary-pressed: "#c8c8c1"
  canvas: "#ffffff"
  surface-soft: "#fbfbf9"
  surface-card: "#f6f6f3"
  surface-elevated: "#ffffff"
  on-dark: "#ffffff"
  on-dark-mute: "rgba(255,255,255,0.7)"
  surface-dark: "#262622"
  focus-outer: "#435ee5"
  focus-inner: "#ffffff"
  accent-pressed-blue: "#617bff"
  accent-purple: "#7e238b"
  accent-purple-deep: "#6845ab"
  success-deep: "#103c25"
  success-pale: "#c7f0da"
  error: "#9e0a0a"
  error-deep: "#cc001f"

typography:
  display-xl:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 70px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -1.2px
  display-lg:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.8px
  heading-xl:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -1.2px
  heading-lg:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  heading-md:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  body-md:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-strong:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-sm:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-sm-strong:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0
  caption-md:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  caption-sm:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  link-md:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  button-md:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0
  button-sm:
    fontFamily: Pretendard, -apple-system, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0

rounded:
  none: 0px
  sm: 8px
  md: 16px
  lg: 32px
  full: 9999px

spacing:
  xxs: 4px
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 6px 14px
    height: 40px
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.secondary-bg}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 6px 14px
    height: 40px
  button-secondary-pressed:
    backgroundColor: "{colors.secondary-pressed}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
  button-icon-circular:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 40px
  button-overlay-badge:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 8px 14px
  button-disabled:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ash}"
    rounded: "{rounded.md}"
  search-bar:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: 11px 15px
    height: 48px
  search-bar-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 11px 15px
    height: 44px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  tool-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 0px
  feature-card-large:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 0px
  overlay-badge:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.full}"
    padding: 6px 12px
  filter-chip:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  filter-chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
  category-tile:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    padding: 16px
  feature-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-xl}"
    rounded: "{rounded.md}"
    padding: 32px
  feature-card-soft:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-xl}"
    rounded: "{rounded.md}"
    padding: 32px
  modal-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  hero-cta-strip:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.heading-xl}"
    rounded: "{rounded.none}"
    padding: 48px 32px
  primary-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.none}"
    height: 64px
  footer-section:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: 32px 24px
  link-inline:
    textColor: "{colors.ink-soft}"
    typography: "{typography.link-md}"
---

## Overview

ai.jurepi.kr is a free online AI tools hub (Korean-first, mobile-first) built around a single brand accent, a warm-cream neutral chrome, and a discovery-focused tool card grid. The system prioritizes clarity: large display headlines, geometric sans-serif typography, and fully-rounded pill buttons on a cream-tinted palette. Tool cards and result imagery are visual supports, not the dominant subject. The homepage features major tools in a grid layout, with a detailed page for each tool showing AI analysis, recommendations, privacy notes, and action buttons.

The design system has two distinct modes: the **home/marketing chrome** (cream surfaces, large 70px display headlines, feature cards promoting key tools, primary CTAs) and the **tool detail & results display** (a responsive grid of result cards, analysis visualization, recommendation chips, privacy notice). The chrome is otherwise quiet: warm grays, true whites, and a single saturated brand accent (`{colors.primary}`) — no decorative gradients, no atmospheric backgrounds, no shadows beyond a soft modal scrim.

The system's signature gesture is **shape consistency**: 16px radius (`{rounded.md}`) for nearly every interactive surface — buttons, inputs, tool cards, feature cards — and 32px radius (`{rounded.lg}`) reserved for large feature cards and modal cards. There are exactly three radius values in active use: 16px, 32px, and pill (9999px). The system never goes flat (sharp corners) and never introduces intermediate radius values.

**Key Characteristics:**
- Single-accent primary action: Brand accent (`{colors.primary}`) carries every primary CTA; everything else is monochrome
- Geometric sans-serif typography (Pretendard, Korean-first) across every text role from `{typography.display-xl}` (70px) down to `{typography.caption-sm}` (12px)
- Two-radius shape system: `{rounded.md}` (16px) for most components, `{rounded.lg}` (32px) for large cards and modals, `{rounded.full}` for circular elements
- Tool card grid as the primary discovery surface — column-based responsive layout
- Warm-cream neutral chrome (`{colors.surface-card}` — #f6f6f3) that recedes behind tool details and result imagery
- Always-visible primary CTA anchored in nav; privacy notice always present near upload surfaces
- Modal overlay for uploads and authentication using a soft scrim over page content

## Colors

### Brand & Accent
- **Primary** (`{colors.primary}` — `#e60023`): the system's only highly-saturated color. All primary CTAs, active states, and brand emphasis. ⚠️ **Note:** This is a precise red; see "Open Decisions" section for confirmation on whether to adjust for ai.jurepi.kr branding.
- **Primary Pressed** (`{colors.primary-pressed}` — `#cc001f`): pressed state for primary buttons — one notch deeper than brand primary.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): true white. The base surface for primary nav, modals, feature cards, and content body.
- **Soft Surface** (`{colors.surface-soft}` — `#fbfbf9`): faintly cream-tinted off-white used for page background on hero sections.
- **Surface Card** (`{colors.surface-card}` — `#f6f6f3`): warm-cream card and tool-tile background. Carries category tiles, search-bar default fill, button-secondary default, and tool-card backgrounds.
- **Secondary BG** (`{colors.secondary-bg}` — `#e5e5e0`): gray-cream used for secondary button fill — a notch deeper than `{colors.surface-card}`.
- **Secondary Pressed** (`{colors.secondary-pressed}` — `#c8c8c1`): pressed state for secondary buttons.
- **Surface Dark** (`{colors.surface-dark}` — `#262622`): warm near-black used in dark CTA strips.
- **Hairline** (`{colors.hairline}` — `#dadad3`): 1px row dividers, footer column rules.
- **Hairline Soft** (`{colors.hairline-soft}` — `#e5e5e0`): lighter inline divider; doubles as secondary-button background.

### Text
- **Ink** (`{colors.ink}` — `#000000`): primary headlines, button text, primary nav links.
- **Ink Soft** (`{colors.ink-soft}` — `#211922`): inline-link color in body prose. A near-black with a faint warm cast — used to differentiate links from body without color contrast.
- **Body** (`{colors.body}` — `#33332e`): default paragraph text on `{colors.canvas}`.
- **Charcoal** (`{colors.charcoal}` — `#262622`): subtly softer body where pure ink is too heavy.
- **Mute** (`{colors.mute}` — `#62625b`): metadata text, footer links, secondary captions.
- **Ash** (`{colors.ash}` — `#91918c`): disabled button text, placeholder text in inputs.
- **Stone** (`{colors.stone}` — `#c8c8c1`): least-emphasis utility text, disabled-state borders.
- **On Dark** (`{colors.on-dark}` — `#ffffff`): primary text on `{colors.surface-dark}`.

### Semantic
- **Error** (`{colors.error}` — `#9e0a0a`): validation messages, destructive confirmation copy.
- **Error Deep** (`{colors.error-deep}` — `#cc001f`): deepened error background where regular error tone needs more contrast.
- **Success Deep** (`{colors.success-deep}` — `#103c25`): in-product success messaging.
- **Success Pale** (`{colors.success-pale}` — `#c7f0da`): pale success-badge background.
- **Focus Outer** (`{colors.focus-outer}` — `#435ee5`): focus-ring blue — 2px outer outline around focused inputs and buttons.
- **Focus Inner** (`{colors.focus-inner}` — `#ffffff`): white inner gap inside the focus-ring stack.

### Semantic Accents (used in result badges and recommendations)
- **Accent Pressed Blue** (`{colors.accent-pressed-blue}` — `#617bff`): pressed state for blue informational badges.
- **Accent Purple** (`{colors.accent-purple}` — `#7e238b`): recommendation badge, special callout.
- **Accent Purple Deep** (`{colors.accent-purple-deep}` — `#6845ab`): paired dark for purple lockups.

## Typography

### Font Family
**Pretendard** (weights 400, 500, 600, 700) is the primary typeface across every text role on every page. It is a geometric sans-serif optimized for Korean text, with excellent Latin character support for bilingual interfaces. The face's distinctive trait is its tight letter-spacing at display sizes (-1.2px on `{typography.display-xl}` and `{typography.heading-xl}`), which gives 70px headlines a confident, friendly density.

**Fallback stack:** Pretendard → `-apple-system` → `system-ui` → `Segoe UI` → `Roboto` → `Helvetica Neue` → `Arial` → `sans-serif`.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 70px | 600 | 1.1 | -1.2px | Homepage hero headline |
| `{typography.display-lg}` | 44px | 700 | 1.15 | -0.8px | Major section hero |
| `{typography.heading-xl}` | 28px | 700 | 1.2 | -1.2px | Section heading, tool title on detail page |
| `{typography.heading-lg}` | 22px | 600 | 1.25 | 0 | Sub-section heading, modal title |
| `{typography.heading-md}` | 18px | 600 | 1.3 | 0 | Card title, in-grid label |
| `{typography.body-md}` | 16px | 400 | 1.4 | 0 | Body copy, modal body, default paragraph |
| `{typography.body-strong}` | 16px | 600 | 1.4 | 0 | Inline emphasis, nav link, form label |
| `{typography.body-sm}` | 14px | 400 | 1.4 | 0 | Helper text, metadata |
| `{typography.body-sm-strong}` | 14px | 700 | 1.4 | 0 | Label, small header |
| `{typography.caption-md}` | 12px | 500 | 1.5 | 0 | Caption, link metadata |
| `{typography.caption-sm}` | 12px | 400 | 1.4 | 0 | Smallest utility text, copyright |
| `{typography.link-md}` | 16px | 600 | 1.4 | 0 | Inline anchor link in body prose |
| `{typography.button-md}` | 14px | 700 | 1 | 0 | Standard button label |
| `{typography.button-sm}` | 12px | 700 | 1 | 0 | Compact badge, in-card button |

### Principles
The system has a steep size jump between display and body — `{typography.display-xl}` (70px) drops directly to `{typography.body-md}` (16px) on the hero with no intermediate tier. The negative tracking on the largest tiers (-1.2px / -0.8px) creates tighter, more confident headlines, and body copy sits at a generous 1.4 line-height to keep multi-line descriptions breathing. Display typography at large sizes uses tighter tracking to maintain visual density and confidence.

## Layout

### Spacing System
- **Base unit:** 8px (with finer 4/6/7px steps available for tight inline gaps in pill buttons and chips).
- **Tokens:** `{spacing.xxs}` (4px) · `{spacing.xs}` (6px) · `{spacing.sm}` (8px) · `{spacing.md}` (12px) · `{spacing.lg}` (16px) · `{spacing.xl}` (24px) · `{spacing.xxl}` (32px) · `{spacing.section}` (64px).
- **Universal section rhythm:** `{spacing.section}` (64px) as the vertical gap between major content blocks.
- **Tool grids:** `{spacing.sm}` (8px) gutters between tiles — designed so cards effectively touch across columns.
- **Modal padding:** `{component.modal-card}` uses 32px internal padding (`{spacing.xxl}`) on all sides.

### Grid & Container
- **Max width:** ~1280px content area at desktop with 24px gutters (~48px at ultrawide).
- **Tool card grid:** auto-fitting column-based layout — 5–6 columns at ultrawide, 4 columns at desktop, 3 at tablet, 2 at mobile-landscape, 1 at mobile. Gutters are `{spacing.sm}` (8px) horizontal and vertical.
- **Home feature row:** asymmetric 2-column split where text and imagery alternate left/right down the page.
- **Footer:** 4-column link grid at desktop, collapsing to 2-up at tablet, 1-up at mobile.

### Whitespace Philosophy
Whitespace is generous on marketing surfaces (home, feature rows) and tight on discovery and tool-detail surfaces (grids, result cards). The home page sits sections 64px apart with feature cards using 32px internal padding, while result grids collapse to 8px-gutter layouts that tile content edge-to-edge. The system reads as two interfaces sharing the same chrome: a magazine (hero / feature / CTA / footer) and a dashboard (top nav / filter row / card grid / load more).

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | No border, no shadow | Default for tool cards, feature cards, footer — the dominant treatment |
| 1 — Hairline border | 1px solid `{colors.hairline}` | Inputs, footer column dividers, in-list rows |
| 2 — Modal scrim + soft shadow | Modal sits on a dark scrim over page content with 16px ambient shadow | Authentication modal, upload modal, result preview modal |

The system has effectively no shadow elevation in content surfaces. Tool cards sit flat on the canvas; the only "elevation" appears on the modal layer where a 16px ambient shadow paired with 50%-opacity scrim lifts the modal above page content.

### Decorative Depth
Depth comes from content (tool result imagery, thumbnails) and composition, not CSS effects:
- **Tool result imagery:** samples and reference images carry visual depth through photography or illustration — the design lets each image speak rather than adding chrome.
- **Modal scrim:** 50%-opacity dark overlay over entire page when modal opens, with 16px ambient shadow underneath the modal card.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Footer, primary nav, page sections — structural surfaces |
| `{rounded.sm}` | 8px | Rare medium-radius surface (e.g., tooltip) |
| `{rounded.md}` | 16px | Buttons, inputs, tool cards, feature cards, category tiles — the dominant component radius |
| `{rounded.lg}` | 32px | Large feature cards, modal cards — used sparingly for "big" content surfaces |
| `{rounded.full}` | 9999px | Search bar, filter chips, overlay badges, icon-circular buttons, avatars |

The radius vocabulary is three values: 16px for most things, 32px for large cards and modals, and pill for circular elements. The system never uses sharp-cornered interactive elements and never introduces intermediate radius values.

### Media Geometry
- **Tool result imagery:** mixed aspect ratios (square, portrait, landscape) preserved at natural ratio inside `{rounded.md}` (16px) corners on small tiles and `{rounded.lg}` (32px) on large feature cards.
- **Category tile thumbnails:** square (1:1) with `{rounded.md}` corners.
- **Avatar circles:** 32–48px at `{rounded.full}`.
- **Feature card imagery:** typically 4:5 portrait, occupying ~60% of the card with headline + CTA stacked beneath.

## Components

> **No hover states documented** per system policy. Each spec covers Default and Active/Pressed only.

### Buttons

**`button-primary`** — the universal CTA
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-md}`, padding `6px 14px`, height ~40px, rounded `{rounded.md}` (16px).
- Used for primary actions across every surface: "Try now", "Analyze", "Get results", "Start free".
- Pressed state in `button-primary-pressed` — background drops to `{colors.primary-pressed}`.

**`button-secondary`** — gray-cream alternative
- Background `{colors.secondary-bg}` (`#e5e5e0`), text `{colors.on-secondary}`, type `{typography.button-md}`, padding `6px 14px`, height ~40px, rounded `{rounded.md}`.
- "Cancel", "Skip", "Back", "Learn more" — second-tier actions.
- Pressed state in `button-secondary-pressed`.

**`button-tertiary`** — ghost link
- Background transparent, text `{colors.ink}`, type `{typography.button-md}`, rounded `{rounded.md}`.
- Low-emphasis actions inside dialogs.

**`button-icon-circular`** — circular icon button
- Background `{colors.surface-card}`, icon `{colors.ink}`, rounded `{rounded.full}`, size 40px.
- Close buttons, carousel controls, floating actions.

**`button-overlay-badge`** — small overlay badge on imagery
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.button-md}`, rounded `{rounded.full}`, padding `8px 14px`.
- Result labels, confidence indicators, overlay tags.

**`button-disabled`**
- Background `{colors.surface-card}`, text `{colors.ash}` — flat soft-cream.

### Filter & Tab Chips

**`filter-chip`** + **`filter-chip-active`**
- Default: background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.button-md}`, rounded `{rounded.full}`, padding `8px 16px`.
- Active: background `{colors.ink}`, text `{colors.on-dark}` — fully inverted on selection.
- Tool filters, result attribute chips.

### Inputs & Forms

**`text-input`** + **`text-input-focused`**
- Default: background `{colors.canvas}`, text `{colors.ink}`, 1px solid `{colors.ash}`, type `{typography.body-md}`, padding `11px 15px`, height ~44px, rounded `{rounded.md}`.
- Focused: 2px `{colors.ink}` inner border + 4px `{colors.focus-outer}` outer outline.
- Upload modals, authentication, tool parameter inputs.

**`search-bar`** + **`search-bar-focused`**
- Default: background `{colors.surface-card}`, text `{colors.ink}`, type `{typography.body-md}`, padding `11px 15px`, height ~48px, rounded `{rounded.full}`.
- Focused: background flips to `{colors.canvas}` with 1px `{colors.ash}` border.
- Centered in primary nav; search icon at left, placeholder text.

### Cards & Containers

**`tool-card`** — the standard discovery tile
- Container: background `{colors.surface-card}`, rounded `{rounded.md}` (16px), padding 0.
- Layout: thumbnail image (or icon) at natural aspect ratio, tool name in `{typography.heading-md}`, brief description in `{typography.body-sm}`, "Try now" CTA optional on hover or always visible.

**`feature-card-large`** — the home-page feature card
- Identical to `tool-card` but rounded `{rounded.lg}` (32px) — used for large featured tools.

**`overlay-badge`** — anchored chip on imagery
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.button-sm}`, rounded `{rounded.full}`, padding `6px 12px`.
- Floats over an image corner with a result label or confidence badge.

**`category-tile`**
- Background `{colors.surface-card}`, rounded `{rounded.md}`, padding 16px.
- 3–4 up grid of small category thumbnails on home page. Each tile contains category icon/label in `{typography.body-strong}`.

**`feature-card`** + **`feature-card-soft`**
- Standard: background `{colors.canvas}`, rounded `{rounded.md}`, padding 32px. Pairs a tool image (left or right) with `{typography.heading-xl}` headline + body + `{component.button-primary}` CTA.
- Soft: background `{colors.surface-card}` for alternating rows.

**`modal-card`** — upload/auth/preview overlay
- Background `{colors.canvas}`, rounded `{rounded.lg}` (32px), padding 32px.
- Layout: title in `{typography.heading-lg}`, subtitle in `{typography.body-md}`, stacked form fields or preview, primary `{component.button-primary}` action, optional secondary action.
- Floats over 50%-opacity scrim with 16px ambient shadow.

**`hero-cta-strip`** — dark CTA strip
- Background `{colors.surface-dark}`, text `{colors.on-dark}`, type `{typography.heading-xl}`, padding `48px 32px`, rounded `{rounded.none}`.
- High-contrast call-to-action sections.

### Navigation

**`primary-nav`**
- Background `{colors.canvas}`, text `{colors.ink}`, height ~64px, type `{typography.body-strong}`, rounded `{rounded.none}`, with 1px `{colors.hairline}` bottom rule on inner pages.
- Layout (desktop home): ai.jurepi.kr logo at left + "Tools" link, centered `{component.search-bar}`, right cluster ("About / Privacy / English" + always-primary `{component.button-primary}` CTA).
- Layout (tool detail): ai.jurepi.kr logo at left, tool name/breadcrumb center, privacy notice / action buttons right.

**Top Nav (Mobile)**
- Hamburger menu icon at left, logo at center, search-glyph + primary CTA at right.

### Footer

**`footer-section`**
- Background `{colors.canvas}`, text `{colors.mute}` in `{typography.body-sm}`, padding `32px 24px`, rounded `{rounded.none}`, 1px `{colors.hairline}` top rule.
- Layout: link grid (Tools, About, Privacy, Blog, GitHub, etc.) with headers in `{typography.body-sm-strong}`.
- Bottom row: ai.jurepi.kr logo + "© 2026 ai.jurepi.kr" in `{typography.caption-sm}` `{colors.mute}`.

### Inline

**`link-inline`** — body-prose anchor link
- `{colors.ink-soft}` text with no underline by default. Used inline to differentiate links from body.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` for primary CTAs, active states, and brand emphasis only. It is never decorative.
- Use `{rounded.md}` (16px) on every interactive element and standard card; reserve `{rounded.lg}` (32px) for large cards and modals; reserve `{rounded.full}` for circular elements.
- Stage every tool result or thumbnail inside a `{component.tool-card}` with no internal padding — the image is full-bleed.
- Stack content sections at `{spacing.section}` (64px) rhythm; tighten result grids to `{spacing.sm}` (8px) gutters so cards effectively touch.
- Use `{component.overlay-badge}` to anchor a result label or confidence indicator in the corner of a card image — the system's signature decorative gesture.
- Build hierarchy from font weight (400 → 600 → 700) and size, not from color tinting. Body stays `{colors.body}` regardless of context.
- Apply -1.2px letter-spacing on `{typography.display-xl}` and `{typography.heading-xl}`. The tight tracking is part of the system voice.

### Don't
- Don't use sharp-cornered buttons or cards. No `{rounded.none}` interactive elements.
- Don't introduce drop shadows on cards. The only shadow is 16px ambient under `{component.modal-card}`.
- Don't pad `{component.tool-card}` internally. The image is full-bleed; metadata sits over or below the image, not inside padding.
- Don't replace `{colors.primary}` with another red (unless confirmed in Open Decisions).
- Don't use `{colors.ink-soft}` outside inline body links. It is not a chrome color.
- Don't introduce a third radius value between 16px and 32px. The system jumps directly from md to lg.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| ultrawide | 1920px+ | Tool grid expands to 5–6 columns; content max-width holds at ~1280px |
| desktop-large | 1440px | Default — 4-column tool grid, full primary nav |
| desktop | 1280px | Same layout with narrower outer gutters |
| desktop-small | 1024px | Tool grid collapses to 3 columns; sub-nav remains horizontal |
| tablet | 768px | Tool grid collapses to 2 columns; primary nav becomes hamburger drawer; search bar becomes icon-only |
| mobile | 480px | Single-column tool grid; hero `{typography.display-xl}` scales 70px → ~44px |
| mobile-narrow | 320px | Hero scales to ~36px; section padding tightens to 32px |

### Touch Targets
All interactive elements meet WCAG AA (≥ 44×44px). `{component.button-primary}` and `{component.button-secondary}` sit at ~40px height with 14px horizontal padding (effective ~40×80px tappable). `{component.search-bar}` sits at 48px. `{component.text-input}` sits at 44px. `{component.filter-chip}` is ~36–40px height with 16px padding. `{component.button-icon-circular}` is exactly 40×40 with extended hit-target padding to 48×48.

### Collapsing Strategy
- **Primary nav:** desktop horizontal cluster → tablet hamburger drawer at 768px. Primary CTA stays visible.
- **Search bar:** desktop centered (~480px) → tablet compressed (~320px) → mobile collapses to icon, expands on tap.
- **Tool grid:** 5/6-up → 4-up → 3-up → 2-up → 1-up at 1920, 1280, 768, 480px. Gutters drop from 8px to 6px on mobile.
- **Feature row:** desktop alternating left/right 2-column → tablet vertical stack → mobile single-column.
- **Modal:** desktop centered ~480px-wide card → mobile full-width sheet.
- **Section padding:** `{spacing.section}` (64px) desktop → 48px tablet → 32px mobile.
- **Hero headline:** `{typography.display-xl}` (70px) at desktop, scaling 56px / 44px / 36px down breakpoints.
- **Footer:** 4-up link columns → 2-up at tablet → full accordion at mobile.

### Image Behavior
- Tool result imagery preserves natural aspect ratio at every breakpoint; column count changes, not aspect.
- Category tile thumbnails maintain 1:1 across all sizes.
- Feature card imagery uses art-direction crops on mobile (4:5 portrait → square).
- Non-critical imagery is lazy-loaded as user scrolls.

## Iteration Guide

1. Focus on ONE component at a time. Pull its YAML entry and verify every property resolves.
2. Reference component names and tokens directly (`{colors.primary}`, `{component.button-primary-pressed}`, `{rounded.md}`) — do not paraphrase.
3. Add new variants as separate component entries (`-pressed`, `-disabled`, `-focused`) — do not bury inside prose.
4. Default body to `{typography.body-md}`; reach for `{typography.body-strong}` for emphasis; reserve `{typography.display-xl}` strictly for hero headlines.
5. Keep `{colors.primary}` scarce — at most one primary CTA per fold.
6. When introducing a new component, ask whether it can be expressed with existing tokens before adding new ones. The system's strength is that it almost never needs new ones.

## Design Decisions

Confirmed on 2026-07-17. These are settled; revisit only with explicit stakeholder agreement.

### Confirmed
1. **Brand color — single brand red `{colors.primary}` = `#e60023`.** Kept as-is. Reserved for all primary CTAs, active states, and brand emphasis. Note: this is Pinterest's exact brand red; it may be revisited later if a more distinct ai.jurepi.kr hue is wanted, but no change for now.
2. **Font — Pretendard, single family** (weights 400/500/600/700) across both display and body tiers. Hierarchy comes from size, weight, and tracking (−1.2px on display tiers), not a separate display face. Self-hosted with a system-ui fallback stack. Korean-first, good Latin support.
3. **Single-accent model — no per-category accents.** One brand-red action color across the whole hub. The sibling `apps.jurepi.kr` uses six category accents (coral/mint/sky/sun/grape/rose); **ai.jurepi.kr does not** — categories exist for filtering/grouping but carry no color identity. (The first tool spec `docs/services/beauty/hairstyle-recommendation` still assumes a `blossom` category accent + honey-gold actions — it needs a design-alignment pass to this single-red model.)

### Still open (non-blocking)
- **Tool card grid — uniform vs. masonry.** Defaulting to a **uniform column-based grid** (4-up desktop → 3-up tablet → 2-up mobile → 1-up narrow), consistent with apps.jurepi.kr. Revisit if masonry better serves discovery.

---
