/**
 * Zod Schemas for Hairstyle Recommendation Domain
 *
 * All validation is derived from SPEC.md constants and type constraints.
 * Route handlers MUST validate all requests and provider responses with these schemas.
 *
 * Note: We derive TS types from zod schemas where practical to keep the single
 * source of truth in the schema definition.
 */

import { z } from 'zod';
import {
  FACE_SHAPES,
  PREFERENCES,
  LENGTHS,
  HAIR_TYPES,
  OCCASIONS,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from './constants';

/**
 * Enum schemas derived from constants
 */
export const FaceShapeSchema = z.enum(FACE_SHAPES);
export const PreferenceSchema = z.enum(PREFERENCES);
export const LengthSchema = z.enum(LENGTHS);
export const HairTypeSchema = z.enum(HAIR_TYPES);
export const OccasionSchema = z.enum(OCCASIONS);
export const AllowedImageTypeSchema = z.enum(ALLOWED_IMAGE_TYPES);

/**
 * FaceAnalysis: output from analyzeFace()
 */
export const FaceAnalysisSchema = z.object({
  faceShape: FaceShapeSchema,
  confidence: z.number().min(0).max(1),
  features: z.array(z.string()).max(5),
  notes: z.string().max(240).optional(),
});

export type FaceAnalysis = z.infer<typeof FaceAnalysisSchema>;

/**
 * RecommendInput: user attributes for recommendation
 */
export const RecommendInputSchema = z.object({
  faceShape: FaceShapeSchema,
  preference: PreferenceSchema.default('neutral'),
  length: LengthSchema.optional(),
  hairType: HairTypeSchema.optional(),
  occasion: OccasionSchema.default('daily'),
  locale: z.enum(['ko', 'en']),
});

export type RecommendInput = z.infer<typeof RecommendInputSchema>;

/**
 * Recommendation: full recommendation with catalog data attached
 */
export const RecommendationSchema = z.object({
  hairstyleId: z.string(),
  name: z.object({ ko: z.string(), en: z.string() }),
  reason: z.string().max(280),
  tips: z.array(z.string().max(120)).min(1).max(3),
  referenceImage: z.object({
    src: z.string(),
    alt: z.string(),
    credit: z.string(),
  }),
  tags: z.array(z.string()),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * HairstyleLibraryEntry: catalog entry structure
 */
export const HairstyleLibraryEntrySchema = z.object({
  id: z.string(),
  name: z.object({ ko: z.string(), en: z.string() }),
  suitableFaceShapes: z.array(FaceShapeSchema).min(1),
  preference: PreferenceSchema,
  length: LengthSchema,
  hairType: z.array(HairTypeSchema).min(1),
  image: z.object({
    src: z.string(),
    alt: z.string(),
    credit: z.string(),
    license: z.string(),
  }),
  tags: z.array(z.string()),
});

export type HairstyleLibraryEntry = z.infer<
  typeof HairstyleLibraryEntrySchema
>;

/**
 * ProviderRecommendation: minimal output from provider
 * (only id, reason, tips; catalog data attached by server)
 */
export const ProviderRecommendationSchema = z.object({
  hairstyleId: z.string(),
  reason: z.string().max(280),
  tips: z.array(z.string().max(120)).min(1).max(3),
});

export type ProviderRecommendation = z.infer<
  typeof ProviderRecommendationSchema
>;

/**
 * ============================================================================
 * API REQUEST SCHEMAS
 * ============================================================================
 */

/**
 * POST /api/hairstyle/analyze request
 */
export const AnalyzeRequestSchema = z.object({
  image: z.string().describe('Base64 or data URL image'),
  mimeType: AllowedImageTypeSchema,
  locale: z.enum(['ko', 'en']),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * POST /api/hairstyle/recommend request (= RecommendInput)
 */
export const RecommendRequestSchema = RecommendInputSchema;

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

/**
 * POST /api/hairstyle/preview request
 */
export const PreviewRequestSchema = z
  .object({
    hairstyleId: z.string().min(1).max(100),
    locale: z.enum(['ko', 'en']),
  })
  .strict();

export type PreviewRequest = z.infer<typeof PreviewRequestSchema>;

/**
 * POST /api/hairstyle/preview response data
 */
export const PreviewResponseSchema = z.object({
  image: z.string(), // Data URL
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
});

export type PreviewResponse = z.infer<typeof PreviewResponseSchema>;

/**
 * Helper: validate and parse an AnalyzeRequest
 */
export function parseAnalyzeRequest(data: unknown): AnalyzeRequest {
  return AnalyzeRequestSchema.parse(data);
}

/**
 * Helper: validate and parse a RecommendRequest
 */
export function parseRecommendRequest(data: unknown): RecommendRequest {
  return RecommendRequestSchema.parse(data);
}

/**
 * Helper: validate provider output
 */
export function validateProviderRecommendations(
  data: unknown
): ProviderRecommendation[] {
  return z.array(ProviderRecommendationSchema).parse(data);
}
