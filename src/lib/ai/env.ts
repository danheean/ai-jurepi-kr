/**
 * AI Layer Environment Resolution
 *
 * CRITICAL: OpenNext/Cloudflare runtime separation.
 * Runtime secrets (API keys) live on getCloudflareContext().env, NOT process.env.
 * process.env only carries plaintext `vars` from wrangler.jsonc.
 * For local dev and tests, the CF context is unavailable, so fall back to process.env.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Resolve an env value at request time.
 */
export function readRuntimeEnv(name: string): string | undefined {
  try {
    const env = getCloudflareContext().env as Record<string, string | undefined>;
    if (env?.[name]) return env[name];
  } catch {
    // Not in CF context (local dev, unit tests) — fall through
  }
  return process.env[name];
}

/**
 * AI provider selection: 'gemini' (default) | 'ollama'
 */
export const AI_PROVIDER = readRuntimeEnv('AI_PROVIDER') || 'gemini';

/**
 * Image generator selection: 'ollama' | undefined (disabled by default in production)
 */
export const IMAGE_PROVIDER = readRuntimeEnv('IMAGE_PROVIDER');

/**
 * Gemini-specific config
 */
export const GEMINI_API_KEY =
  readRuntimeEnv('GEMINI_API_KEY') || readRuntimeEnv('GOOGLE_API_KEY');
export const GEMINI_MODEL = readRuntimeEnv('GEMINI_MODEL') || 'gemini-2.5-flash';

/**
 * Ollama-specific config
 */
export const OLLAMA_BASE_URL =
  readRuntimeEnv('OLLAMA_BASE_URL') || 'http://localhost:11434';
export const OLLAMA_VISION_MODEL =
  readRuntimeEnv('OLLAMA_VISION_MODEL') || 'qwen3-vl:8b';
export const OLLAMA_TEXT_MODEL =
  readRuntimeEnv('OLLAMA_TEXT_MODEL') || 'qwen3.5:9b';
export const OLLAMA_IMAGE_MODEL =
  readRuntimeEnv('OLLAMA_IMAGE_MODEL') || 'x/z-image-turbo';
