'use client';

import { useTranslations } from 'next-intl';
import { ToolCard } from './ToolCard';
import { isInFavorites } from '@/lib/home-favorites/favorites';
import type { ToolMeta } from '@/tools/types';

interface ToolGridProps {
  tools: ToolMeta[];
  searchQuery?: string;
  activeCategory?: string | null;
  favoriteIds?: string[];
  favoritesOnly?: boolean;
  onToggleFavorite?: (slug: string) => void;
}

export function ToolGrid({
  tools,
  searchQuery = '',
  activeCategory,
  favoriteIds = [],
  favoritesOnly = false,
  onToggleFavorite,
}: ToolGridProps) {
  const t = useTranslations();

  // Get i18n resolved names/descriptions
  const getToolName = (tool: ToolMeta): string => {
    return t(`tools.${tool.slug}.name`) || tool.id;
  };

  const getToolDescription = (tool: ToolMeta): string => {
    return t(`tools.${tool.slug}.description`) || '';
  };

  // Filter tools based on search, category, and favorites
  const filteredTools = tools.filter((tool) => {
    const toolName = getToolName(tool);
    const toolDesc = getToolDescription(tool);

    const matchesSearch =
      !searchQuery ||
      toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toolDesc.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !activeCategory || tool.category === activeCategory;

    const matchesFavorites =
      !favoritesOnly ||
      (tool.status === 'live' && isInFavorites(favoriteIds, tool.slug));

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Sort: live first, then popular, then new, then coming_soon
  const sortedTools = [...filteredTools].sort((a, b) => {
    const statusOrder = { live: 0, coming_soon: 1 };
    const statusDiff =
      (statusOrder[a.status] || 1) - (statusOrder[b.status] || 1);
    if (statusDiff !== 0) return statusDiff;

    if ((b.isPopular ?? false) !== (a.isPopular ?? false)) {
      return (b.isPopular ?? false) ? 1 : -1;
    }

    return (a.order ?? 999) - (b.order ?? 999);
  });

  if (filteredTools.length === 0) {
    return (
      <div className="px-lg pt-xxl pb-section text-center">
        <p className="text-body-md text-mute">No tools found.</p>
      </div>
    );
  }

  return (
    // Top gap (pt-xxl) groups the grid tightly under the favorites toggle — it
    // reads as one continuous explore block (chips → favorites → grid), matching
    // apps.jurepi.kr's ~48px rhythm. Full pb-section keeps breathing room before
    // the footer. (Was py-section, which left the toggle floating in an ~80px gap.)
    <div className="px-lg pt-xxl pb-section bg-canvas">
      <div className="max-w-container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {sortedTools.map((tool) => (
            <ToolCard
              key={tool.slug}
              {...tool}
              displayName={getToolName(tool)}
              displayDescription={getToolDescription(tool)}
              isFavorited={isInFavorites(favoriteIds, tool.slug)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
