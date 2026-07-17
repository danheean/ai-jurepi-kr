/**
 * Hairstyle Recommendation Constants
 *
 * Domain constants derived from SPEC.md core entities.
 * All enum values are canonical; route handlers and catalog must conform.
 */

// Face shapes (7 variants per SPEC)
export const FACE_SHAPES = [
  'oval',
  'round',
  'square',
  'heart',
  'oblong',
  'diamond',
  'triangle',
] as const;

export type FaceShape = (typeof FACE_SHAPES)[number];

// Style preferences (3 variants per SPEC)
export const PREFERENCES = ['feminine', 'masculine', 'neutral'] as const;

export type Preference = (typeof PREFERENCES)[number];

// Hair lengths (3 variants per SPEC)
export const LENGTHS = ['short', 'medium', 'long'] as const;

export type Length = (typeof LENGTHS)[number];

// Hair types (4 variants per SPEC)
export const HAIR_TYPES = ['straight', 'wavy', 'curly', 'coily'] as const;

export type HairType = (typeof HAIR_TYPES)[number];

// Occasions (4 variants per SPEC)
export const OCCASIONS = ['daily', 'business', 'event', 'seasonal'] as const;

export type Occasion = (typeof OCCASIONS)[number];

// Image constraints per SPEC
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_EDGE_PX = 1024; // longest edge
export const JPEG_QUALITY = 0.85;

// Recommendation bounds per SPEC
export const MIN_RECS = 3;
export const MAX_RECS = 6;

// Rate limits per SPEC
export const RATE_LIMIT_ANALYZE_PER_MIN = 10;
export const RATE_LIMIT_RECOMMEND_PER_MIN = 20;

// Allowed image MIME types per SPEC
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
