import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// TEMPORARY diagnostic — key PRESENCE + a live Gemini self-test. No secret values.
// Remove after diagnosing production. Bust CF cache with ?t=<ts>.
export const runtime = 'nodejs';

export async function GET() {
  const key = process.env.GEMINI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const out: Record<string, unknown> = {
    hasGeminiKey: Boolean(key),
    geminiKeyLen: key.length,
    model,
  };
  if (key) {
    try {
      const g = new GoogleGenerativeAI(key);
      const m = g.getGenerativeModel({ model });
      const r = await m.generateContent('Reply with the single word OK');
      out.geminiTest = 'ok';
      out.sample = (r.response.text() || '').slice(0, 20);
    } catch (e) {
      out.geminiTest = 'error';
      out.error = (e instanceof Error ? e.message : String(e)).slice(0, 240);
    }
  }
  return NextResponse.json(out);
}
