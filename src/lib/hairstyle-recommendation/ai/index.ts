/**
 * AI Provider Factory
 *
 * Selects implementation by AI_PROVIDER env var (default: 'gemini').
 * Returns an instance implementing the HairstyleAI port interface.
 *
 * The provider SDK is imported only within its corresponding provider file.
 * Route handlers never import provider SDKs directly.
 *
 * Public exports:
 * - getProvider(): HairstyleAI
 * - AiError, AiErrorCode (for route handlers to catch and map)
 */

import type { HairstyleAI } from '../types';
import { GeminiProvider } from './gemini';
import { AiError, type AiErrorCode } from './errors';

/**
 * Factory function to get the active HairstyleAI provider.
 *
 * @returns HairstyleAI implementation instance
 * @throws AiError if key is missing at call time
 */
export function getProvider(): HairstyleAI {
  const provider = process.env.AI_PROVIDER || 'gemini';

  switch (provider) {
    case 'gemini': {
      // Accept either name — GEMINI_API_KEY (preferred) or GOOGLE_API_KEY,
      // the common Google AI Studio env name. Missing key → AI_UNAVAILABLE at call time.
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      return new GeminiProvider(apiKey || '');
    }

    default:
      throw new AiError(
        'AI_UNAVAILABLE',
        `Unknown AI_PROVIDER: ${provider}`
      );
  }
}

// Export error types for route handlers
export { AiError, type AiErrorCode };
