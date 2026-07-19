'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { FaceAnalysis } from '@/lib/hairstyle-recommendation';

interface AnalysisCardProps {
  analysis: FaceAnalysis;
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const t = useTranslations('tools.hairstyle-recommendation');
  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <div className="rounded-md bg-canvas border border-hairline p-5 space-y-4">
      {/* Header: Face shape + gender badge + confidence meter */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-heading-md font-semibold text-ink">
            {t(`face.${analysis.faceShape}`)}
          </h3>
          {analysis.gender && analysis.gender !== 'unknown' && (
            <span className="inline-block px-3 py-1 rounded-full bg-surface-card text-charcoal text-caption-sm">
              {t(`attr.gender${analysis.gender.charAt(0).toUpperCase()}${analysis.gender.slice(1)}`)}
            </span>
          )}
        </div>

        {/* Confidence meter */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-hairline-soft rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${analysis.confidence * 100}%` }}
                role="progressbar"
                aria-label={t('analysis.matchSuffix')}
                aria-valuenow={confidencePercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
          <span className="text-caption-sm text-mute">
            {confidencePercent}% {t('analysis.matchSuffix')}
          </span>
        </div>
      </div>

      {/* Features as chips */}
      {analysis.features && analysis.features.length > 0 && (
        <div className="space-y-2">
          <p className="text-caption-sm font-semibold text-mute">
            {t('analysis.featuresLabel')}
          </p>
          <div className="flex flex-wrap gap-2">
            {analysis.features.map((feature) => (
              <span
                key={feature}
                className="inline-block px-3 py-1 rounded-full bg-surface-card text-charcoal text-caption-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes (if present) */}
      {analysis.notes && (
        <p className="text-body-sm text-charcoal leading-relaxed">
          {analysis.notes}
        </p>
      )}

      {/* Low confidence warning */}
      {analysis.confidence < 0.5 && (
        <div className="rounded-md bg-warning/10 border border-warning/30 p-3">
          <p className="text-body-sm text-charcoal">
            {t('analysis.lowConfidence')}
          </p>
        </div>
      )}
    </div>
  );
}
