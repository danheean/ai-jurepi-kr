/**
 * GeminiProvider Tests (Mocked GeminiClient)
 *
 * Tests the adapter layer that implements HairstyleAI.
 * Mocks GeminiClient, not the SDK.
 * Coverage:
 * - Valid analyze JSON → FaceAnalysis (pass)
 * - Valid recommend JSON → ProviderRecommendation[] (pass)
 * - Recommend with invalid hairstyleId → filtered out
 * - Recommend with constraint violations → throws AiError
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock module first, before imports
const mockGenerateJson = vi.fn();
vi.mock('../../ai/gemini.ts', () => ({
  GeminiClient: vi.fn(function(this: any) {
    this.generateJson = mockGenerateJson;
  }),
}));

// Import after mock
import { GeminiProvider } from './gemini';
import { AiError } from '../../ai/types';
import type {
  HairstyleLibraryEntry,
  RecommendInput,
} from '../types';

describe('GeminiProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateJson.mockClear();
  });

  describe('analyzeFace', () => {
    it('returns valid FaceAnalysis on successful JSON response', async () => {
      const validAnalysis = {
        faceShape: 'oval' as const,
        confidence: 0.92,
        features: ['strong jawline', 'high forehead'],
        notes: 'Clear, front-facing photo.',
      };

      mockGenerateJson.mockResolvedValueOnce(validAnalysis);

      const provider = new GeminiProvider();
      const result = await provider.analyzeFace(
        { data: 'base64imagedata', mimeType: 'image/jpeg' },
        'en'
      );

      expect(result).toMatchObject(validAnalysis);
      expect(mockGenerateJson).toHaveBeenCalledWith(
        expect.objectContaining({
          image: expect.objectContaining({
            data: 'base64imagedata',
          }),
          responseSchema: expect.objectContaining({ type: 'object' }),
          maxRetries: 1,
        })
      );
    });

    it('throws NO_FACE_DETECTED for face-related errors', async () => {
      mockGenerateJson.mockRejectedValueOnce(
        new AiError('AI_UNAVAILABLE', 'Failed to detect face in image')
      );

      const provider = new GeminiProvider();
      try {
        await provider.analyzeFace(
          { data: 'base64imagedata', mimeType: 'image/jpeg' },
          'en'
        );
        expect.fail('Should have thrown');
      } catch (err) {
        if (err instanceof AiError) {
          expect(err.code).toBe('NO_FACE_DETECTED');
        }
      }
    });

    it('handles data: URL prefix in image data', async () => {
      const validAnalysis = {
        faceShape: 'round' as const,
        confidence: 0.85,
        features: ['round face'],
      };

      mockGenerateJson.mockResolvedValueOnce(validAnalysis);

      const provider = new GeminiProvider();
      await provider.analyzeFace(
        { data: 'data:image/jpeg;base64,abc123', mimeType: 'image/jpeg' },
        'ko'
      );

      expect(mockGenerateJson).toHaveBeenCalledWith(
        expect.objectContaining({
          image: expect.objectContaining({
            data: 'data:image/jpeg;base64,abc123', // Passed as-is, GeminiClient handles stripping
          }),
        })
      );
    });
  });

  describe('recommend', () => {
    const candidates: HairstyleLibraryEntry[] = [
      {
        id: 'bob-classic',
        name: { ko: '클래식 밥', en: 'Classic Bob' },
        suitableFaceShapes: ['oval', 'round'],
        genders: ['female'],
        preference: 'feminine',
        length: 'short',
        hairType: ['straight', 'wavy'],
        image: {
          src: '/hairstyles/bob-classic/feminine.webp',
          alt: 'Bob',
          credit: 'Credit',
          license: 'CC-BY',
        },
        tags: ['volume', 'low-maintenance'],
      },
      {
        id: 'layered-long',
        name: { ko: '레이어드 롱', en: 'Layered Long' },
        suitableFaceShapes: ['oval'],
        genders: ['female'],
        preference: 'neutral' as const,
        length: 'long',
        hairType: ['wavy', 'curly'],
        image: {
          src: '/hairstyles/layered-long/neutral.webp',
          alt: 'Layered',
          credit: 'Credit',
          license: 'CC-BY',
        },
        tags: ['texture', 'movement'],
      },
    ];

    const input: RecommendInput = {
      faceShape: 'oval',
      preference: 'feminine',
      occasion: 'daily',
      locale: 'en',
    };

    it('returns valid recommendations as array', async () => {
      const recs = [
        {
          hairstyleId: 'bob-classic',
          reason: 'Classic bob suits oval faces well.',
          tips: ['Wash every other day', 'Use styling cream for texture'],
        },
        {
          hairstyleId: 'layered-long',
          reason: 'Layered cut adds movement.',
          tips: ['Deep condition weekly'],
        },
      ];

      mockGenerateJson.mockResolvedValueOnce(recs);

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].hairstyleId).toBe('bob-classic');
    });

    it('handles single recommendation response and wraps it', async () => {
      // Model returned a single object instead of an array — coercer wraps it
      mockGenerateJson.mockResolvedValueOnce({
        hairstyleId: 'bob-classic',
        reason: 'Classic bob.',
        tips: ['Wash regularly'],
      });

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].hairstyleId).toBe('bob-classic');
      expect(mockGenerateJson).toHaveBeenCalledTimes(1);
    });

    it('unwraps a { recommendations: [...] } wrapper object', async () => {
      mockGenerateJson.mockResolvedValueOnce({
        recommendations: [
          {
            hairstyleId: 'bob-classic',
            reason: 'Classic bob.',
            tips: ['Wash regularly'],
          },
        ],
      });

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].hairstyleId).toBe('bob-classic');
    });

    it('filters out hallucinated hairstyleIds', async () => {
      const recs = [
        {
          hairstyleId: 'bob-classic',
          reason: 'Classic bob.',
          tips: ['Tip 1'],
        },
        {
          hairstyleId: 'non-existent-hairstyle',
          reason: 'This ID does not exist in catalog.',
          tips: ['Tip 1'],
        },
        {
          hairstyleId: 'layered-long',
          reason: 'Layered cut.',
          tips: ['Tip 1'],
        },
      ];

      mockGenerateJson.mockResolvedValueOnce(recs);

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations.map((r) => r.hairstyleId)).toEqual([
        'bob-classic',
        'layered-long',
      ]);
    });

    it('clamps tips to max 3 before validation', async () => {
      const recs = [
        {
          hairstyleId: 'bob-classic',
          reason: 'Classic bob.',
          tips: ['Tip 1', 'Tip 2', 'Tip 3', 'Tip 4', 'Tip 5'], // Over limit
        },
      ];

      mockGenerateJson.mockResolvedValueOnce(recs);

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].tips).toHaveLength(3);
    });

    it('clamps an over-length reason instead of failing the request', async () => {
      const recs = [
        {
          hairstyleId: 'bob-classic',
          reason: 'A'.repeat(300), // Exceeds max(280) — guardrail caps, not rejects
          tips: ['Tip 1'],
        },
      ];

      mockGenerateJson.mockResolvedValueOnce(recs);

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].reason).toHaveLength(280);
    });

    it('skips invalid recommendations silently', async () => {
      const recs = [
        {
          hairstyleId: 'bob-classic',
          reason: 'Classic bob.',
          tips: ['Tip 1'],
        },
        {
          // Invalid: missing required field
          hairstyleId: 'layered-long',
          // reason missing
          tips: ['Tip 1'],
        },
      ];

      mockGenerateJson.mockResolvedValueOnce(recs);

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      // Only valid one is returned
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].hairstyleId).toBe('bob-classic');
    });

    it('returns an optional curation block when the model includes one', async () => {
      mockGenerateJson.mockResolvedValueOnce({
        recommendations: [
          { hairstyleId: 'bob-classic', reason: 'Classic bob.', tips: ['Tip 1'] },
        ],
        curation: {
          summary: 'These bob-length styles play up your jawline.',
          avoid: [{ label: 'Very long layers', reason: 'Can wash out an oval face.' }],
        },
      });

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      expect(result.curation).toEqual({
        summary: 'These bob-length styles play up your jawline.',
        avoid: [{ label: 'Very long layers', reason: 'Can wash out an oval face.' }],
      });
    });

    it('returns undefined curation when the model omits it', async () => {
      mockGenerateJson.mockResolvedValueOnce([
        { hairstyleId: 'bob-classic', reason: 'Classic bob.', tips: ['Tip 1'] },
      ]);

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      expect(result.curation).toBeUndefined();
      expect(result.recommendations).toHaveLength(1);
    });

    it('returns undefined curation (not an error) when curation is malformed', async () => {
      mockGenerateJson.mockResolvedValueOnce({
        recommendations: [
          { hairstyleId: 'bob-classic', reason: 'Classic bob.', tips: ['Tip 1'] },
        ],
        curation: { summary: 123, avoid: 'not-an-array' },
      });

      const provider = new GeminiProvider();
      const result = await provider.recommend(input, candidates);

      expect(result.curation).toBeUndefined();
      expect(result.recommendations).toHaveLength(1);
    });
  });
});
