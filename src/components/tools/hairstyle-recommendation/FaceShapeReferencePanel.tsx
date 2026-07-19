'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { FaceShape } from '@/lib/hairstyle-recommendation';
import { getFaceShapeReference } from '@/lib/hairstyle-recommendation/face-shapes-catalog';

interface FaceShapeReferencePanelProps {
  shape: FaceShape;
  onEdit: () => void;
}

/**
 * RAIL card shown when the user picked a face shape manually (no photo
 * uploaded) — mutually exclusive with MyPhotoPanel. Shows the pre-generated
 * AI reference image for the selected shape so the RAIL is never empty.
 */
export default function FaceShapeReferencePanel({
  shape,
  onEdit,
}: FaceShapeReferencePanelProps) {
  const t = useTranslations('tools.hairstyle-recommendation');
  const reference = getFaceShapeReference(shape);
  const label = t(`face.${shape}`);

  return (
    <div
      className="rounded-md bg-canvas p-4 space-y-3"
      data-testid="face-shape-reference-panel"
    >
      <h2 className="text-sm font-bold text-charcoal">{label}</h2>

      <img
        src={reference.image.src}
        alt={label}
        width={768}
        height={960}
        loading="lazy"
        className="aspect-square w-full rounded-md object-cover"
      />

      <button
        onClick={onEdit}
        className="w-full px-3 py-2 text-sm font-medium text-charcoal bg-surface-card hover:bg-secondary-bg rounded-md transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2"
      >
        {t('workspace.changeFaceShape')}
      </button>
    </div>
  );
}
