/**
 * AI Factory: Instantiate providers based on environment
 *
 * Public interface for getting StructuredModel and ImageGenerator instances.
 * Provider selection is keyed by AI_PROVIDER and IMAGE_PROVIDER env vars.
 */

import type { StructuredModel, ImageGenerator } from './types';
import { AiError } from './types';
import { GeminiClient } from './gemini';
import { GeminiImageClient } from './gemini-image';
import { OllamaClient } from './ollama';
import { getAiProvider, getImageProvider } from './env';

/**
 * Get the active StructuredModel implementation.
 * Keyed by AI_PROVIDER env (default: 'gemini').
 *
 * @returns StructuredModel instance
 * @throws AiError if AI_PROVIDER is unknown or required config is missing
 */
export function getStructuredModel(): StructuredModel {
  const provider = getAiProvider();

  switch (provider) {
    case 'gemini':
      return new GeminiClient();
    case 'ollama':
      return new OllamaClient();
    default:
      throw new AiError(
        'AI_UNAVAILABLE',
        `Unknown AI_PROVIDER: ${provider}`
      );
  }
}

/**
 * Get the active ImageGenerator implementation (optional).
 * Keyed by IMAGE_PROVIDER env.
 * Returns null if IMAGE_PROVIDER is unset (feature disabled in production).
 *
 * @returns ImageGenerator instance or null if disabled
 */
export function getImageGenerator(): ImageGenerator | null {
  const provider = getImageProvider();

  if (!provider) return null;

  switch (provider) {
    case 'gemini':
      return new GeminiImageClient();
    case 'ollama':
      return new OllamaClient();
    default:
      return null;
  }
}
