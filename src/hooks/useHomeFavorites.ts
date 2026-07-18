'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  STORAGE_KEY,
  parseFavoritesStore,
  buildFavoritesStore,
} from '@/lib/home-favorites/schema';
import { toggleFavorite, isInFavorites, pruneMissing } from '@/lib/home-favorites/favorites';

export interface UseHomeFavoritesReturn {
  favoriteIds: string[];
  toggleFavorite: (slug: string) => void;
  isFavorited: (slug: string) => boolean;
}

/**
 * Hook to manage home favorites with localStorage persistence.
 * - Initializes on mount from localStorage (SSR-safe: initial state is [], no localStorage access in useState)
 * - Auto-prunes favorites not in liveSlugs
 * - Persists changes immediately to localStorage
 * - Handles localStorage errors gracefully
 */
export function useHomeFavorites(liveSlugs: readonly string[]): UseHomeFavoritesReturn {
  // Initialize with empty array (safe for SSR/hydration)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Track initialization to avoid duplicate load in StrictMode
  const hasInitializedRef = useRef(false);

  // Load from localStorage on mount (once)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let ids = parseFavoritesStore(raw);

      // Prune favorites not in liveSlugs
      const pruned = pruneMissing(ids, liveSlugs);

      // If prune removed items, update state and re-save to localStorage
      if (pruned.length !== ids.length) {
        ids = pruned;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(buildFavoritesStore(ids)));
        } catch {
          // Ignore localStorage errors (quota, private mode, etc.)
        }
      }

      setFavoriteIds(ids);
    } catch {
      // Ignore any errors during initialization
      setFavoriteIds([]);
    }
  }, []);

  // Re-prune when liveSlugs changes
  useEffect(() => {
    setFavoriteIds((currentIds) => {
      const pruned = pruneMissing(currentIds, liveSlugs);

      // If prune removed items, update localStorage
      if (pruned.length !== currentIds.length) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(buildFavoritesStore(pruned)));
        } catch {
          // Ignore localStorage errors
        }
      }

      return pruned;
    });
  }, [liveSlugs]);

  // Toggle favorite (with function form to avoid stale closures)
  const handleToggleFavorite = useCallback((slug: string) => {
    setFavoriteIds((currentIds) => {
      const newIds = toggleFavorite(currentIds, slug);

      // Persist immediately to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(buildFavoritesStore(newIds)));
      } catch {
        // Ignore localStorage errors (quota, private mode, etc.)
        // State is still updated even if persistence fails
      }

      return newIds;
    });
  }, []);

  // Check if slug is favorited (stable reference)
  const handleIsFavorited = useCallback(
    (slug: string) => isInFavorites(favoriteIds, slug),
    [favoriteIds]
  );

  return {
    favoriteIds,
    toggleFavorite: handleToggleFavorite,
    isFavorited: handleIsFavorited,
  };
}
