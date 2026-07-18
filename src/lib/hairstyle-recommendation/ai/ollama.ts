/**
 * Ollama Hairstyle Provider Adapter
 *
 * Thin adapter that uses OllamaClient (from lib/ai) and applies domain-specific logic.
 * Implements the HairstyleAI port interface with Ollama backend.
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
import { OllamaClient } from '../../ai/ollama';

/**
 * OllamaProvider implements the HairstyleAI port interface using Ollama.
 * Uses OllamaClient for structured JSON generation via /api/chat endpoint.
 *
 * @throws AiError with code 'AI_UNAVAILABLE' if Ollama is unreachable or API calls fail
 * @throws AiError with code 'NO_FACE_DETECTED' if vision analysis fails
 */
export class OllamaProvider implements HairstyleAI {
  private client: OllamaClient;

  constructor(client?: OllamaClient) {
    this.client = client || new OllamaClient();
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
        // Map validation errors to NO_FACE_DETECTED for image-related failures
        if (error.code === 'VALIDATION_ERROR') {
          throw new AiError(
            'NO_FACE_DETECTED',
            'Failed to analyze face from image'
          );
        }
        throw error;
      }

      throw new AiError(
        'AI_UNAVAILABLE',
        `Ollama provider error: ${error instanceof Error ? error.message : 'unknown'}`
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
        `Ollama provider error: ${error instanceof Error ? error.message : 'unknown'}`
      );
    }
  }
}
