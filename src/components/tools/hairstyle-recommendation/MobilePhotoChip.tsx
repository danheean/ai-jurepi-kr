'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { FaceShape } from '@/lib/hairstyle-recommendation';

interface MobilePhotoChipProps {
  photoUrl: string;
  faceShape?: FaceShape;
  onReplace: () => void;
}

export default function MobilePhotoChip({
  photoUrl,
  faceShape,
  onReplace,
}: MobilePhotoChipProps) {
  const t = useTranslations('tools.hairstyle-recommendation');

  const faceShapeLabel = faceShape ? t(`face.${faceShape}`) : undefined;

  return (
    <div
      className="lg:hidden sticky top-16 z-10 bg-canvas/95 backdrop-blur border border-hairline rounded-md px-3 py-2 mb-4 flex items-center gap-3"
      data-testid="mobile-photo-chip"
    >
      {/* Thumbnail */}
      <img
        src={photoUrl}
        alt={t('workspace.myPhotoTitle')}
        className="w-10 h-10 rounded-md object-cover flex-shrink-0"
      />

      {/* Face shape badge */}
      {faceShapeLabel && (
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-charcoal truncate">
            {faceShapeLabel}
          </p>
        </div>
      )}

      {/* Replace button */}
      <button
        onClick={onReplace}
        className="inline-flex items-center min-h-[44px] px-2 -mr-1 text-xs text-mute hover:text-charcoal underline flex-shrink-0"
      >
        {t('workspace.replacePhoto')}
      </button>
    </div>
  );
}
