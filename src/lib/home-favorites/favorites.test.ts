import { describe, it, expect } from 'vitest';
import { toggleFavorite, isInFavorites, pruneMissing } from './favorites';

describe('home-favorites/favorites (pure)', () => {
  describe('toggleFavorite', () => {
    it('adds slug to empty list', () => {
      const result = toggleFavorite([], 'ladder');
      expect(result).toEqual(['ladder']);
    });

    it('adds slug to existing list', () => {
      const result = toggleFavorite(['qna'], 'ladder');
      expect(result).toEqual(['qna', 'ladder']);
    });

    it('removes slug if already present', () => {
      const result = toggleFavorite(['qna', 'ladder'], 'ladder');
      expect(result).toEqual(['qna']);
    });

    it('removes first occurrence only', () => {
      const result = toggleFavorite(['ladder', 'qna', 'ladder'], 'ladder');
      expect(result).toEqual(['qna', 'ladder']);
    });

    it('returns new array (immutable)', () => {
      const original = ['qna'];
      const result = toggleFavorite(original, 'ladder');
      expect(result).not.toBe(original);
      expect(original).toEqual(['qna']); // unchanged
    });

    it('preserves order when removing', () => {
      const result = toggleFavorite(['a', 'b', 'c', 'd'], 'b');
      expect(result).toEqual(['a', 'c', 'd']);
    });

    it('appends to end when adding', () => {
      const result = toggleFavorite(['a', 'b'], 'c');
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('isInFavorites', () => {
    it('returns true if slug is in list', () => {
      expect(isInFavorites(['qna', 'ladder'], 'ladder')).toBe(true);
    });

    it('returns false if slug is not in list', () => {
      expect(isInFavorites(['qna', 'ladder'], 'age-calc')).toBe(false);
    });

    it('returns false for empty list', () => {
      expect(isInFavorites([], 'ladder')).toBe(false);
    });

    it('returns true only for first match in duplicates', () => {
      // Even though duplicates shouldn't happen, check behavior
      expect(isInFavorites(['ladder', 'qna', 'ladder'], 'ladder')).toBe(true);
    });
  });

  describe('pruneMissing', () => {
    it('removes ids not in validSlugs', () => {
      const result = pruneMissing(['ladder', 'qna', 'missing'], ['ladder', 'qna']);
      expect(result).toEqual(['ladder', 'qna']);
    });

    it('preserves order of remaining ids', () => {
      const result = pruneMissing(['z', 'a', 'b'], ['a', 'b', 'c']);
      expect(result).toEqual(['a', 'b']);
    });

    it('returns empty array if all ids are missing', () => {
      const result = pruneMissing(['x', 'y'], ['a', 'b']);
      expect(result).toEqual([]);
    });

    it('returns empty array if ids list is empty', () => {
      const result = pruneMissing([], ['ladder', 'qna']);
      expect(result).toEqual([]);
    });

    it('returns all ids if all are valid', () => {
      const result = pruneMissing(['ladder', 'qna'], ['ladder', 'qna', 'age-calc']);
      expect(result).toEqual(['ladder', 'qna']);
    });

    it('returns new array (immutable)', () => {
      const original = ['ladder', 'qna'];
      const result = pruneMissing(original, ['ladder']);
      expect(result).not.toBe(original);
      expect(original).toEqual(['ladder', 'qna']); // unchanged
    });

    it('works with case-sensitive matching', () => {
      const result = pruneMissing(['Ladder', 'qna'], ['ladder', 'qna']);
      expect(result).toEqual(['qna']);
    });
  });

  describe('integration scenarios', () => {
    it('toggle → toggle creates empty list', () => {
      let ids: string[] = [];
      ids = toggleFavorite(ids, 'ladder');
      expect(isInFavorites(ids, 'ladder')).toBe(true);
      ids = toggleFavorite(ids, 'ladder');
      expect(ids).toEqual([]);
      expect(isInFavorites(ids, 'ladder')).toBe(false);
    });

    it('multiple toggles build up list', () => {
      let ids: string[] = [];
      ids = toggleFavorite(ids, 'ladder');
      ids = toggleFavorite(ids, 'qna');
      ids = toggleFavorite(ids, 'age-calc');
      expect(ids).toEqual(['ladder', 'qna', 'age-calc']);
      expect(isInFavorites(ids, 'qna')).toBe(true);
    });

    it('prune after toggle removes missing tools', () => {
      let ids = ['ladder', 'qna', 'age-calc', 'missing-tool'];
      ids = pruneMissing(ids, ['ladder', 'qna', 'age-calc']);
      expect(ids).toEqual(['ladder', 'qna', 'age-calc']);
    });
  });
});
