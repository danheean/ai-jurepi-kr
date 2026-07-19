/**
 * Tests for catalog tag/credit display localization.
 *
 * The catalog stores tags and credits as English slugs; the ko UI must not
 * leak raw English metadata (audit P2, 2026-07-19).
 */

import { describe, it, expect } from 'vitest';
import { getTagLabel, getCreditLabel, TAG_LABELS_KO } from './tag-labels';
import { HAIRSTYLE_LIBRARY } from './catalog';

describe('getTagLabel', () => {
  it('returns a Korean label for every tag used in the catalog', () => {
    const allTags = new Set(HAIRSTYLE_LIBRARY.flatMap((h) => h.tags));
    for (const tag of allTags) {
      expect(TAG_LABELS_KO[tag], `missing ko label for tag "${tag}"`).toBeDefined();
      expect(getTagLabel(tag, 'ko')).not.toBe(tag);
      expect(getTagLabel(tag, 'ko')).not.toMatch(/^[a-z-]+$/);
    }
  });

  it('returns the raw tag for en locale', () => {
    expect(getTagLabel('masculine', 'en')).toBe('masculine');
  });

  it('falls back to the raw tag for unknown tags in ko', () => {
    expect(getTagLabel('some-future-tag', 'ko')).toBe('some-future-tag');
  });
});

describe('getCreditLabel', () => {
  it('localizes every credit string used in the catalog for ko', () => {
    const allCredits = new Set(HAIRSTYLE_LIBRARY.map((h) => h.image.credit));
    for (const credit of allCredits) {
      const label = getCreditLabel(credit, 'ko');
      expect(label, `missing ko credit label for "${credit}"`).not.toBe(credit);
      expect(label).toMatch(/[가-힣]/);
    }
  });

  it('returns the raw credit for en locale', () => {
    expect(getCreditLabel('Hairstyle reference', 'en')).toBe('Hairstyle reference');
  });

  it('falls back to the raw credit for unknown credits in ko', () => {
    expect(getCreditLabel('Some Photographer', 'ko')).toBe('Some Photographer');
  });
});
