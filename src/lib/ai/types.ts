/**
 * AI Abstraction Layer: Shared Port Interfaces
 *
 * Platform-level abstractions for structured JSON generation and image generation.
 * Implementations: GeminiClient, OllamaClient.
 * No SDK imports at this level — SDK-specific logic lives in implementations.
 */

import { z } from 'zod';

/**
 * StructuredModel: Unified interface for JSON-schema-validated outputs.
 * Supports image inputs (vision) and multi-modal prompting.
 */
export interface StructuredModel {
  /**
   * Generate JSON output matching a Zod schema.
   *
   * @param req.prompt Text prompt (vision providers prepend it after images)
   * @param req.image Optional: { data: base64, mimeType: 'image/png'|'image/jpeg'|'image/webp' }
   * @param req.schema Zod schema for validation
   * @param req.maxRetries Max retry attempts on JSON extraction failure (default: 1)
   * @returns Validated output matching the schema
   * @throws AiError if schema validation fails or API error
   */
  generateJson<T extends z.ZodType>(req: {
    prompt: string;
    image?: { data: string; mimeType: 'image/png' | 'image/jpeg' | 'image/webp' };
    schema: T;
    maxRetries?: number;
  }): Promise<z.infer<T>>;
}

/**
 * ImageGenerator: Unified interface for text-to-image generation.
 * Supports optional reference images for "try-on" seaming (future).
 */
export interface ImageGenerator {
  /**
   * Whether this generator supports image-guided generation (reference images).
   */
  readonly supportsImageEdit: boolean;

  /**
   * Generate an image from text + optional reference.
   *
   * @param req.prompt Text description (no user input, AI-safe)
   * @param req.width Image width (default: 512, max: 1024)
   * @param req.height Image height (default: 512, max: 1024)
   * @param req.seed Optional seed for reproducibility
   * @param req.referenceImage Optional: { data: base64, mimeType } (future try-on)
   * @returns { data: base64-encoded image, mimeType: 'image/png'|'image/jpeg' }
   * @throws AiError if generation fails or IMAGE_GEN_DISABLED
   */
  generateImage(req: {
    prompt: string;
    width?: number;
    height?: number;
    seed?: number;
    referenceImage?: { data: string; mimeType: string };
  }): Promise<{ data: string; mimeType: 'image/png' | 'image/jpeg' }>;
}

/**
 * AiError: Typed error for all AI layer failures.
 * Code → HTTP status mapping lives in src/lib/api-envelope.ts.
 */
export type AiErrorCode =
  | 'AI_UNAVAILABLE'      // 502: API key missing, network error, model unavailable
  | 'NO_FACE_DETECTED'    // 422: Vision model business error
  | 'IMAGE_GEN_DISABLED'  // 503: ImageGenerator is null (feature disabled)
  | 'VALIDATION_ERROR';   // 400: Schema validation failed on output

export class AiError extends Error {
  constructor(public code: AiErrorCode, message?: string) {
    super(message || code);
    this.name = 'AiError';
  }
}
