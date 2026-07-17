'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ToolMeta } from '@/tools/types';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { ToolGrid } from './ToolGrid';

interface ToolExplorerProps {
  initialTools: ToolMeta[];
  categories: string[];
}

function ToolExplorerContent({ initialTools, categories }: ToolExplorerProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get('category') || null
  );

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

  return (
    <>
      <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory || undefined}
          onCategoryChange={handleCategoryChange}
        />
      )}
      <ToolGrid
        tools={initialTools}
        searchQuery={searchQuery}
        activeCategory={activeCategory}
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
