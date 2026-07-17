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

import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { HairstyleAI } from '../types';
import { GeminiProvider } from './gemini';
import { AiError, type AiErrorCode } from './errors';

// Server-only. This module is imported exclusively by the route handlers, never
// by client code (the lib barrel does not re-export it), so pulling in the
// Cloudflare adapter here does not affect client bundles or tests.

/**
 * Resolve an env value at request time.
 *
 * CRITICAL (OpenNext/Cloudflare): runtime **secrets** (e.g. GEMINI_API_KEY) live
 * on `getCloudflareContext().env`, NOT on `process.env` — `process.env` only
 * carries the plaintext `vars` from wrangler.jsonc. So we read the Cloudflare
 * context first and fall back to `process.env` for local dev (`next start`) and
 * unit tests, where the CF context is unavailable.
 */
function readRuntimeEnv(name: string): string | undefined {
  try {
    const env = getCloudflareContext().env as unknown as Record<
      string,
      string | undefined
    >;
    if (env?.[name]) return env[name];
  } catch {
    // Not in a Cloudflare request context (local dev / tests) — fall through.
  }
  return process.env[name];
}

/**
 * Factory function to get the active HairstyleAI provider.
 *
 * @returns HairstyleAI implementation instance
 * @throws AiError if key is missing at call time
 */
export function getProvider(): HairstyleAI {
  const provider = readRuntimeEnv('AI_PROVIDER') || 'gemini';

  switch (provider) {
    case 'gemini': {
      // Accept either name — GEMINI_API_KEY (preferred) or GOOGLE_API_KEY,
      // the common Google AI Studio env name. Missing key → AI_UNAVAILABLE at call time.
      const apiKey =
        readRuntimeEnv('GEMINI_API_KEY') || readRuntimeEnv('GOOGLE_API_KEY');
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
