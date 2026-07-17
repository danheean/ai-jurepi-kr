import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getProvider } from '@/lib/hairstyle-recommendation/ai';

// TEMPORARY diagnostic — exercises the real getProvider() path + CF context.
// No secret values. Remove after use. Bust CF cache with ?t=<ts>.
export const runtime = 'nodejs';

export async function GET() {
  const out: Record<string, unknown> = {};
  // 1) What does the CF context expose?
  try {
    const env = getCloudflareContext().env as unknown as Record<string, unknown>;
    out.cfCtxOk = true;
    out.cfHasGoogle = Boolean(env?.GOOGLE_API_KEY);
    out.cfHasGemini = Boolean(env?.GEMINI_API_KEY);
    out.cfKeys = Object.keys(env ?? {}).filter((k) => !k.startsWith('__')).sort();
  } catch (e) {
    out.cfCtxOk = false;
    out.cfCtxError = (e instanceof Error ? e.message : String(e)).slice(0, 160);
  }
  // 2) Does the real factory + a live call succeed?
  try {
    const provider = getProvider();
    const recs = await provider.recommend(
      { faceShape: 'round', preference: 'feminine', occasion: 'daily', locale: 'en' } as never,
      [{ id: 'soft-layered-bob' }] as never
    );
    out.providerOk = true;
    out.recCount = Array.isArray(recs) ? recs.length : 0;
  } catch (e) {
    out.providerOk = false;
    out.providerError = (e instanceof Error ? e.message : String(e)).slice(0, 200);
  }
  return NextResponse.json(out);
}
