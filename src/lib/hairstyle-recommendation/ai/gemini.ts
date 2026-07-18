/**
 * Gemini Hairstyle Provider Adapter
 *
 * Thin adapter that uses GeminiClient (from lib/ai) and applies domain-specific logic.
 * Prompts, filtering, and validation are hairstyle-specific.
 * Low-level SDK interaction is isolated to lib/ai/gemini.ts.
 */

import { z } from 'zod';
import type {
  FaceAnalysis,
  HairstyleAI,
  HairstyleLibraryEntry,
  ProviderRecommendation,
  RecommendInput,
} from '../types';
import { buildAnalyzePrompt, buildRecommendPrompt } from '../prompt';
import {
  FaceAnalysisSchema,
  coerceProviderRecommendations,
} from '../schema';
import { AiError } from '../../ai/types';
import { GeminiClient } from '../../ai/gemini';

/**
 * GeminiProvider implements the HairstyleAI port interface.
 * Uses GeminiClient for structured JSON generation.
 *
 * @throws AiError with code 'AI_UNAVAILABLE' if key is missing or API calls fail
 * @throws AiError with code 'NO_FACE_DETECTED' if analysis fails validation
 */
export class GeminiProvider implements HairstyleAI {
  private client: GeminiClient;

  constructor(client?: GeminiClient) {
    this.client = client || new GeminiClient();
  }

  async analyzeFace(
    image: { data: string; mimeType: string },
    locale: 'ko' | 'en'
  ): Promise<FaceAnalysis> {
    try {
      const prompt = buildAnalyzePrompt(locale);

      const analysis = await this.client.generateJson({
        prompt,
        image: {
          data: image.data,
          mimeType: image.mimeType as
            | 'image/png'
            | 'image/jpeg'
            | 'image/webp',
        },
        schema: FaceAnalysisSchema,
        maxRetries: 1,
      });

      return analysis;
    } catch (error) {
      if (error instanceof AiError) {
        // If it looks like an image processing issue, map to NO_FACE_DETECTED
        if (error.message.toLowerCase().includes('face')) {
          throw new AiError('NO_FACE_DETECTED', error.message);
        }
        throw error;
      }

      throw new AiError(
        'AI_UNAVAILABLE',
        `Gemini provider error: ${error instanceof Error ? error.message : 'unknown'}`
      );
    }
  }

  async recommend(
    input: RecommendInput,
    candidates: HairstyleLibraryEntry[]
  ): Promise<ProviderRecommendation[]> {
    try {
      const prompt = buildRecommendPrompt(input, candidates, input.locale);

      // Accept whatever JSON the model produced; the domain coercer tolerates
      // bare arrays, `{ recommendations }` wrappers, and single objects, clamps
      // length overruns, and drops malformed/hallucinated items (route backfills)
      const raw = await this.client.generateJson({
        prompt,
        schema: z.unknown(),
        maxRetries: 1,
      });

      return coerceProviderRecommendations(
        raw,
        candidates.map((c) => c.id)
      );
    } catch (error) {
      if (error instanceof AiError) {
        throw error;
      }

      throw new AiError(
        'AI_UNAVAILABLE',
        `Gemini provider error: ${error instanceof Error ? error.message : 'unknown'}`
      );
    }
  }
}
