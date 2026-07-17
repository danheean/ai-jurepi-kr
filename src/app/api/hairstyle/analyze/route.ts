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
  RATE_LIMIT_ANALYZE_PER_MIN,
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_TYPES,
  parseAnalyzeRequest,
  type FaceAnalysis,
} from '@/lib/hairstyle-recommendation';
import { getProvider } from '@/lib/hairstyle-recommendation/ai';
import { getAIProviderKey } from '@/lib/env';

/**
 * POST /api/hairstyle/analyze
 *
 * Server route handler: analyzes a face photo and returns face shape + features.
 * - Ephemeral: image is NEVER stored, logged, or persisted.
 * - Rate-limited per IP.
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
      endpoint: 'hairstyle-analyze',
      requestsPerMinute: RATE_LIMIT_ANALYZE_PER_MIN,
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
    let analyzeRequest;
    try {
      analyzeRequest = parseAnalyzeRequest(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          error('VALIDATION_ERROR', 'Invalid request format'),
          { status: 400 }
        );
      }
      throw err;
    }

    const { image, mimeType, locale } = analyzeRequest;

    // 4. Guard: decode size check
    // Estimate decoded size (base64 adds ~33% overhead when decoding)
    const dataToCheck = image.startsWith('data:')
      ? image.split(',')[1]
      : image;
    const decodedSize = Math.ceil((dataToCheck.length / 4) * 3);

    if (decodedSize > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        error('IMAGE_TOO_LARGE', `Image exceeds ${MAX_IMAGE_BYTES / 1024 / 1024}MB limit`),
        { status: 413 }
      );
    }

    // 5. Guard: MIME type check
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType as any)) {
      return NextResponse.json(
        error('INVALID_IMAGE', `Unsupported image type: ${mimeType}`),
        { status: 415 }
      );
    }

    // 6. Validate AI provider key is available
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

    // 7. Call provider (image is kept in memory ONLY, never persisted)
    const provider = getProvider();
    let analysis: FaceAnalysis;

    try {
      analysis = await provider.analyzeFace(
        { data: dataToCheck, mimeType: mimeType as any },
        locale
      );
    } catch (err) {
      // Provider error — map to typed response
      const errMsg = err instanceof Error ? err.message : 'Unknown provider error';

      // Check if it's a "no face detected" error or similar business logic
      if (
        errMsg.includes('no face') ||
        errMsg.includes('No face') ||
        errMsg.includes('UNPROCESSABLE_ENTITY')
      ) {
        return NextResponse.json(
          error('NO_FACE_DETECTED', 'Could not detect a face in the image'),
          { status: 422 }
        );
      }

      // Generic provider failure
      return NextResponse.json(
        error('AI_UNAVAILABLE', 'Our style advisor is temporarily unavailable'),
        { status: 502 }
      );
    }

    // 8. Return success
    // IMAGE IS DISCARDED HERE (not returned, not logged, not persisted)
    return NextResponse.json(success(analysis), { status: 200 });
  } catch (err) {
    // Unexpected error — log server-side WITHOUT image data
    console.error('Analyze route error:', err instanceof Error ? err.message : 'Unknown');

    return NextResponse.json(
      error('INTERNAL', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
