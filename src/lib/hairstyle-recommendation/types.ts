/**
 * Hairstyle Recommendation Domain Types
 *
 * Core entities per SPEC.md <core_data_entities>.
 * The HairstyleAI port interface is the domain boundary — all AI access goes through this.
 */

import type {
  FaceShape,
  Preference,
  Length,
  HairType,
  Occasion,
  Gender,
  AnalysisGender,
} from './constants';

/**
 * Face shape analysis returned by the AI vision model.
 * Represents the AI's understanding of a face shape from an image.
 *
 * Rev 2: includes perceived gender presentation (male/female/unknown).
 */
export interface FaceAnalysis {
  faceShape: FaceShape;
  confidence: number; // 0–1, model-reported certainty
  gender: AnalysisGender; // male | female | unknown; clamps invalid to 'unknown'
  features: string[]; // 0–5 salient notes (e.g. "strong jawline")
  notes?: string; // ≤240 chars, neutral description
}

/**
 * User input to the recommend endpoint.
 * Either derived from a prior analyze call or manually selected.
 *
 * Rev 2: includes optional gender (male/female) for gender-aware matching.
 */
export interface RecommendInput {
  faceShape: FaceShape;
  gender?: Gender; // optional; auto-filled from analysis (unless 'unknown'), user-overridable
  preference: Preference; // defaults to neutral
  length?: Length; // optional, no constraint if omitted
  hairType?: HairType; // optional
  occasion: Occasion; // defaults to daily
  locale: 'ko' | 'en'; // drives language of reason/tips
}

/**
 * A single recommendation returned to the user.
 * The server builds this by joining provider output with catalog data.
 */
export interface Recommendation {
  hairstyleId: string; // references a HairstyleLibraryEntry.id
  name: {
    ko: string;
    en: string;
  }; // from catalog
  reason: string; // AI: why it suits this shape + attributes (≤280 chars, localized)
  tips: string[]; // AI: 2–3 styling/maintenance tips (each ≤120 chars, localized)
  referenceImage: {
    src: string; // e.g. /hairstyles/soft-layered-bob/feminine.webp
    alt: string;
    credit: string;
  }; // from catalog
  tags: string[]; // from catalog (e.g. ["volume", "low-maintenance"])
}

/**
 * Curated static hairstyle library entry.
 * Source of truth for imagery and metadata.
 *
 * Rev 2: genders field tags which genders suit this hairstyle (male/female or both).
 */
export interface HairstyleLibraryEntry {
  id: string; // kebab-case, stable, unique
  name: {
    ko: string;
    en: string;
  };
  suitableFaceShapes: FaceShape[];
  genders: ReadonlyArray<Gender>; // male, female, or both (unisex)
  preference: Preference;
  length: Length;
  hairType: HairType[];
  image: {
    src: string; // path to webp/avif, e.g. /hairstyles/<id>/<preference>.webp
    alt: string;
    credit: string;
    license: string;
  };
  tags: string[]; // e.g. ["volume", "low-maintenance"]
}

/**
 * Provider output for a single recommendation.
 * Minimal shape — the server attaches catalog data (name, image, tags).
 * Returned directly by HairstyleAI.recommend().
 */
export interface ProviderRecommendation {
  hairstyleId: string;
  reason: string; // ≤280 chars
  tips: string[]; // 1–3 items, each ≤120 chars
}

/**
 * Curation: optional overall summary + "styles to avoid" (rev 3).
 * Authored by the same recommend() call as the recommendations — no second
 * AI request. Entirely optional: a missing/malformed block must never block
 * the core recommendations from returning (see coerceCuration in schema.ts).
 */
export interface Curation {
  summary: string; // AI: why these picks fit overall, ≤400 chars, localized
  avoid: {
    label: string; // AI: free-text style family to avoid (NOT a catalog id), ≤60 chars
    reason: string; // AI: why, ≤160 chars, localized
  }[]; // max 3 items
}

/**
 * Result of HairstyleAI.recommend(): the picks plus an optional curation block.
 */
export interface RecommendResult {
  recommendations: ProviderRecommendation[];
  curation?: Curation;
}

/**
 * ============================================================================
 * DOMAIN PORT: HairstyleAI
 * ============================================================================
 *
 * The domain abstraction for AI capability. Implementations (adapters) are
 * provider-specific (GeminiProvider, etc.). Route handlers ONLY call these
 * methods; no SDK logic in routes.
 *
 * The port defines a contract: the provider MUST return data matching the
 * expected shape and constraints. The route handler validates and transforms
 * the response using zod before returning to the client.
 */
export interface HairstyleAI {
  /**
   * Analyze a face image and return shape/features.
   *
   * @param image Object with data (base64/data-URL) and MIME type
   * @param locale Target language for features/notes
   * @returns FaceAnalysis with faceShape, confidence, features
   */
  analyzeFace(
    image: { data: string; mimeType: string },
    locale: 'ko' | 'en'
  ): Promise<FaceAnalysis>;

  /**
   * Recommend hairstyles matching input attributes.
   *
   * @param input User preferences (faceShape, attributes, locale)
   * @param candidates Filtered hairstyle library entries to choose from
   * @returns { recommendations, curation? } — picks (id, reason, tips only) plus
   *   an optional overall summary + "styles to avoid" (rev 3), authored in the
   *   same call. `curation` is best-effort: a missing/malformed block must
   *   never fail this call.
   *
   * Note: The provider MUST only return hairstyleIds from the candidate set.
   * The server validates this and attaches catalog data (name, image, tags)
   * before returning to the client.
   */
  recommend(
    input: RecommendInput,
    candidates: HairstyleLibraryEntry[]
  ): Promise<RecommendResult>;
}
