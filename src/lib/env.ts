/**
 * Environment Variable Validation
 *
 * CRITICAL: All AI API keys are server-only (NEVER NEXT_PUBLIC_).
 * Validate presence at startup + per-request.
 * Return typed error (502 AI_UNAVAILABLE) if missing.
 */

/**
 * Validate required server-only environment variables
 * Call this at app startup in a route handler or API bootstrap
 */
export function validateServerEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const env = process.env;

  // Check AI provider selection
  const aiProvider = env.AI_PROVIDER || 'gemini';
  const apiKeyName = `${aiProvider.toUpperCase()}_API_KEY`;

  if (!env[apiKeyName]) {
    errors.push(
      `Missing required secret: ${apiKeyName} (AI_PROVIDER=${aiProvider})`
    );
  }

  // Public vars (these CAN use NEXT_PUBLIC_)
  const publicVars = [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_ADSENSE_CLIENT',
    'NEXT_PUBLIC_GA_ID',
  ];

  // Warn if secrets are leaked into NEXT_PUBLIC_
  if (env.NEXT_PUBLIC_GEMINI_API_KEY) {
    errors.push('CRITICAL: GEMINI_API_KEY must not be prefixed NEXT_PUBLIC_');
  }
  if (env.NEXT_PUBLIC_CLAUDE_API_KEY) {
    errors.push('CRITICAL: CLAUDE_API_KEY must not be prefixed NEXT_PUBLIC_');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get server-only AI provider secret
 * Throws if missing; route handlers catch and return 502
 */
export function getAIProviderKey(provider: string = process.env.AI_PROVIDER || 'gemini'): string {
  const keyName = `${provider.toUpperCase()}_API_KEY`;
  const key = process.env[keyName];

  if (!key) {
    throw new Error(
      `Missing AI provider key: ${keyName} (AI_PROVIDER=${provider})`
    );
  }

  return key;
}
