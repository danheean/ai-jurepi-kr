/**
 * Gemini Implementation of ImageGenerator
 *
 * Uses Google Gemini 2.5 Flash (image-capable variant) for text-to-image generation.
 * Supports optional reference images for "edit" mode (face-preserving hairstyle preview).
 * Pure fetch API — no SDK dependency. CRITICAL: Never logs image data.
 */

import type { ImageGenerator } from './types';
import { AiError } from './types';
import { getGeminiApiKey, getGeminiImageModel } from './env';

interface GenerateContentRequest {
  contents: Array<{
    parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    >;
  }>;
}

interface GenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

/**
 * GeminiImageClient implements ImageGenerator.
 * Manages API key at construction time and handles plain-fetch REST calls.
 */
export class GeminiImageClient implements ImageGenerator {
  private apiKey: string;
  private model: string;
  private readonly timeoutMs: number;

  readonly supportsImageEdit = true;

  constructor(apiKey?: string, model?: string, timeoutMs?: number) {
    const key = apiKey || getGeminiApiKey();

    if (!key) {
      throw new AiError('AI_UNAVAILABLE', 'Missing GEMINI_API_KEY');
    }

    this.apiKey = key;
    this.model = model || getGeminiImageModel();
    this.timeoutMs = timeoutMs ?? 120_000; // 120s default
  }

  async generateImage(req: {
    prompt: string;
    width?: number;
    height?: number;
    seed?: number;
    referenceImage?: { data: string; mimeType: string };
  }): Promise<{ data: string; mimeType: 'image/png' | 'image/jpeg' }> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      const parts: GenerateContentRequest['contents'][0]['parts'] = [];

      if (req.referenceImage) {
        const imageData = req.referenceImage.data.startsWith('data:')
          ? req.referenceImage.data.split(',')[1]
          : req.referenceImage.data;

        parts.push({
          inlineData: {
            mimeType: req.referenceImage.mimeType,
            data: imageData,
          },
        });
      }

      parts.push({ text: req.prompt });

      const body: GenerateContentRequest = {
        contents: [{ parts }],
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: abortController.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AiError(
          'AI_UNAVAILABLE',
          `Gemini image generation error: ${response.status}`
        );
      }

      const data: GenerateContentResponse = await response.json();
      const imagePart = data.candidates?.[0]?.content?.parts?.find(
        (p) => 'inlineData' in p && p.inlineData
      );

      if (!imagePart || !('inlineData' in imagePart) || !imagePart.inlineData) {
        throw new AiError(
          'AI_UNAVAILABLE',
          'No image data in Gemini response'
        );
      }

      const { mimeType: responseMimeType, data: imageData } = imagePart.inlineData;

      return {
        data: imageData,
        mimeType: this.clampMimeType(responseMimeType),
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof AiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AiError(
          'AI_UNAVAILABLE',
          `Gemini image generation timeout (${this.timeoutMs}ms)`
        );
      }
      throw new AiError(
        'AI_UNAVAILABLE',
        `Gemini image generation failed: ${err instanceof Error ? err.message : 'unknown'}`
      );
    }
  }

  /**
   * Clamp mimeType to allowed values. Unknown types default to 'image/png'.
   */
  private clampMimeType(
    mimeType: string
  ): 'image/png' | 'image/jpeg' {
    if (mimeType === 'image/jpeg') return 'image/jpeg';
    return 'image/png';
  }
}
