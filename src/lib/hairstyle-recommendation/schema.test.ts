/**
 * Tests for Hairstyle Recommendation Schemas
 *
 * Validates that zod schemas enforce all SPEC constraints.
 */

import { describe, it, expect } from 'vitest';
import {
  FaceAnalysisSchema,
  RecommendInputSchema,
  RecommendationSchema,
  ProviderRecommendationSchema,
  AnalyzeRequestSchema,
  PreviewRequestSchema,
  parseAnalyzeRequest,
  parseRecommendRequest,
  validateProviderRecommendations,
} from './schema';

describe('FaceAnalysisSchema', () => {
  it('accepts valid face analysis', () => {
    const valid = {
      faceShape: 'oval',
      confidence: 0.85,
      features: ['symmetric', 'high-forehead'],
      notes: 'Clear face shape detected',
    };
    expect(FaceAnalysisSchema.parse(valid)).toEqual(valid);
  });

  it('rejects invalid faceShape', () => {
    expect(() =>
      FaceAnalysisSchema.parse({
        faceShape: 'invalid-shape',
        confidence: 0.85,
        features: [],
      })
    ).toThrow();
  });

  it('clamps confidence to 0–1', () => {
    expect(() =>
      FaceAnalysisSchema.parse({
        faceShape: 'oval',
        confidence: 1.5,
        features: [],
      })
    ).toThrow();

    expect(() =>
      FaceAnalysisSchema.parse({
        faceShape: 'oval',
        confidence: -0.1,
        features: [],
      })
    ).toThrow();
  });

  it('enforces max 5 features', () => {
    expect(() =>
      FaceAnalysisSchema.parse({
        faceShape: 'oval',
        confidence: 0.85,
        features: Array(6).fill('feature'),
      })
    ).toThrow();
  });

  it('allows optional notes', () => {
    const valid = {
      faceShape: 'round',
      confidence: 0.7,
      features: [],
    };
    const parsed = FaceAnalysisSchema.parse(valid);
    expect(parsed.notes).toBeUndefined();
  });
});

describe('RecommendInputSchema', () => {
  it('accepts minimal valid input', () => {
    const valid = {
      faceShape: 'square',
      locale: 'ko',
    };
    const parsed = RecommendInputSchema.parse(valid);
    expect(parsed.preference).toBe('neutral');
    expect(parsed.occasion).toBe('daily');
  });

  it('accepts full input with all attributes', () => {
    const valid = {
      faceShape: 'heart',
      preference: 'feminine',
      length: 'short',
      hairType: 'wavy',
      occasion: 'business',
      locale: 'en',
    };
    expect(RecommendInputSchema.parse(valid)).toEqual(valid);
  });

  it('rejects invalid preference', () => {
    expect(() =>
      RecommendInputSchema.parse({
        faceShape: 'oval',
        preference: 'invalid',
        locale: 'ko',
      })
    ).toThrow();
  });

  it('rejects invalid locale', () => {
    expect(() =>
      RecommendInputSchema.parse({
        faceShape: 'oval',
        locale: 'fr',
      })
    ).toThrow();
  });

  it('rejects missing faceShape', () => {
    expect(() =>
      RecommendInputSchema.parse({
        locale: 'ko',
      })
    ).toThrow();
  });
});

describe('RecommendationSchema', () => {
  it('accepts valid recommendation', () => {
    const valid = {
      hairstyleId: 'soft-bob',
      name: { ko: '소프트 밥', en: 'Soft Bob' },
      reason: 'Complements your face shape.',
      tips: ['Style with sea salt spray', 'Trim every 6 weeks'],
      referenceImage: {
        src: '/hairstyles/soft-bob/feminine.webp',
        alt: 'Soft bob hairstyle',
        credit: 'Photo by Jane Doe',
      },
      tags: ['feminine', 'low-maintenance'],
    };
    expect(RecommendationSchema.parse(valid)).toEqual(valid);
  });

  it('enforces max 280 chars for reason', () => {
    const invalid = {
      hairstyleId: 'soft-bob',
      name: { ko: '밥', en: 'Bob' },
      reason: 'x'.repeat(281),
      tips: ['tip'],
      referenceImage: {
        src: '/hairstyles/soft-bob.webp',
        alt: 'Bob',
        credit: 'Credit',
      },
      tags: [],
    };
    expect(() => RecommendationSchema.parse(invalid)).toThrow();
  });

  it('enforces 1–3 tips and max 120 chars each', () => {
    expect(() =>
      RecommendationSchema.parse({
        hairstyleId: 'bob',
        name: { ko: '밥', en: 'Bob' },
        reason: 'Good look',
        tips: [],
        referenceImage: {
          src: '/img.webp',
          alt: 'Bob',
          credit: 'Credit',
        },
        tags: [],
      })
    ).toThrow(); // 0 tips

    expect(() =>
      RecommendationSchema.parse({
        hairstyleId: 'bob',
        name: { ko: '밥', en: 'Bob' },
        reason: 'Good look',
        tips: ['tip1', 'tip2', 'tip3', 'tip4'],
        referenceImage: {
          src: '/img.webp',
          alt: 'Bob',
          credit: 'Credit',
        },
        tags: [],
      })
    ).toThrow(); // >3 tips

    expect(() =>
      RecommendationSchema.parse({
        hairstyleId: 'bob',
        name: { ko: '밥', en: 'Bob' },
        reason: 'Good look',
        tips: ['x'.repeat(121)],
        referenceImage: {
          src: '/img.webp',
          alt: 'Bob',
          credit: 'Credit',
        },
        tags: [],
      })
    ).toThrow(); // tip >120 chars
  });
});

describe('ProviderRecommendationSchema', () => {
  it('accepts valid provider output', () => {
    const valid = {
      hairstyleId: 'soft-bob',
      reason: 'Complements your face shape.',
      tips: ['Style with product', 'Trim regularly'],
    };
    expect(ProviderRecommendationSchema.parse(valid)).toEqual(valid);
  });

  it('validates as array', () => {
    const arr = [
      {
        hairstyleId: 'bob',
        reason: 'Nice look',
        tips: ['Tip 1'],
      },
      {
        hairstyleId: 'pixie',
        reason: 'Bold style',
        tips: ['Short cuts'],
      },
    ];
    expect(validateProviderRecommendations(arr)).toEqual(arr);
  });

  it('rejects hairstyleId that is not a string', () => {
    expect(() =>
      ProviderRecommendationSchema.parse({
        hairstyleId: 123,
        reason: 'Good look',
        tips: ['Tip'],
      })
    ).toThrow();
  });
});

describe('AnalyzeRequestSchema', () => {
  it('accepts valid analyze request', () => {
    const valid = {
      image: 'data:image/jpeg;base64,abcd1234',
      mimeType: 'image/jpeg',
      locale: 'ko',
    };
    expect(AnalyzeRequestSchema.parse(valid)).toEqual(valid);
  });

  it('rejects invalid MIME type', () => {
    expect(() =>
      AnalyzeRequestSchema.parse({
        image: 'data:image/heic;base64,abc',
        mimeType: 'image/heic',
        locale: 'ko',
      })
    ).toThrow();
  });

  it('accepts all allowed MIME types', () => {
    const types = ['image/png', 'image/jpeg', 'image/webp'];
    for (const mimeType of types) {
      const valid = {
        image: 'data:image;base64,abc',
        mimeType,
        locale: 'en',
      };
      expect(AnalyzeRequestSchema.parse(valid).mimeType).toBe(mimeType);
    }
  });
});

describe('parseAnalyzeRequest', () => {
  it('parses and validates', () => {
    const result = parseAnalyzeRequest({
      image: 'data:image/jpeg;base64,abc',
      mimeType: 'image/jpeg',
      locale: 'ko',
    });
    expect(result.mimeType).toBe('image/jpeg');
  });

  it('throws on invalid input', () => {
    expect(() =>
      parseAnalyzeRequest({
        image: 'data:image/heic;base64,abc',
        mimeType: 'image/heic',
        locale: 'ko',
      })
    ).toThrow();
  });
});

describe('parseRecommendRequest', () => {
  it('parses with defaults', () => {
    const result = parseRecommendRequest({
      faceShape: 'oval',
      locale: 'en',
    });
    expect(result.preference).toBe('neutral');
    expect(result.occasion).toBe('daily');
  });

  it('throws on invalid face shape', () => {
    expect(() =>
      parseRecommendRequest({
        faceShape: 'invalid',
        locale: 'ko',
      })
    ).toThrow();
  });
});

describe('validateProviderRecommendations', () => {
  it('validates array of provider recommendations', () => {
    const result = validateProviderRecommendations([
      { hairstyleId: 'bob', reason: 'Good', tips: ['Tip'] },
      { hairstyleId: 'pixie', reason: 'Short', tips: ['Trim'] },
    ]);
    expect(result).toHaveLength(2);
  });

  it('throws on invalid reason length', () => {
    expect(() =>
      validateProviderRecommendations([
        {
          hairstyleId: 'bob',
          reason: 'x'.repeat(281),
          tips: ['Tip'],
        },
      ])
    ).toThrow();
  });
});

describe('PreviewRequestSchema', () => {
  it('accepts valid preview request with ko locale', () => {
    const valid = {
      hairstyleId: 'soft-bob',
      locale: 'ko',
    };
    expect(PreviewRequestSchema.parse(valid)).toEqual(valid);
  });

  it('accepts valid preview request with en locale', () => {
    const valid = {
      hairstyleId: 'wavy-lob',
      locale: 'en',
    };
    expect(PreviewRequestSchema.parse(valid)).toEqual(valid);
  });

  it('rejects missing hairstyleId', () => {
    expect(() =>
      PreviewRequestSchema.parse({
        locale: 'ko',
      })
    ).toThrow();
  });

  it('rejects empty string hairstyleId', () => {
    expect(() =>
      PreviewRequestSchema.parse({
        hairstyleId: '',
        locale: 'en',
      })
    ).toThrow();
  });

  it('rejects hairstyleId exceeding 100 characters', () => {
    expect(() =>
      PreviewRequestSchema.parse({
        hairstyleId: 'x'.repeat(101),
        locale: 'ko',
      })
    ).toThrow();
  });

  it('accepts hairstyleId at max length (100 chars)', () => {
    const valid = {
      hairstyleId: 'x'.repeat(100),
      locale: 'en',
    };
    expect(PreviewRequestSchema.parse(valid)).toEqual(valid);
  });

  it('rejects invalid locale', () => {
    expect(() =>
      PreviewRequestSchema.parse({
        hairstyleId: 'bob',
        locale: 'fr',
      })
    ).toThrow();
  });

  it('rejects missing locale', () => {
    expect(() =>
      PreviewRequestSchema.parse({
        hairstyleId: 'bob',
      })
    ).toThrow();
  });

  it('rejects request with unknown additional fields (strict)', () => {
    expect(() =>
      PreviewRequestSchema.parse({
        hairstyleId: 'bob',
        locale: 'ko',
        unknownField: 'value',
      })
    ).toThrow();
  });

  it('rejects request with extra fields like referenceImage', () => {
    expect(() =>
      PreviewRequestSchema.parse({
        hairstyleId: 'bob',
        locale: 'en',
        referenceImage: { data: 'base64', mimeType: 'image/png' },
      })
    ).toThrow();
  });

  it('accepts hairstyleId with kebab-case naming', () => {
    const valid = {
      hairstyleId: 'soft-layered-bob',
      locale: 'ko',
    };
    expect(PreviewRequestSchema.parse(valid)).toEqual(valid);
  });

  it('accepts hairstyleId with underscores', () => {
    const valid = {
      hairstyleId: 'short_bob_style',
      locale: 'en',
    };
    expect(PreviewRequestSchema.parse(valid)).toEqual(valid);
  });
});
