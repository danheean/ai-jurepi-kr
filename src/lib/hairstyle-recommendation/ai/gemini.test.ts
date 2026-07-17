/**
 * GeminiProvider Tests (Mocked SDK)
 *
 * These tests mock the @google/generative-ai SDK entirely.
 * NO real API calls are made.
 * Coverage:
 * - Valid analyze JSON → FaceAnalysis (pass)
 * - Valid recommend JSON → ProviderRecommendation[] (pass)
 * - Broken JSON → retry → still broken → throws AiError
 * - Recommend with invalid hairstyleId → filtered out
 * - Missing API key → AiError('AI_UNAVAILABLE')
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock must be declared at module level before any imports of the mocked module
const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: () => ({
      generateContent: mockGenerateContent,
    }),
  })),
  HarmCategory: {
    HARM_CATEGORY_UNSPECIFIED: 'HARM_CATEGORY_UNSPECIFIED',
  },
  HarmBlockThreshold: {
    BLOCK_NONE: 'BLOCK_NONE',
  },
}));

// Import after mocking
import { GeminiProvider } from './gemini';
import { AiError } from './errors';
import type {
  HairstyleLibraryEntry,
  RecommendInput,
} from '../types';

describe('GeminiProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockClear();
    mockGenerateContent.mockReset();
  });

  describe('analyzeFace', () => {
    it('returns valid FaceAnalysis on successful JSON response', async () => {
      const validJson = JSON.stringify({
        faceShape: 'oval',
        confidence: 0.92,
        features: ['strong jawline', 'high forehead'],
        notes: 'Clear, front-facing photo.',
      });

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => validJson,
        },
      });

      const provider = new GeminiProvider('test-key');
      const result = await provider.analyzeFace(
        { data: 'base64imagedata', mimeType: 'image/jpeg' },
        'en'
      );

      expect(result).toMatchObject({
        faceShape: 'oval',
        confidence: 0.92,
        features: ['strong jawline', 'high forehead'],
        notes: 'Clear, front-facing photo.',
      });
    });

    it('handles markdown-wrapped JSON response', async () => {
      const wrappedJson = `\`\`\`json
{
  "faceShape": "round",
  "confidence": 0.85,
  "features": ["full cheeks"],
  "notes": "Round face shape detected"
}
\`\`\``;

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => wrappedJson,
        },
      });

      const provider = new GeminiProvider('test-key');
      const result = await provider.analyzeFace(
        { data: 'base64imagedata', mimeType: 'image/png' },
        'ko'
      );

      expect(result.faceShape).toBe('round');
      expect(result.confidence).toBe(0.85);
    });

    it('throws AiError on missing API key', () => {
      expect(() => new GeminiProvider('')).toThrow(AiError);
    });

    it('throws AiError on failed JSON parsing after retry', async () => {
      mockGenerateContent
        .mockResolvedValueOnce({
          response: { text: () => '{invalid json' },
        })
        .mockResolvedValueOnce({
          response: { text: () => '{still invalid' },
        });

      const provider = new GeminiProvider('test-key');

      await expect(
        provider.analyzeFace(
          { data: 'base64imagedata', mimeType: 'image/jpeg' },
          'en'
        )
      ).rejects.toThrow(AiError);
    });

    it('validates faceShape enum constraint', async () => {
      const invalidJson = JSON.stringify({
        faceShape: 'invalid-shape', // Not in enum
        confidence: 0.5,
        features: [],
      });

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => invalidJson,
        },
      });

      const provider = new GeminiProvider('test-key');

      await expect(
        provider.analyzeFace(
          { data: 'base64imagedata', mimeType: 'image/jpeg' },
          'en'
        )
      ).rejects.toThrow();
    });

    it('validates confidence is in [0, 1]', async () => {
      const invalidJson = JSON.stringify({
        faceShape: 'oval',
        confidence: 1.5, // Out of range
        features: [],
      });

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => invalidJson,
        },
      });

      const provider = new GeminiProvider('test-key');

      await expect(
        provider.analyzeFace(
          { data: 'base64imagedata', mimeType: 'image/jpeg' },
          'en'
        )
      ).rejects.toThrow();
    });
  });

  describe('recommend', () => {
    const candidateLibrary: HairstyleLibraryEntry[] = [
      {
        id: 'soft-layered-bob',
        name: { ko: '부드러운 레이어드 밥', en: 'Soft Layered Bob' },
        suitableFaceShapes: ['oval', 'round', 'square'],
        preference: 'feminine',
        length: 'short',
        hairType: ['straight', 'wavy'],
        image: {
          src: '/hairstyles/soft-layered-bob/feminine.webp',
          alt: 'Soft layered bob cut',
          credit: 'Photographer Name',
          license: 'CC-BY-4.0',
        },
        tags: ['volume', 'low-maintenance'],
      },
      {
        id: 'straight-long-cut',
        name: { ko: '스트레이트 롱 컷', en: 'Straight Long Cut' },
        suitableFaceShapes: ['oval', 'heart'],
        preference: 'neutral',
        length: 'long',
        hairType: ['straight'],
        image: {
          src: '/hairstyles/straight-long-cut/neutral.webp',
          alt: 'Long straight cut',
          credit: 'Photographer Name',
          license: 'CC-BY-4.0',
        },
        tags: ['elegant', 'versatile'],
      },
      {
        id: 'pixie-cut',
        name: { ko: '픽시 컷', en: 'Pixie Cut' },
        suitableFaceShapes: ['oval', 'square', 'heart'],
        preference: 'masculine',
        length: 'short',
        hairType: ['straight', 'wavy'],
        image: {
          src: '/hairstyles/pixie-cut/masculine.webp',
          alt: 'Short pixie cut',
          credit: 'Photographer Name',
          license: 'CC-BY-4.0',
        },
        tags: ['bold', 'trendy'],
      },
    ];

    it('returns valid ProviderRecommendation[] on successful JSON', async () => {
      const validJson = JSON.stringify([
        {
          hairstyleId: 'soft-layered-bob',
          reason: 'This style suits your face shape perfectly.',
          tips: ['Apply texture spray', 'Trim every 6 weeks'],
        },
        {
          hairstyleId: 'straight-long-cut',
          reason: 'Elongates the face beautifully.',
          tips: ['Deep condition weekly', 'Use heat protectant'],
        },
      ]);

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => validJson,
        },
      });

      const provider = new GeminiProvider('test-key');
      const input: RecommendInput = {
        faceShape: 'oval',
        preference: 'feminine',
        length: 'short',
        occasion: 'daily',
        locale: 'en',
      };

      const result = await provider.recommend(input, candidateLibrary);

      expect(result).toHaveLength(2);
      expect(result[0].hairstyleId).toBe('soft-layered-bob');
      expect(result[0].reason).toBe('This style suits your face shape perfectly.');
      expect(result[0].tips).toHaveLength(2);
    });

    it('filters out hairstyleIds not in candidates', async () => {
      const jsonWithInvalidId = JSON.stringify([
        {
          hairstyleId: 'soft-layered-bob', // Valid
          reason: 'Great choice.',
          tips: ['Tip 1'],
        },
        {
          hairstyleId: 'hallucinated-style', // NOT in candidates
          reason: 'This is made up.',
          tips: ['Tip 1'],
        },
        {
          hairstyleId: 'pixie-cut', // Valid
          reason: 'Bold and modern.',
          tips: ['Tip 1'],
        },
      ]);

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => jsonWithInvalidId,
        },
      });

      const provider = new GeminiProvider('test-key');
      const input: RecommendInput = {
        faceShape: 'square',
        preference: 'masculine',
        occasion: 'business',
        locale: 'en',
      };

      const result = await provider.recommend(input, candidateLibrary);

      // Only soft-layered-bob and pixie-cut should remain
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.hairstyleId)).toEqual([
        'soft-layered-bob',
        'pixie-cut',
      ]);
    });

    it('clamps tips array to max 3', async () => {
      const jsonWithManyTips = JSON.stringify([
        {
          hairstyleId: 'soft-layered-bob',
          reason: 'Good fit.',
          tips: [
            'Tip 1 (120 chars max)',
            'Tip 2 (120 chars max)',
            'Tip 3 (120 chars max)',
            'Tip 4 (should be removed)',
            'Tip 5 (should be removed)',
          ],
        },
      ]);

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => jsonWithManyTips,
        },
      });

      const provider = new GeminiProvider('test-key');
      const input: RecommendInput = {
        faceShape: 'oval',
        preference: 'feminine',
        occasion: 'daily',
        locale: 'en',
      };

      const result = await provider.recommend(input, candidateLibrary);

      expect(result[0].tips).toHaveLength(3);
    });

    it('skips invalid individual recommendations but keeps valid ones', async () => {
      const mixedJson = JSON.stringify([
        {
          hairstyleId: 'soft-layered-bob',
          reason: 'Good choice.',
          tips: ['Tip 1'],
        },
        {
          // Missing hairstyleId — should be skipped
          reason: 'Incomplete',
          tips: ['Tip'],
        },
        {
          hairstyleId: 'pixie-cut',
          reason: 'Bold style.',
          tips: ['Tip 1', 'Tip 2'],
        },
      ]);

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => mixedJson,
        },
      });

      const provider = new GeminiProvider('test-key');
      const input: RecommendInput = {
        faceShape: 'square',
        preference: 'neutral',
        occasion: 'daily',
        locale: 'en',
      };

      const result = await provider.recommend(input, candidateLibrary);

      // Only valid recommendations should remain
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.hairstyleId)).toEqual([
        'soft-layered-bob',
        'pixie-cut',
      ]);
    });

    it('handles markdown-wrapped JSON array', async () => {
      const wrappedJson = `\`\`\`json
[
  {
    "hairstyleId": "soft-layered-bob",
    "reason": "Perfect for your shape.",
    "tips": ["Tip 1"]
  }
]
\`\`\``;

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => wrappedJson,
        },
      });

      const provider = new GeminiProvider('test-key');
      const input: RecommendInput = {
        faceShape: 'oval',
        preference: 'feminine',
        occasion: 'daily',
        locale: 'en',
      };

      const result = await provider.recommend(input, candidateLibrary);

      expect(result).toHaveLength(1);
      expect(result[0].hairstyleId).toBe('soft-layered-bob');
    });

    it('throws AiError on JSON parse failure after retry', async () => {
      mockGenerateContent
        .mockResolvedValueOnce({
          response: { text: () => '{broken' },
        })
        .mockResolvedValueOnce({
          response: { text: () => '{still broken' },
        });

      const provider = new GeminiProvider('test-key');
      const input: RecommendInput = {
        faceShape: 'oval',
        preference: 'feminine',
        occasion: 'daily',
        locale: 'en',
      };

      await expect(provider.recommend(input, candidateLibrary)).rejects.toThrow(
        AiError
      );
    });

    it('validates reason length constraint', async () => {
      const jsonWithLongReason = JSON.stringify([
        {
          hairstyleId: 'soft-layered-bob',
          reason: 'x'.repeat(281), // Exceeds 280 char limit
          tips: ['Tip 1'],
        },
      ]);

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => jsonWithLongReason,
        },
      });

      const provider = new GeminiProvider('test-key');
      const input: RecommendInput = {
        faceShape: 'oval',
        preference: 'feminine',
        occasion: 'daily',
        locale: 'en',
      };

      await expect(provider.recommend(input, candidateLibrary)).rejects.toThrow();
    });

    it('validates tip length constraint', async () => {
      const jsonWithLongTip = JSON.stringify([
        {
          hairstyleId: 'soft-layered-bob',
          reason: 'Good style.',
          tips: ['x'.repeat(121)], // Exceeds 120 char limit
        },
      ]);

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => jsonWithLongTip,
        },
      });

      const provider = new GeminiProvider('test-key');
      const input: RecommendInput = {
        faceShape: 'oval',
        preference: 'feminine',
        occasion: 'daily',
        locale: 'en',
      };

      await expect(provider.recommend(input, candidateLibrary)).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('converts empty response to AI_UNAVAILABLE', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => null,
        },
      });

      const provider = new GeminiProvider('test-key');

      await expect(
        provider.analyzeFace(
          { data: 'base64imagedata', mimeType: 'image/jpeg' },
          'en'
        )
      ).rejects.toThrow(AiError);
    });
  });
});
