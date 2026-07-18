/**
 * Gemini Implementation of StructuredModel
 *
 * Uses Google Gemini 2.5 Flash with structured JSON output and vision support.
 * SDK import is confined to this file only.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import type { StructuredModel } from './types';
import { AiError } from './types';
import { retryJsonExtraction } from './guardrails';
import { getGeminiApiKey, getGeminiModel } from './env';

/**
 * GeminiClient implements StructuredModel.
 * Manages API key at construction time and delegates JSON extraction to guardrails.
 */
export class GeminiClient implements StructuredModel {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey?: string) {
    const key = apiKey || getGeminiApiKey();

    if (!key) {
      throw new AiError('AI_UNAVAILABLE', 'Missing GEMINI_API_KEY');
    }

    this.client = new GoogleGenerativeAI(key);
    this.model = getGeminiModel();
  }

  async generateJson<T extends z.ZodType>(req: {
    prompt: string;
    image?: { data: string; mimeType: 'image/png' | 'image/jpeg' | 'image/webp' };
    schema: T;
    maxRetries?: number;
  }): Promise<z.infer<T>> {
    const maxRetries = req.maxRetries ?? 1;

    return retryJsonExtraction(
      async () => {
        const model = this.client.getGenerativeModel({ model: this.model });

        const parts: any[] = [];

        // Add image if provided (vision)
        if (req.image) {
          const imageData = req.image.data.startsWith('data:')
            ? req.image.data.split(',')[1]
            : req.image.data;

          parts.push({
            inlineData: {
              mimeType: req.image.mimeType as
                | 'image/png'
                | 'image/jpeg'
                | 'image/webp',
              data: imageData,
            },
          });
        }

        // Add text prompt
        parts.push({ text: req.prompt });

        const response = await model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });

        return response.response.text();
      },
      req.schema,
      maxRetries
    );
  }
}
