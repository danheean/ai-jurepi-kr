import { describe, it, expect } from 'vitest';
import {
  STORE_VERSION,
  STORAGE_KEY,
  favoritesStoreSchema,
  parseFavoritesStore,
  buildFavoritesStore,
} from './schema';

describe('home-favorites/schema', () => {
  describe('constants', () => {
    it('exports STORE_VERSION = 1', () => {
      expect(STORE_VERSION).toBe(1);
    });

    it('exports STORAGE_KEY = "ai-jurepi-home-favorites"', () => {
      expect(STORAGE_KEY).toBe('ai-jurepi-home-favorites');
    });
  });

  describe('favoritesStoreSchema', () => {
    it('validates correct store shape', () => {
      const validStore = { version: 1, ids: ['tool1', 'tool2'] };
      const result = favoritesStoreSchema.safeParse(validStore);
      expect(result.success).toBe(true);
    });

    it('rejects missing version', () => {
      const invalid = { ids: ['tool1'] };
      const result = favoritesStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects missing ids', () => {
      const invalid = { version: 1 };
      const result = favoritesStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects non-array ids', () => {
      const invalid = { version: 1, ids: 'not-array' };
      const result = favoritesStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects non-string array elements', () => {
      const invalid = { version: 1, ids: ['tool1', 123] };
      const result = favoritesStoreSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('parseFavoritesStore', () => {
    it('parses valid store JSON string', () => {
      const json = JSON.stringify({ version: 1, ids: ['ladder', 'qna'] });
      const result = parseFavoritesStore(json);
      expect(result).toEqual(['ladder', 'qna']);
    });

    it('returns empty array for null', () => {
      expect(parseFavoritesStore(null)).toEqual([]);
    });

    it('returns empty array for undefined', () => {
      expect(parseFavoritesStore(undefined)).toEqual([]);
    });

    it('returns empty array for invalid JSON string', () => {
      expect(parseFavoritesStore('not valid json')).toEqual([]);
    });

    it('returns empty array for non-string input', () => {
      expect(parseFavoritesStore(123)).toEqual([]);
    });

    it('returns empty array for object without version', () => {
      const obj = { ids: ['tool1'] };
      expect(parseFavoritesStore(obj)).toEqual([]);
    });

    it('returns empty array for version mismatch', () => {
      const obj = { version: 2, ids: ['tool1'] };
      expect(parseFavoritesStore(obj)).toEqual([]);
    });

    it('returns empty array for non-array ids', () => {
      const obj = { version: 1, ids: 'not-array' };
      expect(parseFavoritesStore(obj)).toEqual([]);
    });

    it('returns empty array for malformed ids array', () => {
      const obj = { version: 1, ids: ['tool1', 123] };
      expect(parseFavoritesStore(obj)).toEqual([]);
    });

    it('does not throw on any invalid input', () => {
      expect(() => parseFavoritesStore({} as unknown)).not.toThrow();
      expect(() => parseFavoritesStore(NaN)).not.toThrow();
      expect(() => parseFavoritesStore(Symbol('test'))).not.toThrow();
    });
  });

  describe('buildFavoritesStore', () => {
    it('builds store with correct version and ids', () => {
      const store = buildFavoritesStore(['ladder', 'qna']);
      expect(store.version).toBe(1);
      expect(store.ids).toEqual(['ladder', 'qna']);
    });

    it('returns empty ids array for empty input', () => {
      const store = buildFavoritesStore([]);
      expect(store.ids).toEqual([]);
    });

    it('preserves id order', () => {
      const ids = ['c', 'a', 'b'];
      const store = buildFavoritesStore(ids);
      expect(store.ids).toEqual(['c', 'a', 'b']);
    });

    it('works with readonly array', () => {
      const ids = ['tool1', 'tool2'] as const;
      const store = buildFavoritesStore(ids);
      expect(store.ids).toEqual(['tool1', 'tool2']);
    });
  });

  describe('round-trip serialization', () => {
    it('survives parse → build → stringify → parse cycle', () => {
      const original = ['ladder', 'qna', 'age-calc'];
      const built = buildFavoritesStore(original);
      const stringified = JSON.stringify(built);
      const parsed = parseFavoritesStore(stringified);
      expect(parsed).toEqual(original);
    });
  });
});
