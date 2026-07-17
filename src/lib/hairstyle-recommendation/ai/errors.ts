/**
 * AI Provider Error Types
 *
 * Typed errors for the AI integration layer. Routes will map these codes to HTTP status codes.
 */

export type AiErrorCode = 'AI_UNAVAILABLE' | 'NO_FACE_DETECTED';

export class AiError extends Error {
  constructor(
    public code: AiErrorCode,
    message?: string
  ) {
    super(message || code);
    this.name = 'AiError';
  }
}
