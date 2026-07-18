/**
 * Pure domain logic for home favorites.
 * No react/next/DOM imports. All functions immutable.
 */

/**
 * Toggle favorite status for a slug.
 * If slug exists, remove it. Otherwise, append to end.
 * Returns new array (immutable).
 */
export function toggleFavorite(ids: readonly string[], slug: string): string[] {
  const index = ids.indexOf(slug);
  if (index >= 0) {
    // Remove
    return [...ids.slice(0, index), ...ids.slice(index + 1)];
  }
  // Add to end
  return [...ids, slug];
}

/**
 * Check if slug is in the favorites list.
 */
export function isInFavorites(ids: readonly string[], slug: string): boolean {
  return ids.includes(slug);
}

/**
 * Remove any ids that are not in validSlugs.
 * Preserves order of remaining ids.
 * Returns new array (immutable).
 */
export function pruneMissing(
  ids: readonly string[],
  validSlugs: readonly string[]
): string[] {
  const validSet = new Set(validSlugs);
  return ids.filter((id) => validSet.has(id));
}
