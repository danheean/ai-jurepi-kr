/**
 * Gemini AI Provider Implementation
 *
 * SERVER-ONLY: This file imports the @google/generative-ai SDK.
 * It is the ONLY place the Gemini SDK is imported.
 * Route handlers and UI never import directly; they use HairstyleAI.
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { z } from 'zod';
import type {
  FaceAnalysis,
  HairstyleAI,
  HairstyleLibraryEntry,
  ProviderRecommendation,
  RecommendInput,
} from '../types';
import { buildAnalyzePrompt, buildRecommendPrompt } from '../prompt';
import { AiError } from './errors';
import {
  FaceAnalysisSchema,
  ProviderRecommendationSchema,
} from '../schema';

/**
 * GeminiProvider implements the HairstyleAI port interface.
 * Uses Google Gemini 2.5 Flash with structured JSON output.
 *
 * @throws AiError with code 'AI_UNAVAILABLE' if key is missing or API calls fail
 * @throws AiError with code 'NO_FACE_DETECTED' if analysis fails validation
 */
export class GeminiProvider implements HairstyleAI {
  private client: GoogleGenerativeAI;
  private model = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new AiError('AI_UNAVAILABLE', 'Missing GEMINI_API_KEY');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async analyzeFace(
    image: { data: string; mimeType: string },
    locale: 'ko' | 'en'
  ): Promise<FaceAnalysis> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      const prompt = buildAnalyzePrompt(locale);

      // Prepare the image part: assume data is already base64 (no data:// prefix)
      const imageData =
        image.data.startsWith('data:') ? image.data.split(',')[1] : image.data;

      const request = {
        contents: [
          {
            role: 'user' as const,
            parts: [
              {
                inlineData: {
                  mimeType: image.mimeType as
                    | 'image/png'
                    | 'image/jpeg'
                    | 'image/webp',
                  data: imageData,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Low temperature for consistent analysis
          responseMimeType: 'application/json',
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      };

      let response = await model.generateContent(request);

      // Handle response format and attempt one repair if needed
      let jsonText = this.extractJsonFromResponse(response);

      if (!jsonText) {
        // Attempt one retry
        response = await model.generateContent(request);
        jsonText = this.extractJsonFromResponse(response);
      }

      if (!jsonText) {
        throw new AiError(
          'AI_UNAVAILABLE',
          'Failed to extract JSON from provider response'
        );
      }

      // Parse and validate
      const parsed = JSON.parse(jsonText);
      const validated = FaceAnalysisSchema.parse(parsed);

      return validated;
    } catch (error) {
      if (error instanceof AiError) {
        throw error;
      }

      if (error instanceof Error && error.message.includes('invalid_request')) {
        throw new AiError('NO_FACE_DETECTED', 'Invalid or unprocessable image');
      }

      // Generic provider/network failure
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
      const model = this.client.getGenerativeModel({ model: this.model });

      const prompt = buildRecommendPrompt(input, candidates, input.locale);

      const request = {
        contents: [
          {
            role: 'user' as const,
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.6, // Moderate temperature for variety in recommendations
          responseMimeType: 'application/json',
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      };

      let response = await model.generateContent(request);

      // Extract JSON from response
      let jsonText = this.extractJsonFromResponse(response);

      if (!jsonText) {
        // Attempt one retry
        response = await model.generateContent(request);
        jsonText = this.extractJsonFromResponse(response);
      }

      if (!jsonText) {
        throw new AiError(
          'AI_UNAVAILABLE',
          'Failed to extract JSON from provider response'
        );
      }

      // Parse and validate array of recommendations
      const parsed = JSON.parse(jsonText);
      const rawRecs = Array.isArray(parsed) ? parsed : [parsed];

      // Validate each recommendation individually
      const validRecs: ProviderRecommendation[] = [];
      for (const rec of rawRecs) {
        try {
          // Clamp tips BEFORE validation to handle model over-generation
          if (rec && Array.isArray(rec.tips) && rec.tips.length > 3) {
            rec.tips = rec.tips.slice(0, 3);
          }

          const validated = ProviderRecommendationSchema.parse(rec);

          // Guardrail: only allow hairstyleIds that exist in candidates
          const candidateIds = candidates.map((c) => c.id);
          if (!candidateIds.includes(validated.hairstyleId)) {
            continue; // Skip hallucinated IDs silently
          }

          validRecs.push(validated);
        } catch (error) {
          // If it's a zod validation error from constraint violations (not missing fields),
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

      // Generic provider/network failure
      throw new AiError(
        'AI_UNAVAILABLE',
        `Gemini provider error: ${error instanceof Error ? error.message : 'unknown'}`
      );
    }
  }

  /**
   * Extract JSON from Gemini response.
   * Handles both text() and raw JSON responses.
   */
  private extractJsonFromResponse(response: any): string | null {
    try {
      if (!response || !response.response) {
        return null;
      }

      // Try to get text content
      const text = response.response.text();
      if (text) {
        // Remove markdown code blocks if present
        const cleaned = text
          .replace(/^```json\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
        return cleaned;
      }

      return null;
    } catch {
      return null;
    }
  }
}
