import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  success,
  error,
  errorCodeToHttpStatus,
  type ApiErrorCode,
} from '@/lib/api-envelope';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  RATE_LIMIT_RECOMMEND_PER_MIN,
  parseRecommendRequest,
  matchCandidates,
  attachCatalog,
  backfill,
  type Recommendation,
} from '@/lib/hairstyle-recommendation';
import { getProvider } from '@/lib/hairstyle-recommendation/ai';
import { getAIProviderKey } from '@/lib/env';

/**
 * POST /api/hairstyle/recommend
 *
 * Server route handler: recommends hairstyles based on face shape + attributes.
 * - Works with or without a prior analyze call.
 * - Rate-limited per IP.
 * - Guarantees ≥ MIN_RECS recommendations (backfills if needed).
 * - Returns typed ApiEnvelope with error codes mapping to HTTP status.
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Get client IP for rate limiting
    const clientIp =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 2. Rate limit check
    const rateLimitResult = await checkRateLimit(clientIp, {
      endpoint: 'hairstyle-recommend',
      requestsPerMinute: RATE_LIMIT_RECOMMEND_PER_MIN,
    });

    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retryAfterSeconds ?? 60;
      return NextResponse.json(
        error('RATE_LIMITED', 'Too many requests. Please wait a moment.'),
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() },
        }
      );
    }

    // 3. Parse and validate request
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(error('VALIDATION_ERROR', 'Invalid JSON'), {
        status: 400,
      });
    }

    // Validate with zod
    let recommendInput;
    try {
      recommendInput = parseRecommendRequest(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          error('VALIDATION_ERROR', 'Invalid request format'),
          { status: 400 }
        );
      }
      throw err;
    }

    // 4. Validate AI provider key is available
    let providerKey: string;
    try {
      providerKey = getAIProviderKey();
    } catch (err) {
      // Key missing or invalid — do NOT expose details
      return NextResponse.json(
        error('AI_UNAVAILABLE', 'Our style advisor is temporarily unavailable'),
        { status: 502 }
      );
    }

    // 5. Get candidate hairstyles
    const candidates = matchCandidates(recommendInput);

    // 6. Call provider to recommend
    const provider = getProvider();
    let providerRecommendations;

    try {
      providerRecommendations = await provider.recommend(
        recommendInput,
        candidates
      );
    } catch (err) {
      // Generic provider failure
      return NextResponse.json(
        error('AI_UNAVAILABLE', 'Our style advisor is temporarily unavailable'),
        { status: 502 }
      );
    }

    // 7. Enrich with catalog data (names, images, tags)
    const enriched = attachCatalog(providerRecommendations, recommendInput.locale);

    // 8. Backfill if needed (guarantee ≥ 3 recommendations)
    const final: Recommendation[] = backfill(enriched, candidates, recommendInput.locale);

    // 9. Return success
    return NextResponse.json(
      success({ recommendations: final }),
      { status: 200 }
    );
  } catch (err) {
    // Unexpected error — log server-side
    console.error('Recommend route error:', err instanceof Error ? err.message : 'Unknown');

    return NextResponse.json(
      error('INTERNAL', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
