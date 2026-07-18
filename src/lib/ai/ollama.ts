/**
 * Ollama Implementation of StructuredModel & ImageGenerator
 *
 * Assumes Ollama 0.32.1+ with:
 * - /api/chat endpoint for structured output (format: json_schema)
 * - /v1/images/generations endpoint for image generation (OpenAI compat)
 * Pure fetch API, no SDK dependency.
 */

import { z } from 'zod';
import type { StructuredModel, ImageGenerator } from './types';
import { AiError } from './types';
import { retryJsonExtraction } from './guardrails';
import {
  getOllamaBaseUrl,
  getOllamaVisionModel,
  getOllamaTextModel,
  getOllamaImageModel,
} from './env';

/**
 * OllamaClient implements both StructuredModel and ImageGenerator.
 * Uses pure fetch API for all calls.
 */
export class OllamaClient implements StructuredModel, ImageGenerator {
  private baseUrl: string;
  private visionModel: string;
  private textModel: string;
  private imageModel: string;
  private chatTimeoutMs: number;
  private imageTimeoutMs: number;

  readonly supportsImageEdit = false; // No reference-image support yet

  constructor(
    baseUrl?: string,
    visionModel?: string,
    textModel?: string,
    imageModel?: string,
    // Local models: thinking-model chat + cold loads need generous ceilings
    chatTimeoutMs: number = 120_000,
    imageTimeoutMs: number = 180_000
  ) {
    this.baseUrl = baseUrl || getOllamaBaseUrl();
    this.visionModel = visionModel || getOllamaVisionModel();
    this.textModel = textModel || getOllamaTextModel();
    this.imageModel = imageModel || getOllamaImageModel();
    this.chatTimeoutMs = chatTimeoutMs;
    this.imageTimeoutMs = imageTimeoutMs;
  }

  async generateJson<T extends z.ZodType>(req: {
    prompt: string;
    image?: { data: string; mimeType: 'image/png' | 'image/jpeg' | 'image/webp' };
    schema: T;
    maxRetries?: number;
  }): Promise<z.infer<T>> {
    const maxRetries = req.maxRetries ?? 1;
    const model = req.image ? this.visionModel : this.textModel;

    return retryJsonExtraction(
      async () => {
        const messages: any[] = [];

        if (req.image) {
          // Vision: encode image in message
          const imageData = req.image.data.startsWith('data:')
            ? req.image.data.split(',')[1]
            : req.image.data;

          messages.push({
            role: 'user',
            content: req.prompt,
            images: [imageData],
          });
        } else {
          messages.push({
            role: 'user',
            content: req.prompt,
          });
        }

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), this.chatTimeoutMs);

        try {
          const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages,
              stream: false,
              // Vision models (qwen3-vl) return EMPTY content under constrained
              // decoding ('json'/schema format) — rely on the prompt-instructed
              // JSON + guardrails for vision; keep 'json' mode for text models
              ...(req.image ? {} : { format: 'json' }),
              // Structured output needs no reasoning tokens; accepted by both
              // thinking (qwen3.5) and non-thinking (gemma3) models on Ollama 0.32+
              think: false,
              // Cap the context window: some models (qwen3.5) otherwise load at
              // their native max (256K), tripling latency and doubling memory
              options: { num_ctx: 8192, temperature: 0.4 },
            }),
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new AiError(
              'AI_UNAVAILABLE',
              `Ollama error: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          return data.message?.content || '';
        } catch (err) {
          clearTimeout(timeoutId);
          if (err instanceof AiError) throw err;
          if (err instanceof Error && err.name === 'AbortError') {
            throw new AiError(
              'AI_UNAVAILABLE',
              `Ollama request timeout (${this.chatTimeoutMs}ms)`
            );
          }
          throw err;
        }
      },
      req.schema,
      maxRetries
    );
  }

  async generateImage(req: {
    prompt: string;
    width?: number;
    height?: number;
    seed?: number;
    referenceImage?: { data: string; mimeType: string };
  }): Promise<{ data: string; mimeType: 'image/png' | 'image/jpeg' }> {
    const width = Math.min(req.width ?? 512, 1024);
    const height = Math.min(req.height ?? 512, 1024);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.imageTimeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v1/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.imageModel,
          prompt: req.prompt,
          size: `${width}x${height}`,
          ...(req.seed && { seed: req.seed }),
          n: 1,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AiError(
          'AI_UNAVAILABLE',
          `Ollama image generation error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const base64 = data.data?.[0]?.b64_json;

      if (!base64) {
        throw new AiError(
          'AI_UNAVAILABLE',
          'No image data in Ollama response'
        );
      }

      return { data: base64, mimeType: 'image/png' };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof AiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AiError(
          'AI_UNAVAILABLE',
          `Ollama image generation timeout (${this.imageTimeoutMs}ms)`
        );
      }
      throw new AiError(
        'AI_UNAVAILABLE',
        `Ollama image generation failed: ${err instanceof Error ? err.message : 'unknown'}`
      );
    }
  }
}
