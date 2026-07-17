/**
 * AI Provider Factory
 *
 * Selects implementation by AI_PROVIDER env var.
 * STUB: ai-integration-engineer will add real provider implementations
 */

import type { HairstyleAI } from '../types';

// STUB: Imports will be added by ai-integration-engineer
// import { GeminiProvider } from './gemini';
// import { ClaudeProvider } from './claude';

export function getProvider(): HairstyleAI {
  const provider = process.env.AI_PROVIDER || 'gemini';

  // STUB: Implement provider selection logic
  // const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  //
  // if (!apiKey) {
  //   throw new Error(
  //     `Missing AI provider key: ${provider.toUpperCase()}_API_KEY`
  //   );
  // }
  //
  // switch (provider) {
  //   case 'gemini':
  //     return new GeminiProvider(apiKey);
  //   case 'claude':
  //     return new ClaudeProvider(apiKey);
  //   default:
  //     throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  // }

  throw new Error(
    `STUB: getProvider() not yet implemented. AI_PROVIDER=${provider}`
  );
}
