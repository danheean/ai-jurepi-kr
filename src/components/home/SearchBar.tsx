'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { useCallback, useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

/**
 * SearchBar: magnifying glass icon + input + rounded-full.
 * Live search with debounce would be added here if needed.
 */
const SEARCH_DEBOUNCE_MS = 200;

export function SearchBar({ onSearch, initialQuery = '' }: SearchBarProps) {
  const t = useTranslations('home');
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Debounce the parent filter so it doesn't run on every keystroke. Cheap at
  // one tool today; keeps typing smooth as the catalog grows. The input stays
  // controlled by `query`, so keystrokes remain instant.
  useEffect(() => {
    const id = setTimeout(() => onSearch(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, onSearch]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  return (
    <div className="px-lg py-xl bg-canvas">
      <div className="max-w-screen-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-lg top-1/2 -translate-y-1/2 w-5 h-5 text-mute pointer-events-none" />
          <input
            id="tool-search"
            type="search"
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
            value={query}
            onChange={handleChange}
            data-testid="search-input"
            className="w-full pl-12 pr-lg py-md rounded-full bg-surface-card border border-hairline text-body-md text-ink placeholder:text-mute transition-all duration-150 focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </div>
      </div>
    </div>
  );
}
