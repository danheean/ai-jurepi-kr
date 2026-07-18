import { z } from 'zod';

export const STORE_VERSION = 1;
export const STORAGE_KEY = 'ai-jurepi-home-favorites';

export const favoritesStoreSchema = z.object({
  version: z.number(),
  ids: z.array(z.string()),
});

export type FavoritesStore = z.infer<typeof favoritesStoreSchema>;

/**
 * Parse raw storage value (JSON string, object, or null) into ids array.
 * Returns empty array on any error (corruption, version mismatch, invalid shape).
 * Never throws.
 */
export function parseFavoritesStore(raw: unknown): string[] {
  try {
    let parsed: unknown;

    // If raw is a string, parse as JSON
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw);
    } else {
      parsed = raw;
    }

    // Validate schema
    const result = favoritesStoreSchema.safeParse(parsed);
    if (!result.success) {
      return [];
    }

    // Check version
    if (result.data.version !== STORE_VERSION) {
      return [];
    }

    return result.data.ids;
  } catch {
    return [];
  }
}

/**
 * Build a serializable store object from ids array.
 */
export function buildFavoritesStore(ids: readonly string[]): FavoritesStore {
  return {
    version: STORE_VERSION,
    ids: Array.from(ids),
  };
}
