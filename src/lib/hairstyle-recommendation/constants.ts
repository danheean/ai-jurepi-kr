/**
 * Hairstyle Recommendation Constants
 *
 * STUB: domain-engineer will populate with real hairstyle catalog and constants
 */

export const FACE_SHAPES = [
  'oval',
  'round',
  'square',
  'heart',
  'oblong',
  'diamond',
  'triangle',
] as const;

export const PREFERENCES = ['neutral', 'casual', 'formal', 'trendy'] as const;

export const HAIR_TYPES = ['straight', 'wavy', 'curly'] as const;

export const MAINTENANCE_LEVELS = ['low', 'medium', 'high'] as const;

/**
 * Default rate limit for hairstyle endpoints
 */
export const DEFAULT_RATE_LIMIT_PER_MIN =
  Number(process.env.HAIRSTYLE_RATE_LIMIT_PER_MIN) || 10;

/**
 * Max image size: 5MB
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed MIME types for images
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];
