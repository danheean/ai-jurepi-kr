/**
 * JSON Extraction & Validation Guardrails
 *
 * Hoisted from provider implementations. Unified logic for extracting,
 * parsing, and validating JSON responses against Zod schemas.
 * Used by both Gemini and Ollama clients.
 */

import { z } from 'zod';
import { AiError } from './types';

/**
 * Extract JSON from AI response text.
 * Handles markdown code blocks (```json ... ```), raw JSON, and partial JSON.
 *
 * @param text Raw text response from model
 * @returns Cleaned JSON string, or null if extraction fails
 */
export function extractJsonFromResponse(text: string): string | null {
  if (!text) return null;

  // Remove markdown fences (both ```json and ```)
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  return cleaned || null;
}

/**
 * Validate and parse JSON against a Zod schema.
 * On validation error, throws AiError with code VALIDATION_ERROR.
 *
 * @param json Raw JSON string
 * @param schema Zod schema
 * @returns Validated output
 * @throws AiError on schema violation
 */
export function validateJson<T extends z.ZodType>(
  json: string,
  schema: T
): z.infer<T> {
  try {
    const parsed = JSON.parse(json);
    return schema.parse(parsed);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AiError(
        'VALIDATION_ERROR',
        `Schema validation failed: ${err.issues.map((i) => i.message).join(', ')}`
      );
    }
    throw new AiError(
      'VALIDATION_ERROR',
      `JSON parse failed: ${err instanceof Error ? err.message : 'unknown'}`
    );
  }
}

/**
 * Retry helper: attempt extraction + validation up to maxRetries times.
 * If a single retry might succeed (e.g., JSON extraction failed), calls generateFn again.
 *
 * @param generateFn Async function returning raw text
 * @param schema Zod schema for validation
 * @param maxRetries Max call attempts (default: 1)
 * @returns Validated output
 * @throws AiError if all retries fail
 */
export async function retryJsonExtraction<T extends z.ZodType>(
  generateFn: () => Promise<string>,
  schema: T,
  maxRetries: number = 1
): Promise<z.infer<T>> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const text = await generateFn();
      const json = extractJsonFromResponse(text);
      if (!json) {
        if (attempt < maxRetries) continue; // Retry
        throw new AiError(
          'VALIDATION_ERROR',
          'Failed to extract JSON from response'
        );
      }
      return validateJson(json, schema);
    } catch (err) {
      if (err instanceof AiError) throw err; // Validation error, don't retry
      if (attempt >= maxRetries) throw err; // Network error on final attempt
      // Otherwise retry
    }
  }
  throw new AiError('AI_UNAVAILABLE', 'All retry attempts exhausted');
}
