import { NextResponse } from 'next/server';

// TEMPORARY diagnostic — checks whether GEMINI_API_KEY reaches the runtime via
// process.env vs getCloudflareContext().env. No secret values. Remove after use.
export const runtime = 'nodejs';

export async function GET() {
  const out: Record<string, unknown> = {
    procEnv_hasKey: Boolean(process.env.GEMINI_API_KEY),
    procEnv_keyLen: (process.env.GEMINI_API_KEY || '').length,
    procEnv_aiProvider: process.env.AI_PROVIDER ?? null,
  };
  try {
    const mod = await import('@opennextjs/cloudflare');
    const ctx = mod.getCloudflareContext();
    const env = (ctx?.env ?? {}) as Record<string, unknown>;
    out.cfCtx_hasKey = Boolean(env.GEMINI_API_KEY);
    out.cfCtx_keyLen = typeof env.GEMINI_API_KEY === 'string' ? (env.GEMINI_API_KEY as string).length : 0;
    out.cfCtx_envKeys = Object.keys(env).filter((k) => !k.startsWith('__')).sort();
  } catch (e) {
    out.cfCtx_error = (e instanceof Error ? e.message : String(e)).slice(0, 160);
  }
  return NextResponse.json(out);
}
