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
  PREVIEW_RATE_LIMIT_PER_MIN,
  PREVIEW_IMAGE_WIDTH,
  PREVIEW_IMAGE_HEIGHT,
  type PreviewRequest,
} from '@/lib/hairstyle-recommendation';
import {
  buildStylePreviewPrompt,
  getHairstyleById,
} from '@/lib/hairstyle-recommendation';
import { PreviewRequestSchema } from '@/lib/hairstyle-recommendation/schema';
import { getImageGenerator } from '@/lib/ai/factory';
import { AiError } from '@/lib/ai/types';

/**
 * POST /api/hairstyle/preview
 *
 * Server route handler: generates a style preview image for a hairstyle.
 * - Text-to-image only: generates a generic salon portrait, never user-face synthesis
 * - Ephemeral: image bytes are NEVER stored, logged, or persisted
 * - Rate-limited per IP at 30 requests/minute
 * - Returns typed ApiEnvelope with error codes mapping to HTTP status
 * - If IMAGE_PROVIDER is not configured, returns 503 IMAGE_GEN_DISABLED
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
      endpoint: 'hairstyle-preview',
      requestsPerMinute: PREVIEW_RATE_LIMIT_PER_MIN,
    });

    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retryAfterSeconds ?? 60;
      return NextResponse.json(
        error(
          'RATE_LIMITED',
          'Too many preview requests. Please wait a moment.'
        ),
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
    let previewRequest: PreviewRequest;
    try {
      previewRequest = PreviewRequestSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          error('VALIDATION_ERROR', 'Invalid request format'),
          { status: 400 }
        );
      }
      throw err;
    }

    // 4. Verify hairstyleId exists in catalog
    const catalogEntry = getHairstyleById(previewRequest.hairstyleId);
    if (!catalogEntry) {
      return NextResponse.json(
        error('VALIDATION_ERROR', 'Hairstyle not found'),
        { status: 400 }
      );
    }

    // 5. Check if image generator is available
    const generator = getImageGenerator();
    if (!generator) {
      return NextResponse.json(
        error(
          'IMAGE_GEN_DISABLED',
          'Style preview generation is not available'
        ),
        { status: 503 }
      );
    }

    // 6. Build prompt from catalog data only (never from user input)
    const prompt = buildStylePreviewPrompt(catalogEntry);

    // 7. Generate image with timeout protection
    let result;
    try {
      result = await generateImageWithTimeout(generator, prompt);
    } catch (err) {
      // Map AiError to typed response
      if (err instanceof AiError) {
        const status = mapAiErrorToStatus(err.code);
        return NextResponse.json(
          error(err.code as ApiErrorCode, 'Image generation failed'),
          { status }
        );
      }

      // Unexpected provider error
      return NextResponse.json(
        error(
          'AI_UNAVAILABLE',
          'Image generation service is temporarily unavailable'
        ),
        { status: 502 }
      );
    }

    // 8. Return success
    // EPHEMERAL: Image bytes remain in-memory only, never stored or logged
    return NextResponse.json(
      success({
        image: `data:${result.mimeType};base64,${result.data}`,
        mimeType: result.mimeType,
      }),
      { status: 200 }
    );
  } catch (err) {
    // Unexpected error — log server-side WITHOUT image data or prompts
    const errorMsg =
      err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Preview route error (generic):', errorMsg);

    return NextResponse.json(
      error('INTERNAL', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

/**
 * Wrapper: generate image with a generous timeout ceiling.
 * Local providers (Ollama) can take 1–3 minutes at 768px including model load;
 * hosted providers return well under this cap.
 */
async function generateImageWithTimeout(
  generator: any,
  prompt: string,
  timeoutMs = 180_000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await generator.generateImage({
      prompt,
      width: PREVIEW_IMAGE_WIDTH,
      height: PREVIEW_IMAGE_HEIGHT,
    });
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Map AiError code to HTTP status
 */
function mapAiErrorToStatus(code: string): number {
  switch (code) {
    case 'IMAGE_GEN_DISABLED':
      return 503;
    case 'VALIDATION_ERROR':
      return 400;
    case 'AI_UNAVAILABLE':
      return 502;
    default:
      return 500;
  }
}
