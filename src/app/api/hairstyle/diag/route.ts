import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/hairstyle-recommendation/ai';
import { matchCandidates } from '@/lib/hairstyle-recommendation';

// TEMPORARY diagnostic — replicates the real recommend flow to surface the true
// error (Gemini call included). No secret values. Remove after use.
export const runtime = 'nodejs';

export async function GET() {
  const input = {
    faceShape: 'round' as const,
    preference: 'feminine' as const,
    occasion: 'daily' as const,
    locale: 'ko' as const,
  };
  try {
    const candidates = matchCandidates(input);
    const provider = getProvider();
    const recs = await provider.recommend(input as never, candidates);
    return NextResponse.json({
      ok: true,
      candidateCount: candidates.length,
      recCount: Array.isArray(recs) ? recs.length : 0,
      firstId: Array.isArray(recs) && recs[0] ? (recs[0] as { hairstyleId?: string }).hairstyleId : null,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: (e instanceof Error ? e.message : String(e)).slice(0, 300),
      name: e instanceof Error ? e.name : typeof e,
    });
  }
}
