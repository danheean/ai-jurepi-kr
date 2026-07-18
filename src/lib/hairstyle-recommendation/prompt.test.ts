/**
 * Tests for Hairstyle Recommendation Prompt Builders
 *
 * Validates that prompts include required information and constraints.
 */

import { describe, it, expect } from 'vitest';
import { buildAnalyzePrompt, buildRecommendPrompt, buildStylePreviewPrompt, buildFaceEditPrompt } from './prompt';
import { matchCandidates, HAIRSTYLE_LIBRARY } from './catalog';
import { MIN_RECS, MAX_RECS } from './constants';

describe('buildAnalyzePrompt', () => {
  it('returns English prompt for en locale', () => {
    const prompt = buildAnalyzePrompt('en');
    expect(prompt).toContain('oval');
    expect(prompt).toContain('round');
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('confidence');
    expect(prompt).not.toContain('당신은');
  });

  it('returns Korean prompt for ko locale', () => {
    const prompt = buildAnalyzePrompt('ko');
    expect(prompt).toContain('당신은');
    expect(prompt).toContain('얼굴 형태');
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('confidence');
  });

  it('includes all 7 face shapes in English prompt', () => {
    const prompt = buildAnalyzePrompt('en');
    expect(prompt).toContain('oval');
    expect(prompt).toContain('round');
    expect(prompt).toContain('square');
    expect(prompt).toContain('heart');
    expect(prompt).toContain('oblong');
    expect(prompt).toContain('diamond');
    expect(prompt).toContain('triangle');
  });

  it('includes confidence constraint in both locales', () => {
    expect(buildAnalyzePrompt('en')).toContain('0.0');
    expect(buildAnalyzePrompt('ko')).toContain('0.0');
  });

  it('mentions 240 char limit for notes', () => {
    expect(buildAnalyzePrompt('en')).toContain('240');
    expect(buildAnalyzePrompt('ko')).toContain('240');
  });
});

describe('buildRecommendPrompt', () => {
  it('includes candidate hairstyle IDs in English', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'feminine' as const,
      occasion: 'daily' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({
      faceShape: 'oval',
      preference: 'feminine',
    });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    for (const c of candidates) {
      expect(prompt).toContain(c.id);
    }
  });

  it('includes candidate hairstyle names in English', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'feminine' as const,
      occasion: 'daily' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({
      faceShape: 'oval',
      preference: 'feminine',
    });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    for (const c of candidates) {
      expect(prompt).toContain(c.name.en);
    }
  });

  it('includes candidate hairstyle names in Korean', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'feminine' as const,
      occasion: 'daily' as const,
      locale: 'ko' as const,
    };
    const candidates = matchCandidates({
      faceShape: 'oval',
      preference: 'feminine',
    });

    const prompt = buildRecommendPrompt(input, candidates, 'ko');
    for (const c of candidates) {
      expect(prompt).toContain(c.name.ko);
    }
  });

  it('includes recommendation count bounds (MIN_RECS–MAX_RECS)', () => {
    const input = {
      faceShape: 'square' as const,
      preference: 'neutral' as const,
      occasion: 'business' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({ faceShape: 'square' });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    expect(prompt).toContain(`${MIN_RECS}`);
    expect(prompt).toContain(`${MAX_RECS}`);
  });

  it('includes 280 char limit for reason', () => {
    const input = {
      faceShape: 'round' as const,
      preference: 'masculine' as const,
      occasion: 'event' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({ faceShape: 'round' });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    expect(prompt).toContain('280');
  });

  it('includes 120 char limit for tips', () => {
    const input = {
      faceShape: 'heart' as const,
      preference: 'feminine' as const,
      occasion: 'daily' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({ faceShape: 'heart' });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    expect(prompt).toContain('120');
  });

  it('includes user face shape in English', () => {
    const input = {
      faceShape: 'diamond' as const,
      preference: 'neutral' as const,
      occasion: 'daily' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({ faceShape: 'diamond' });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    expect(prompt).toContain('diamond');
  });

  it('translates face shape to Korean', () => {
    const input = {
      faceShape: 'diamond' as const,
      preference: 'neutral' as const,
      occasion: 'daily' as const,
      locale: 'ko' as const,
    };
    const candidates = matchCandidates({ faceShape: 'diamond' });

    const prompt = buildRecommendPrompt(input, candidates, 'ko');
    expect(prompt).toContain('다이아몬드형');
  });

  it('includes preference in English', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'feminine' as const,
      occasion: 'daily' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({ faceShape: 'oval' });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    expect(prompt).toContain('feminine');
  });

  it('translates preference to Korean', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'feminine' as const,
      occasion: 'daily' as const,
      locale: 'ko' as const,
    };
    const candidates = matchCandidates({ faceShape: 'oval' });

    const prompt = buildRecommendPrompt(input, candidates, 'ko');
    expect(prompt).toContain('여성스러운');
  });

  it('includes optional length when specified', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'neutral' as const,
      length: 'short' as const,
      occasion: 'daily' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({ faceShape: 'oval' });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    expect(prompt).toContain('short');
  });

  it('includes optional hairType when specified', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'neutral' as const,
      hairType: 'curly' as const,
      occasion: 'daily' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({ faceShape: 'oval' });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    expect(prompt).toContain('curly');
  });

  it('includes occasion when specified', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'neutral' as const,
      occasion: 'business' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({ faceShape: 'oval' });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    expect(prompt).toContain('business');
  });

  it('instructs to use only candidate IDs in JSON response', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'feminine' as const,
      occasion: 'daily' as const,
      locale: 'en' as const,
    };
    const candidates = matchCandidates({ faceShape: 'oval' });

    const prompt = buildRecommendPrompt(input, candidates, 'en');
    expect(prompt).toContain('ONLY');
    expect(prompt).toContain('hairstyleId');
  });

  it('returns Korean when locale is ko', () => {
    const input = {
      faceShape: 'oval' as const,
      preference: 'feminine' as const,
      occasion: 'daily' as const,
      locale: 'ko' as const,
    };
    const candidates = matchCandidates({ faceShape: 'oval' });

    const prompt = buildRecommendPrompt(input, candidates, 'ko');
    expect(prompt).toContain('당신은');
    expect(prompt).toContain('추천');
  });
});

describe('buildStylePreviewPrompt', () => {
  it('includes style name (en) from catalog entry', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    expect(prompt).toContain(entry.name.en);
  });

  it('includes all tags from catalog entry', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    for (const tag of entry.tags) {
      expect(prompt).toContain(tag);
    }
  });

  it('includes hair length from catalog entry', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    expect(prompt).toContain(entry.length);
  });

  it('includes all hair types from catalog entry', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    for (const hairType of entry.hairType) {
      expect(prompt).toContain(hairType);
    }
  });

  it('includes "no text, watermarks, or logos" safety rule', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    expect(prompt).toContain('No text');
    expect(prompt).toContain('watermarks');
    expect(prompt).toContain('logos');
  });

  it('does not contain Korean characters (Hangul)', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    const hangulRegex = /[가-힣]/;
    expect(prompt).not.toMatch(hangulRegex);
  });

  it('is deterministic: same entry produces identical prompt', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt1 = buildStylePreviewPrompt(entry);
    const prompt2 = buildStylePreviewPrompt(entry);
    expect(prompt1).toBe(prompt2);
  });

  it('returns different prompts for different catalog entries', () => {
    const entry1 = HAIRSTYLE_LIBRARY[0];
    const entry2 = HAIRSTYLE_LIBRARY[Math.min(1, HAIRSTYLE_LIBRARY.length - 1)];

    if (entry1.id !== entry2.id) {
      const prompt1 = buildStylePreviewPrompt(entry1);
      const prompt2 = buildStylePreviewPrompt(entry2);
      expect(prompt1).not.toBe(prompt2);
    }
  });

  it('is marked as photorealistic salon portrait', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    expect(prompt).toContain('Photorealistic');
    expect(prompt).toContain('salon');
    expect(prompt).toContain('portrait');
  });

  it('requests professional photography quality', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    expect(prompt).toContain('Professional');
  });

  it('specifies clear, well-lit salon environment', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    expect(prompt).toContain('salon environment');
  });

  it('does not include user-supplied free text (safe from prompt injection)', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildStylePreviewPrompt(entry);
    // Prompt should only use catalog fields, not any arbitrary user input
    // Verify it doesn't contain patterns that would come from user input
    expect(prompt).not.toContain('{');
    expect(prompt).not.toContain('${');
  });

  describe('buildStylePreviewPrompt with gender parameter', () => {
    it('includes "young Korean male model" when gender is male', () => {
      const entry = HAIRSTYLE_LIBRARY[0];
      const prompt = buildStylePreviewPrompt(entry, 'male');
      expect(prompt).toContain('young Korean male model');
      expect(prompt).not.toContain('young Korean female model');
      expect(prompt).not.toContain('young person');
    });

    it('includes "young Korean female model" when gender is female', () => {
      const entry = HAIRSTYLE_LIBRARY[0];
      const prompt = buildStylePreviewPrompt(entry, 'female');
      expect(prompt).toContain('young Korean female model');
      expect(prompt).not.toContain('young Korean male model');
      expect(prompt).not.toContain('young person');
    });

    it('defaults to single gender when entry has one gender and no gender parameter', () => {
      // Find an entry with a single gender (e.g., all feminine have ['female'])
      const femaleEntry = HAIRSTYLE_LIBRARY.find((h) => h.genders.length === 1 && h.genders[0] === 'female');
      expect(femaleEntry).toBeDefined();

      const prompt = buildStylePreviewPrompt(femaleEntry!);
      expect(prompt).toContain('young Korean female model');
    });

    it('uses "young person" when entry has multiple genders and no gender parameter', () => {
      // Find an entry with multiple genders
      const unisexEntry = HAIRSTYLE_LIBRARY.find((h) => h.genders.length > 1);
      expect(unisexEntry).toBeDefined();

      const prompt = buildStylePreviewPrompt(unisexEntry!);
      expect(prompt).toContain('young person');
      expect(prompt).not.toContain('young Korean male model');
      expect(prompt).not.toContain('young Korean female model');
    });

    it('overrides entry gender with explicit gender parameter', () => {
      // Find a female-only entry
      const femaleEntry = HAIRSTYLE_LIBRARY.find((h) => h.genders.length === 1 && h.genders[0] === 'female');
      expect(femaleEntry).toBeDefined();

      // Explicitly request male
      const prompt = buildStylePreviewPrompt(femaleEntry!, 'male');
      expect(prompt).toContain('young Korean male model');
      expect(prompt).not.toContain('young Korean female model');
    });
  });
});

describe('buildFaceEditPrompt', () => {
  it('returns a valid edit instruction prompt', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).toBeDefined();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('includes style name from catalog entry', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).toContain(entry.name.en);
  });

  it('includes length from catalog entry', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).toContain(entry.length);
  });

  it('includes all hair types from catalog entry', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    for (const hairType of entry.hairType) {
      expect(prompt).toContain(hairType);
    }
  });

  it('includes all tags from catalog entry', () => {
    const entry = HAIRSTYLE_LIBRARY.find((h) => h.tags.length > 0);
    expect(entry).toBeDefined();
    const prompt = buildFaceEditPrompt(entry!);
    for (const tag of entry!.tags) {
      expect(prompt).toContain(tag);
    }
  });

  it('emphasizes hair-only edit with "Change ONLY the hair" instruction', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).toContain('Change ONLY the hair');
  });

  it('includes instruction to preserve facial identity', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).toContain('facial identity');
  });

  it('includes instruction to preserve skin tone', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).toContain('Preserve skin tone');
  });

  it('includes instruction to preserve expression', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).toContain('expression');
  });

  it('includes instruction to preserve clothing and background', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).toContain('clothing');
    expect(prompt).toContain('background');
  });

  it('prohibits text, watermarks, and logos', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).toContain('No text');
    expect(prompt).toContain('watermarks');
    expect(prompt).toContain('logos');
  });

  it('is deterministic: same entry produces identical prompt', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt1 = buildFaceEditPrompt(entry);
    const prompt2 = buildFaceEditPrompt(entry);
    expect(prompt1).toBe(prompt2);
  });

  it('returns different prompts for different catalog entries', () => {
    const entry1 = HAIRSTYLE_LIBRARY[0];
    const entry2 = HAIRSTYLE_LIBRARY[1];
    const prompt1 = buildFaceEditPrompt(entry1);
    const prompt2 = buildFaceEditPrompt(entry2);
    expect(prompt1).not.toBe(prompt2);
  });

  it('does not contain template placeholders or unresolved variables', () => {
    const entry = HAIRSTYLE_LIBRARY[0];
    const prompt = buildFaceEditPrompt(entry);
    expect(prompt).not.toContain('${');
    expect(prompt).not.toContain('{');
    expect(prompt).not.toContain('[object Object]');
  });
});
