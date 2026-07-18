/**
 * AI Layer Environment Resolution
 *
 * CRITICAL: OpenNext/Cloudflare runtime separation.
 * Runtime secrets (API keys) live on getCloudflareContext().env, NOT process.env.
 * process.env only carries plaintext `vars` from wrangler.jsonc.
 * For local dev and tests, the CF context is unavailable, so fall back to process.env.
 *
 * CRITICAL: every value below is a GETTER, not a module-scope constant.
 * Module scope evaluates outside the per-request Cloudflare context, where
 * secrets are invisible — a constant would freeze `undefined` in production.
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

/** AI provider selection: 'gemini' (default) | 'ollama' */
export function getAiProvider(): string {
  return readRuntimeEnv('AI_PROVIDER') || 'gemini';
}

/** Image generator selection: 'ollama' | undefined (disabled by default in production) */
export function getImageProvider(): string | undefined {
  return readRuntimeEnv('IMAGE_PROVIDER');
}

/** Gemini API key — prod secret is named GOOGLE_API_KEY; accept both */
export function getGeminiApiKey(): string | undefined {
  return readRuntimeEnv('GEMINI_API_KEY') || readRuntimeEnv('GOOGLE_API_KEY');
}

/** Gemini model — 'gemini-2.5-flash' 404s for newer keys; use the stable alias */
export function getGeminiModel(): string {
  return readRuntimeEnv('GEMINI_MODEL') || 'gemini-flash-latest';
}

export function getOllamaBaseUrl(): string {
  return readRuntimeEnv('OLLAMA_BASE_URL') || 'http://localhost:11434';
}

export function getOllamaVisionModel(): string {
  return readRuntimeEnv('OLLAMA_VISION_MODEL') || 'qwen3-vl:8b';
}

export function getOllamaTextModel(): string {
  return readRuntimeEnv('OLLAMA_TEXT_MODEL') || 'qwen3.5:9b';
}

export function getOllamaImageModel(): string {
  return readRuntimeEnv('OLLAMA_IMAGE_MODEL') || 'x/z-image-turbo';
}
