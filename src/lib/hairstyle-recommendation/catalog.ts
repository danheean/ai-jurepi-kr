/**
 * Hairstyle Catalog
 *
 * STUB: domain-engineer will populate with real curated hairstyle data
 * (ID, name, image URL, moodboard links, etc.)
 */

export interface HairstyleEntry {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category?: string;
  tags?: string[];
}

export const hairstyleCatalog: HairstyleEntry[] = [
  // STUB: to be populated by domain engineer
  // Example:
  // {
  //   id: 'soft-layered-bob',
  //   name: 'Soft Layered Bob',
  //   description: 'A gentle, textured bob with face-framing layers',
  //   imageUrl: '/hairstyles/soft-layered-bob.jpg',
  //   category: 'short',
  //   tags: ['feminine', 'modern', 'low-maintenance'],
  // },
];

/**
 * Get hairstyle by ID
 */
export function getHairstylesById(ids: string[]): HairstyleEntry[] {
  return ids
    .map((id) => hairstyleCatalog.find((h) => h.id === id))
    .filter((h) => h !== undefined) as HairstyleEntry[];
}

/**
 * Get all hairstyle IDs
 */
export function getAllHairstyleIds(): string[] {
  return hairstyleCatalog.map((h) => h.id);
}
