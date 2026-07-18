'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ToolMeta } from '@/tools/types';
import { useHomeFavorites } from '@/hooks/useHomeFavorites';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { FavoritesFilterToggle } from './FavoritesFilterToggle';
import { ToolGrid } from './ToolGrid';

interface ToolExplorerProps {
  initialTools: ToolMeta[];
  categories: string[];
}

function ToolExplorerContent({ initialTools, categories }: ToolExplorerProps) {
  const t = useTranslations('home');
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get('category') || null
  );
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Get live tool slugs for favorites pruning.
  // Memoized so the reference is stable across renders — otherwise the
  // useHomeFavorites [liveSlugs] effect re-runs every render and loops
  // ("Maximum update depth exceeded").
  const liveSlugs = useMemo(
    () =>
      initialTools
        .filter((tool) => tool.status === 'live')
        .map((tool) => tool.slug),
    [initialTools]
  );

  // Initialize favorites hook
  const { favoriteIds, toggleFavorite } = useHomeFavorites(liveSlugs);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const cat = searchParams.get('category') || null;
    setSearchQuery(q);
    setActiveCategory(cat);
  }, [searchParams]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: string | null) => {
    setActiveCategory(category);
  }, []);

  const handleToggleFavoritesOnly = useCallback(() => {
    setFavoritesOnly((v) => !v);
  }, []);

  return (
    <>
      <h2 className="sr-only">{t('toolsHeading')}</h2>
      <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
      <div className="flex gap-lg flex-col">
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory || undefined}
            onCategoryChange={handleCategoryChange}
          />
        )}
        {/* Favorites filter toggle on its own row, left-aligned */}
        <div className="px-lg">
          <FavoritesFilterToggle
            active={favoritesOnly}
            onToggle={handleToggleFavoritesOnly}
            count={favoriteIds.length}
            testId="favorites-filter-toggle"
          />
        </div>
      </div>
      <ToolGrid
        tools={initialTools}
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        favoriteIds={favoriteIds}
        favoritesOnly={favoritesOnly}
        onToggleFavorite={toggleFavorite}
      />
    </>
  );
}

export function ToolExplorer({ initialTools, categories }: ToolExplorerProps) {
  return (
    <Suspense fallback={null}>
      <ToolExplorerContent initialTools={initialTools} categories={categories} />
    </Suspense>
  );
}
