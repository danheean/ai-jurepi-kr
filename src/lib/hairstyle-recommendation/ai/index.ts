/**
 * Hairstyle AI Provider Factory
 *
 * Selects HairstyleAI implementation by AI_PROVIDER env var (default: 'gemini').
 * Returns an instance implementing the HairstyleAI port interface.
 *
 * Public exports:
 * - getProvider(): HairstyleAI
 * - AiError, AiErrorCode (for route handlers to catch and map)
 */

import type { HairstyleAI } from '../types';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';
import { AiError, type AiErrorCode } from '../../ai/types';
import { getAiProvider } from '../../ai/env';

/**
 * Factory function to get the active HairstyleAI provider.
 *
 * @returns HairstyleAI implementation instance
 * @throws AiError if configuration is invalid
 */
export function getProvider(): HairstyleAI {
  const provider = getAiProvider();

  switch (provider) {
    case 'gemini':
      return new GeminiProvider();

    case 'ollama':
      return new OllamaProvider();

    default:
      throw new AiError(
        'AI_UNAVAILABLE',
        `Unknown AI_PROVIDER: ${provider}`
      );
  }
}

// Export error types for route handlers
export { AiError, type AiErrorCode };
