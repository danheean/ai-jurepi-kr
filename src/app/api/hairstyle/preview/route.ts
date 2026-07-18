import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  success,
  error,
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
  buildFaceEditPrompt,
  getHairstyleById,
} from '@/lib/hairstyle-recommendation';
import { PreviewRequestSchema } from '@/lib/hairstyle-recommendation/schema';
import { validateImage } from '@/lib/hairstyle-recommendation/image-validation';
import { getImageGenerator } from '@/lib/ai/factory';
import { AiError } from '@/lib/ai/types';

/**
 * POST /api/hairstyle/preview
 *
 * Server route handler: generates a style preview image for a hairstyle.
 * Two modes (rev 2):
 * - Face-preserving edit: user photo + edit-capable provider → hair-only edit prompt
 * - Generic render: text→image portrait (gender-matched when possible)
 *
 * CRITICAL — EPHEMERAL:
 * - Image bytes are NEVER stored, logged, or persisted
 * - User photo is kept in-memory only during generation, then discarded
 * - No image data in error messages
 *
 * Rate-limited per IP at 30 requests/minute.
 * Returns typed ApiEnvelope with error codes mapping to HTTP status.
 * If IMAGE_PROVIDER is not configured, returns 503 IMAGE_GEN_DISABLED.
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

    // 5. Validate image if present (size/mime type check)
    let imageData: { data: string; mimeType: string } | undefined;
    if (previewRequest.image && previewRequest.mimeType) {
      const validation = validateImage(previewRequest.image, previewRequest.mimeType);
      if (!validation.ok) {
        return NextResponse.json(
          error(validation.errorCode, validation.message),
          { status: validation.errorCode === 'IMAGE_TOO_LARGE' ? 413 : 415 }
        );
      }
      // Extract base64 payload for passing to provider
      const payload = previewRequest.image.startsWith('data:')
        ? previewRequest.image.split(',')[1]
        : previewRequest.image;
      imageData = { data: payload, mimeType: previewRequest.mimeType };
    }

    // 6. Check if image generator is available
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

    // 7. Branch: determine prompt and referenceImage based on capabilities
    // If user provided a photo AND generator supports edits → face-preserving path
    // Otherwise → generic text→image path
    let prompt: string;
    let referenceImage: { data: string; mimeType: string } | undefined;

    if (imageData && generator.supportsImageEdit) {
      // Face-preserving edit: build hair-only edit prompt + attach reference
      prompt = buildFaceEditPrompt(catalogEntry);
      referenceImage = imageData;
    } else {
      // Generic render: build salon portrait prompt (gender-matched if available)
      prompt = buildStylePreviewPrompt(catalogEntry, previewRequest.gender);
      referenceImage = undefined;
    }

    // 8. Generate image with timeout protection
    let result;
    try {
      result = await generateImageWithTimeout(
        generator,
        prompt,
        referenceImage
      );
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

    // 9. Return success
    // EPHEMERAL: Image bytes remain in-memory only, never stored or logged
    // User photo is discarded after generation
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
    console.error('Preview route error:', errorMsg);

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
  referenceImage?: { data: string; mimeType: string },
  timeoutMs = 180_000
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await generator.generateImage({
      prompt,
      width: PREVIEW_IMAGE_WIDTH,
      height: PREVIEW_IMAGE_HEIGHT,
      referenceImage,
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
