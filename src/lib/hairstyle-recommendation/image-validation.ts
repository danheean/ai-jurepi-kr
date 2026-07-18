/**
 * Shared Image Validation Helpers
 *
 * Used by both /analyze and /preview routes to validate image inputs.
 * CRITICAL: Never logs or persists image data — validation only.
 */

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  type AllowedImageType,
} from './constants';

/**
 * Parse a data URL or base64 string and extract the base64 payload.
 * Handles both formats:
 * - data:image/png;base64,<base64>
 * - <base64>
 *
 * @returns The base64 payload without the data: prefix
 */
export function extractBase64Payload(imageString: string): string {
  if (imageString.startsWith('data:')) {
    const parts = imageString.split(',');
    return parts[1] || '';
  }
  return imageString;
}

/**
 * Calculate the decoded size of a base64-encoded image.
 * Base64 encoding adds ~33% overhead, so decoded size ≈ (base64_len / 4) * 3.
 *
 * @param base64Payload The base64 string (without data: prefix)
 * @returns Estimated decoded size in bytes
 */
export function estimateDecodedSize(base64Payload: string): number {
  return Math.ceil((base64Payload.length / 4) * 3);
}

/**
 * Validate image: size, MIME type, and sanity checks.
 *
 * Returns { ok: true } on success, or { ok: false, errorCode, message } on failure.
 * Error codes map to HTTP status via api-envelope.ts.
 *
 * @param imageString Data URL or base64 image string
 * @param mimeType Claimed MIME type (must be in ALLOWED_IMAGE_TYPES)
 * @returns Validation result with error details if validation fails
 */
export function validateImage(
  imageString: string,
  mimeType: string
): { ok: true } | { ok: false; errorCode: 'IMAGE_TOO_LARGE' | 'INVALID_IMAGE'; message: string } {
  // 1. Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType as AllowedImageType)) {
    return {
      ok: false,
      errorCode: 'INVALID_IMAGE',
      message: `Unsupported image type: ${mimeType}`,
    };
  }

  // 2. Extract base64 payload
  const base64Payload = extractBase64Payload(imageString);
  if (!base64Payload) {
    return {
      ok: false,
      errorCode: 'INVALID_IMAGE',
      message: 'Invalid image format',
    };
  }

  // 3. Check decoded size
  const decodedSize = estimateDecodedSize(base64Payload);
  if (decodedSize > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      errorCode: 'IMAGE_TOO_LARGE',
      message: `Image exceeds ${MAX_IMAGE_BYTES / 1024 / 1024}MB limit`,
    };
  }

  return { ok: true };
}
