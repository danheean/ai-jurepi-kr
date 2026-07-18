/**
 * AI Error Re-exports for Backwards Compatibility
 *
 * For backwards compatibility, hairstyle-recommendation imports may still use
 * src/lib/hairstyle-recommendation/ai/errors.ts.
 * This file re-exports from the platform layer at src/lib/ai/types.ts.
 */

export { AiError, type AiErrorCode } from '../../ai/types';
