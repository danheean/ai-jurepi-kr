'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Recommendation } from '@/lib/hairstyle-recommendation';
import type { PreviewState } from '@/lib/hairstyle-recommendation/flow';
import PreviewImage from './PreviewImage';

interface RecommendationCardProps {
  recommendation: Recommendation;
  previewState?: PreviewState;
}

export default function RecommendationCard({
  recommendation,
  previewState = { status: 'idle' },
}: RecommendationCardProps) {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.hairstyle-recommendation');
  const name = recommendation.name[locale] ?? recommendation.name.ko;

  return (
    <div className="rounded-md bg-canvas border border-hairline overflow-hidden hover:border-primary transition-all duration-150">
      {/* Image Section */}
      <PreviewImage
        referenceImage={recommendation.referenceImage}
        previewState={previewState}
        hairstyleName={name}
      />

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3 className="text-heading-md font-heading-md text-ink line-clamp-2">
          {name}
        </h3>

        {/* Reason */}
        <p className="text-body-sm text-charcoal leading-1.55 line-clamp-3">
          {recommendation.reason}
        </p>

        {/* Tips */}
        {recommendation.tips && recommendation.tips.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-caption-sm font-body-strong text-mute">
              {t('result.tipsLabel')}
            </p>
            <ul className="space-y-1 text-caption-sm text-charcoal">
              {recommendation.tips.map((tip, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-primary flex-shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {recommendation.tags && recommendation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-hairline">
            {recommendation.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-1 rounded-full bg-surface-card text-ash text-caption-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
