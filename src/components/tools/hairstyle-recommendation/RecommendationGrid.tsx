'use client';

import React from 'react';
import type { Recommendation } from '@/lib/hairstyle-recommendation';
import type { PreviewState } from '@/lib/hairstyle-recommendation/flow';
import RecommendationCard from './RecommendationCard';

interface RecommendationGridProps {
  recommendations: Recommendation[];
  previews?: Record<string, PreviewState>;
}

export default function RecommendationGrid({
  recommendations,
  previews = {},
}: RecommendationGridProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.hairstyleId}
          recommendation={rec}
          previewState={previews[rec.hairstyleId]}
        />
      ))}
    </div>
  );
}
