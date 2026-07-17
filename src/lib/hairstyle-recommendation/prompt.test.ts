/**
 * Tests for Hairstyle Recommendation Prompt Builders
 *
 * Validates that prompts include required information and constraints.
 */

import { describe, it, expect } from 'vitest';
import { buildAnalyzePrompt, buildRecommendPrompt } from './prompt';
import { matchCandidates } from './catalog';
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
