/**
 * Typed API Response Envelope
 *
 * All endpoints return a consistent shape across the platform per SPEC.md:
 * - Success: { ok: true, data: T, error: null }
 * - Error: { ok: false, data: null, error: { code, message } }
 *
 * Error codes are exhaustive and map to HTTP status codes.
 */

import { z } from 'zod';

export const ApiErrorCode = z.enum([
  'VALIDATION_ERROR', // Zod parse fail (400)
  'IMAGE_TOO_LARGE', // >5MB (413)
  'INVALID_IMAGE', // Wrong MIME type (415)
  'NO_FACE_DETECTED', // Provider business error (422)
  'RATE_LIMITED', // IP quota exceeded (429)
  'IMAGE_GEN_DISABLED', // Image generation feature disabled (503)
  'AI_UNAVAILABLE', // API key missing or provider error (502)
  'INTERNAL', // Server crash (500)
]);

export type ApiErrorCode = z.infer<typeof ApiErrorCode>;

export const ApiError = z.object({
  code: ApiErrorCode,
  message: z.string().describe('User-facing message (localized)'),
});

export type ApiError = z.infer<typeof ApiError>;

export const ApiEnvelope = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    data: z.unknown(),
    error: z.null(),
  }),
  z.object({
    ok: z.literal(false),
    data: z.null(),
    error: ApiError,
  }),
]);

export type ApiEnvelope<T = unknown> =
  | { ok: true; data: T; error: null }
  | { ok: false; data: null; error: ApiError };

/**
 * Factory: success response
 */
export function success<T>(data: T): ApiEnvelope<T> {
  return {
    ok: true,
    data,
    error: null,
  };
}

/**
 * Factory: error response
 */
export function error(code: ApiErrorCode, message: string): ApiEnvelope {
  return {
    ok: false,
    data: null,
    error: { code, message },
  };
}

/**
 * Map error code to HTTP status
 */
export function errorCodeToHttpStatus(code: ApiErrorCode): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'IMAGE_TOO_LARGE':
      return 413;
    case 'INVALID_IMAGE':
      return 415;
    case 'NO_FACE_DETECTED':
      return 422;
    case 'RATE_LIMITED':
      return 429;
    case 'IMAGE_GEN_DISABLED':
      return 503;
    case 'AI_UNAVAILABLE':
      return 502;
    case 'INTERNAL':
    default:
      return 500;
  }
}
