'use client';

import React from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { PreviewState } from '@/lib/hairstyle-recommendation/flow';
import { getCreditLabel } from '@/lib/hairstyle-recommendation/tag-labels';

interface ReferenceImage {
  src: string;
  alt: string;
  credit: string;
}

interface PreviewImageProps {
  referenceImage: ReferenceImage;
  previewState: PreviewState;
  hairstyleName: string;
}

export default function PreviewImage({
  referenceImage,
  previewState,
  hairstyleName,
}: PreviewImageProps) {
  const t = useTranslations('tools.hairstyle-recommendation');
  const locale = useLocale() as 'ko' | 'en';
  const prefersReducedMotion = useReducedMotion();

  const isGenerating = previewState.status === 'generating';
  const isDone = previewState.status === 'done' && previewState.imageDataUrl;

  const shimmerClass = prefersReducedMotion
    ? ''
    : 'motion-safe:animate-pulse';

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-t-md bg-surface-card" data-testid="preview-image">
      {/* Reference Image (always loaded first) */}
      <div className="absolute inset-0">
        <Image
          src={referenceImage.src}
          alt={isDone ? t('preview.altGenerated', { name: hairstyleName }) : referenceImage.alt}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 92vw"
          className="object-cover"
          loading="lazy"
        />

        {/* Credit scrim (only for reference image when not generated) */}
        {!isDone && referenceImage.credit && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-caption-sm text-on-dark">{getCreditLabel(referenceImage.credit, locale)}</p>
          </div>
        )}
      </div>

      {/* Shimmer overlay (generating state) */}
      {isGenerating && (
        <>
          <div
            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent ${shimmerClass}`}
            aria-hidden
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="sr-only" aria-live="polite" aria-busy="true">
              {t('preview.generating')}
            </div>
          </div>
        </>
      )}

      {/* Generated preview (fade in) */}
      {isDone && previewState.imageDataUrl && (
        <div
          className={`absolute inset-0 ${
            prefersReducedMotion
              ? 'opacity-100'
              : 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300'
          }`}
        >
          <img
            src={previewState.imageDataUrl}
            alt={t('preview.altGenerated', { name: hairstyleName })}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Label chip */}
      <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 backdrop-blur-sm">
        <p className="text-caption-sm font-medium text-on-dark">
          {isDone ? t('preview.generatedLabel') : t('preview.fallbackLabel')}
        </p>
      </div>
    </div>
  );
}
