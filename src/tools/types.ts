/**
 * Tool Registry Type Definitions
 *
 * Driven by SPEC.md and DESIGN.md:
 * - Single brand-red accent per DESIGN.md (no per-category colors)
 * - Category exists for filtering/grouping only
 * - hasServer marks tools that require /api/** routes
 */

export type ToolCategory =
  | 'beauty'
  | 'text'
  | 'dev'
  | 'random'
  | 'converter'
  | 'calculator'
  | 'fun'
  | 'mindset'
  | 'news';

export type ToolStatus = 'live' | 'coming_soon';

export interface ToolMeta {
  /** Unique identifier (e.g., 'hairstyle-recommendation') */
  id: string;

  /** URL slug (e.g., 'hairstyle-recommendation') */
  slug: string;

  /** Category for filtering and grouping (no color identity) */
  category: ToolCategory;

  /** Lucide icon name */
  icon: string;

  /** Live or coming_soon status */
  status: ToolStatus;

  /** ISO date (YYYY-MM-DD) — NEW badge derives from last 7 days */
  addedAt: string;

  /** Popular tools pin to top */
  isPopular?: boolean;

  /** Manual sort weight (lower first) */
  order: number;

  /** Search keywords (localized variants resolved from messages) */
  keywords: string[];

  /** Marks tools that require /api/** routes */
  hasServer?: boolean;
}
