/**
 * Tool Registry
 *
 * Single source of truth for:
 * - Hub UI grid (home page)
 * - Sitemap generation
 * - SSG static params (live tools only)
 * - SEO metadata
 * - Per-tool accent color identity (on icon tiles, category filters, badges)
 *
 * Tools become 'live' only when their module + route are implemented.
 */

import type { ToolMeta, AccentColor, ToolCategory } from './types';

export const tools: ToolMeta[] = [
  {
    id: 'hairstyle-recommendation',
    slug: 'hairstyle-recommendation',
    category: 'beauty',
    accent: 'rose',
    icon: 'Scissors',
    status: 'live',
    addedAt: '2026-07-01',
    isPopular: true,
    order: 10,
    hasServer: true,
    keywords: [
      '헤어스타일',
      '얼굴형',
      '추천',
      'hairstyle',
      'face shape',
      'recommendation',
      'AI',
    ],
  },
];

/**
 * Map category to its accent color per DESIGN.md
 */
export function categoryAccent(category: ToolCategory): AccentColor {
  const accentMap: Record<ToolCategory, AccentColor> = {
    beauty: 'rose',
    text: 'mint',
    dev: 'grape',
    random: 'coral',
    converter: 'sky',
    calculator: 'sun',
    fun: 'coral',
    mindset: 'grape',
    news: 'coral',
  };
  return accentMap[category];
}

/**
 * Live tools only (for SSG static params and sitemap)
 */
export function liveTools(): ToolMeta[] {
  return tools.filter((tool) => tool.status === 'live');
}

/**
 * All tools for home grid (including coming_soon)
 */
export function allTools(): ToolMeta[] {
  return tools;
}

/**
 * Find tool by slug
 */
export function findToolBySlug(slug: string): ToolMeta | undefined {
  return tools.find((tool) => tool.slug === slug);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(tools.map((tool) => tool.category)));
}
