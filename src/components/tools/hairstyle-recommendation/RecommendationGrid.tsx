'use client';

import React from 'react';
import type { Recommendation } from '@/lib/hairstyle-recommendation';
import type { PreviewState } from '@/lib/hairstyle-recommendation/flow';
import RecommendationCard from './RecommendationCard';

const STAGGER_STEP_MS = 80;

interface RecommendationGridProps {
  recommendations: Recommendation[];
  previews?: Record<string, PreviewState>;
  reducedMotion?: boolean;
}

/**
 * Staggered reveal (rev 3): each card fades in with `animation-delay: index * 80ms`
 * (opacity/transform only, compositor-friendly). Purely a client-side reveal of the
 * already-fetched response — NOT network streaming. `reducedMotion` → all cards
 * render immediately, no delay.
 */
export default function RecommendationGrid({
  recommendations,
  previews = {},
  reducedMotion = false,
}: RecommendationGridProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {recommendations.map((rec, index) => (
        <div
          key={rec.hairstyleId}
          className={reducedMotion ? undefined : 'animate-card-reveal'}
          style={
            reducedMotion
              ? undefined
              : { animationDelay: `${index * STAGGER_STEP_MS}ms` }
          }
        >
          <RecommendationCard
            recommendation={rec}
            previewState={previews[rec.hairstyleId]}
          />
        </div>
      ))}
    </div>
  );
}
