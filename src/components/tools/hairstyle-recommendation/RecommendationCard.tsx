'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Scissors } from 'lucide-react';
import type { Recommendation } from '@/lib/hairstyle-recommendation';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export default function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.hairstyle-recommendation');
  const name = recommendation.name[locale] ?? recommendation.name.ko;
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Compute image dimensions for 4:5 aspect ratio at different widths
  // At lg: 3 cols, ~320px per card, so ~300px width
  // At sm: 2 cols, ~45% width, so ~350px width
  // At mobile: 1 col, ~full width, so ~320px width
  // Use 300x375 as safe baseline for 4:5
  const IMAGE_WIDTH = 300;
  const IMAGE_HEIGHT = 375;

  return (
    <div className="rounded-md bg-canvas border border-hairline overflow-hidden hover:border-primary transition-all duration-150">
      {/* Image Section */}
      <div className="relative overflow-hidden bg-surface-card" style={{ aspectRatio: '4/5' }}>
        {!imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recommendation.referenceImage.src}
            alt={recommendation.referenceImage.alt}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : null}

        {/* Image error fallback */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-card text-primary p-4">
            <Scissors className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
            <p className="text-center text-caption-sm font-body-strong text-charcoal">
              {name}
            </p>
          </div>
        )}

        {/* Image credit (bottom-right scrim) */}
        {imageLoaded && !imageError && (
          <div className="absolute bottom-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1">
            <p className="text-caption-sm text-on-dark/80">
              {recommendation.referenceImage.credit}
            </p>
          </div>
        )}

        {/* Loading state */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-hairline-soft animate-pulse" />
        )}
      </div>

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
