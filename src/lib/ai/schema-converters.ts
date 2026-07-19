/**
 * Hand-written Gemini responseSchema objects.
 *
 * Gemini's `generationConfig.responseSchema` accepts an OpenAPI 3.0-subset JSON
 * schema and enforces it server-side during generation (stronger than the
 * `responseMimeType: 'application/json'` loose JSON mode alone). We hand-write
 * these rather than pull in a zod-to-json-schema dependency: the set of schemas
 * is small and fixed, and Gemini's subset (no $ref, limited keyword support)
 * doesn't map cleanly from a generic zod converter anyway.
 *
 * Each schema here must stay in sync with its zod counterpart in
 * hairstyle-recommendation/schema.ts — zod validation still runs after the
 * response returns as a defense-in-depth layer (Gemini's structured output is
 * not a 100% guarantee).
 */

import { FACE_SHAPES, ANALYSIS_GENDERS } from '../hairstyle-recommendation/constants';

/**
 * Mirrors FaceAnalysisSchema (hairstyle-recommendation/schema.ts).
 */
export const FACE_ANALYSIS_GEMINI_SCHEMA = {
  type: 'object',
  properties: {
    faceShape: { type: 'string', enum: [...FACE_SHAPES] },
    confidence: { type: 'number' },
    gender: { type: 'string', enum: [...ANALYSIS_GENDERS] },
    features: {
      type: 'array',
      items: { type: 'string' },
    },
    notes: { type: 'string' },
  },
  required: ['faceShape', 'confidence', 'gender', 'features'],
} as const;
