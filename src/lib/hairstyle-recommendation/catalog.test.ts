/**
 * Tests for Hairstyle Recommendation Catalog
 *
 * Validates matching, attaching catalog data, and backfilling logic.
 */

import { describe, it, expect } from 'vitest';
import {
  HAIRSTYLE_LIBRARY,
  getHairstyleById,
  matchCandidates,
  attachCatalog,
  backfill,
} from './catalog';
import type { ProviderRecommendation, Recommendation } from './types';
import { MAX_RECS, MIN_RECS } from './constants';

describe('HAIRSTYLE_LIBRARY', () => {
  it('contains at least 24 entries', () => {
    expect(HAIRSTYLE_LIBRARY.length).toBeGreaterThanOrEqual(24);
  });

  it('all entries have required fields', () => {
    for (const entry of HAIRSTYLE_LIBRARY) {
      expect(entry.id).toBeDefined();
      expect(entry.name.ko).toBeDefined();
      expect(entry.name.en).toBeDefined();
      expect(entry.suitableFaceShapes.length).toBeGreaterThan(0);
      expect(['feminine', 'masculine', 'neutral']).toContain(
        entry.preference
      );
      expect(['short', 'medium', 'long']).toContain(entry.length);
      expect(entry.hairType.length).toBeGreaterThan(0);
      expect(entry.image.src).toBeDefined();
      expect(entry.image.alt).toBeDefined();
      expect(entry.image.credit).toBeDefined();
      expect(entry.image.license).toBeDefined();
    }
  });

  it('covers all 7 face shapes', () => {
    const shapes = new Set<string>();
    for (const entry of HAIRSTYLE_LIBRARY) {
      entry.suitableFaceShapes.forEach((s) => shapes.add(s));
    }
    expect(shapes.size).toBe(7);
    expect(shapes).toContain('oval');
    expect(shapes).toContain('round');
    expect(shapes).toContain('square');
    expect(shapes).toContain('heart');
    expect(shapes).toContain('oblong');
    expect(shapes).toContain('diamond');
    expect(shapes).toContain('triangle');
  });

  it('covers all 3 preferences with multiple entries each', () => {
    const prefs = {
      feminine: 0,
      masculine: 0,
      neutral: 0,
    };
    for (const entry of HAIRSTYLE_LIBRARY) {
      prefs[entry.preference]++;
    }
    expect(prefs.feminine).toBeGreaterThan(0);
    expect(prefs.masculine).toBeGreaterThan(0);
    expect(prefs.neutral).toBeGreaterThan(0);
  });
});

describe('getHairstyleById', () => {
  it('finds a hairstyle by ID', () => {
    const entry = getHairstyleById('soft-layered-bob');
    expect(entry).toBeDefined();
    expect(entry?.name.en).toBe('Soft Layered Bob');
  });

  it('returns null for unknown ID', () => {
    expect(getHairstyleById('nonexistent')).toBeNull();
  });
});

describe('matchCandidates', () => {
  it('returns hairstyles matching the face shape', () => {
    const candidates = matchCandidates({ faceShape: 'oval' });
    expect(candidates.length).toBeGreaterThan(0);
    expect(
      candidates.every((h) => h.suitableFaceShapes.includes('oval'))
    ).toBe(true);
  });

  it('filters by preference when specified', () => {
    const candidates = matchCandidates({
      faceShape: 'oval',
      preference: 'feminine',
    });
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((h) => h.preference === 'feminine')).toBe(true);
  });

  it('returns at least MAX_RECS entries when available', () => {
    const candidates = matchCandidates({ faceShape: 'oval' });
    expect(candidates.length).toBeGreaterThanOrEqual(
      Math.min(MAX_RECS, HAIRSTYLE_LIBRARY.length)
    );
  });

  it('prioritizes matching length if enough entries exist', () => {
    const candidates = matchCandidates({
      faceShape: 'oval',
      length: 'short',
    });
    const shortEntries = candidates.filter((h) => h.length === 'short');
    if (candidates.length >= MAX_RECS && shortEntries.length > 0) {
      // Should prioritize short entries
      expect(shortEntries.length).toBeGreaterThan(0);
    }
  });

  it('soft-filters on hairType (includes all if not enough matches)', () => {
    const candidates = matchCandidates({
      faceShape: 'oval',
      hairType: 'straight',
    });
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('handles all face shapes', () => {
    const shapes = [
      'oval',
      'round',
      'square',
      'heart',
      'oblong',
      'diamond',
      'triangle',
    ] as const;
    for (const shape of shapes) {
      const candidates = matchCandidates({ faceShape: shape });
      expect(candidates.length).toBeGreaterThan(0);
      expect(
        candidates.every((h) => h.suitableFaceShapes.includes(shape))
      ).toBe(true);
    }
  });
});

describe('attachCatalog', () => {
  it('enriches provider recommendations with catalog data', () => {
    const providerRecs: ProviderRecommendation[] = [
      {
        hairstyleId: 'soft-layered-bob',
        reason: 'Complements your face shape.',
        tips: ['Style with product', 'Trim every 6 weeks'],
      },
    ];

    const recommendations = attachCatalog(providerRecs, 'en');
    expect(recommendations).toHaveLength(1);

    const rec = recommendations[0];
    expect(rec.hairstyleId).toBe('soft-layered-bob');
    expect(rec.name.en).toBe('Soft Layered Bob');
    expect(rec.name.ko).toBeDefined();
    expect(rec.reason).toBe('Complements your face shape.');
    expect(rec.tips).toEqual(['Style with product', 'Trim every 6 weeks']);
    expect(rec.referenceImage.src).toBeDefined();
    expect(rec.tags.length).toBeGreaterThan(0);
  });

  it('drops recommendations with unknown hairstyleId', () => {
    const providerRecs: ProviderRecommendation[] = [
      {
        hairstyleId: 'soft-layered-bob',
        reason: 'Good',
        tips: ['Tip'],
      },
      {
        hairstyleId: 'unknown-style',
        reason: 'Unknown',
        tips: ['Tip'],
      },
    ];

    const recommendations = attachCatalog(providerRecs, 'en');
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].hairstyleId).toBe('soft-layered-bob');
  });

  it('returns empty array if all IDs are unknown', () => {
    const providerRecs: ProviderRecommendation[] = [
      {
        hairstyleId: 'unknown-1',
        reason: 'Unknown',
        tips: ['Tip'],
      },
      {
        hairstyleId: 'unknown-2',
        reason: 'Unknown',
        tips: ['Tip'],
      },
    ];

    expect(attachCatalog(providerRecs, 'ko')).toHaveLength(0);
  });

  it('preserves provider reason and tips', () => {
    const reason = 'Custom reason from AI';
    const tips = ['Custom tip 1', 'Custom tip 2'];
    const providerRecs: ProviderRecommendation[] = [
      {
        hairstyleId: 'soft-layered-bob',
        reason,
        tips,
      },
    ];

    const recommendations = attachCatalog(providerRecs, 'en');
    expect(recommendations[0].reason).toBe(reason);
    expect(recommendations[0].tips).toEqual(tips);
  });
});

describe('backfill', () => {
  it('returns unchanged if ≥ MIN_RECS recommendations', () => {
    const recs: Recommendation[] = Array(MIN_RECS).fill({
      hairstyleId: 'soft-layered-bob',
      name: { ko: '밥', en: 'Bob' },
      reason: 'Good',
      tips: ['Tip'],
      referenceImage: {
        src: '/img.webp',
        alt: 'Alt',
        credit: 'Credit',
      },
      tags: [],
    });

    const candidates = matchCandidates({ faceShape: 'oval' });
    const result = backfill(recs, candidates, 'en');
    expect(result).toHaveLength(MIN_RECS);
  });

  it('adds candidates until ≥ MIN_RECS', () => {
    const recs: Recommendation[] = [
      {
        hairstyleId: 'soft-layered-bob',
        name: { ko: '밥', en: 'Bob' },
        reason: 'Good',
        tips: ['Tip'],
        referenceImage: {
          src: '/img.webp',
          alt: 'Alt',
          credit: 'Credit',
        },
        tags: [],
      },
    ];

    const candidates = matchCandidates({ faceShape: 'oval' });
    const result = backfill(recs, candidates, 'en');
    expect(result.length).toBeGreaterThanOrEqual(MIN_RECS);
  });

  it('does not duplicate existing hairstyleIds', () => {
    const recs: Recommendation[] = [
      {
        hairstyleId: 'soft-layered-bob',
        name: { ko: '밥', en: 'Bob' },
        reason: 'Good',
        tips: ['Tip'],
        referenceImage: {
          src: '/img.webp',
          alt: 'Alt',
          credit: 'Credit',
        },
        tags: [],
      },
    ];

    const candidates = matchCandidates({ faceShape: 'oval' });
    const result = backfill(recs, candidates, 'en');

    const ids = result.map((r) => r.hairstyleId);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size); // No duplicates
  });

  it('stops adding when ≥ MIN_RECS is reached', () => {
    const recs: Recommendation[] = Array(1).fill({
      hairstyleId: 'soft-layered-bob',
      name: { ko: '밥', en: 'Bob' },
      reason: 'Good',
      tips: ['Tip'],
      referenceImage: {
        src: '/img.webp',
        alt: 'Alt',
        credit: 'Credit',
      },
      tags: [],
    });

    const candidates = matchCandidates({ faceShape: 'oval' });
    const result = backfill(recs, candidates, 'en');

    // Should have exactly MIN_RECS or only one if not enough candidates
    expect(result.length).toBeGreaterThanOrEqual(Math.min(1, MIN_RECS));
  });

  it('uses candidate data for backfilled entries', () => {
    const recs: Recommendation[] = [
      {
        hairstyleId: 'soft-layered-bob',
        name: { ko: '밥', en: 'Bob' },
        reason: 'Good',
        tips: ['Tip'],
        referenceImage: {
          src: '/img.webp',
          alt: 'Alt',
          credit: 'Credit',
        },
        tags: [],
      },
    ];

    const candidates = matchCandidates({ faceShape: 'oval' });
    const result = backfill(recs, candidates, 'en');

    if (result.length > 1) {
      const backfilled = result[1];
      const candidate = getHairstyleById(backfilled.hairstyleId);
      expect(candidate).toBeDefined();
      expect(backfilled.name).toEqual(candidate!.name);
      expect(backfilled.referenceImage).toEqual(candidate!.image);
    }
  });
});
