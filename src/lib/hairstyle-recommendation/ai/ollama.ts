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
  ProviderRecommendationSchema,
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

      // Get array of recommendations from the model
      const arraySchema = z.array(ProviderRecommendationSchema);

      let recommendations: ProviderRecommendation[];

      try {
        recommendations = await this.client.generateJson({
          prompt,
          schema: arraySchema,
          maxRetries: 1,
        });
      } catch (error) {
        // If parsing as array fails, try parsing as single object and wrap it
        if (error instanceof AiError && error.code === 'VALIDATION_ERROR') {
          const singleSchema = ProviderRecommendationSchema;
          const single = await this.client.generateJson({
            prompt,
            schema: singleSchema,
            maxRetries: 0,
          });
          recommendations = [single];
        } else {
          throw error;
        }
      }

      // Validate and filter recommendations
      const validRecs: ProviderRecommendation[] = [];
      const candidateIds = candidates.map((c) => c.id);

      for (const rec of recommendations) {
        try {
          // Clamp tips BEFORE validation to handle model over-generation
          if (rec && Array.isArray(rec.tips) && rec.tips.length > 3) {
            rec.tips = rec.tips.slice(0, 3);
          }

          // Validate constraints
          const validated = ProviderRecommendationSchema.parse(rec);

          // Guardrail: only allow hairstyleIds that exist in candidates
          if (!candidateIds.includes(validated.hairstyleId)) {
            continue; // Skip hallucinated IDs silently
          }

          validRecs.push(validated);
        } catch (error) {
          // If it's a zod validation error from constraint violations,
          // throw to alert that the model is returning invalid data
          if (error instanceof z.ZodError) {
            const hasConstraintViolations = error.issues.some(
              (issue) => issue.code === 'too_big' || issue.code === 'too_small'
            );
            if (hasConstraintViolations) {
              throw new AiError(
                'AI_UNAVAILABLE',
                `Model returned recommendations violating constraints: ${error.message}`
              );
            }
          }
          // For other validation errors (missing fields, type errors), skip silently
          continue;
        }
      }

      return validRecs;
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
