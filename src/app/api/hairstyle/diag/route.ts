import { NextResponse } from 'next/server';

// TEMPORARY diagnostic — reports env-var PRESENCE only (never values).
// Confirms which vars/secrets the OpenNext Worker runtime actually receives.
// Remove after diagnosing production secret binding.
export const runtime = 'nodejs';

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  return NextResponse.json({
    hasGeminiKey: Boolean(key),
    geminiKeyLen: key ? key.length : 0,
    aiProvider: process.env.AI_PROVIDER ?? null,
    geminiModel: process.env.GEMINI_MODEL ?? '(code default)',
    rateLimit: process.env.HAIRSTYLE_RATE_LIMIT_PER_MIN ?? null,
  });
}
