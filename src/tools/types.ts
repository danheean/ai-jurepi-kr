/**
 * Tool Registry Type Definitions
 *
 * Driven by SPEC.md and DESIGN.md:
 * - Per-category accent color identity (coral/mint/sky/sun/grape/rose)
 * - Category exists for filtering/grouping + accent signaling
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

export type AccentColor = 'coral' | 'mint' | 'sky' | 'sun' | 'grape' | 'rose';

export type ToolStatus = 'live' | 'coming_soon';

export interface ToolMeta {
  /** Unique identifier (e.g., 'hairstyle-recommendation') */
  id: string;

  /** URL slug (e.g., 'hairstyle-recommendation') */
  slug: string;

  /** Category for filtering and grouping */
  category: ToolCategory;

  /** Per-category accent color (coral/mint/sky/sun/grape/rose) — signals category identity on icon tiles, filters, badges */
  accent: AccentColor;

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
