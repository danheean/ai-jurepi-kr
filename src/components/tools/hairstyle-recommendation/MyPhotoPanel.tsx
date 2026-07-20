'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { X, ShieldCheck } from 'lucide-react';

interface MyPhotoPanelProps {
  photoUrl: string;
  onReplace: () => void;
  onRemove: () => void;
  facePreviewEnabled?: boolean;
  onFacePreviewToggle?: (enabled: boolean) => void;
  testId?: string;
}

export default function MyPhotoPanel({
  photoUrl,
  onReplace,
  onRemove,
  facePreviewEnabled = true,
  onFacePreviewToggle,
  testId = 'my-photo-panel',
}: MyPhotoPanelProps) {
  const t = useTranslations('tools.hairstyle-recommendation');

  return (
    <div
      className="rounded-md bg-canvas p-4 space-y-3"
      data-testid={testId}
    >
      <h2 className="text-sm font-bold text-charcoal">
        {t('workspace.myPhotoTitle')}
      </h2>

      <img
        src={photoUrl}
        alt={t('workspace.myPhotoTitle')}
        className="aspect-square w-full rounded-md object-cover"
      />

      <div className="flex gap-2">
        <button
          onClick={onReplace}
          className="flex-1 px-3 py-2 text-sm font-medium text-charcoal bg-surface-card hover:bg-secondary-bg rounded-md transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2"
        >
          {t('workspace.replacePhoto')}
        </button>
        <button
          onClick={onRemove}
          aria-label={t('workspace.removePhoto')}
          className="px-3 py-2 text-charcoal bg-surface-card hover:bg-secondary-bg rounded-md transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Face preview toggle */}
      {onFacePreviewToggle && (
        <div className="space-y-2 border-t border-hairline pt-3">
          <div className="flex items-center gap-2">
            <button
              role="switch"
              aria-checked={facePreviewEnabled}
              aria-labelledby="face-preview-label"
              onClick={() => onFacePreviewToggle(!facePreviewEnabled)}
              className={`w-10 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2 ${
                facePreviewEnabled
                  ? 'bg-primary'
                  : 'bg-surface-card border border-hairline'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white border border-hairline transition-transform ${
                  facePreviewEnabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span
              id="face-preview-label"
              onClick={() => onFacePreviewToggle(!facePreviewEnabled)}
              className="text-sm font-semibold text-charcoal cursor-pointer select-none"
            >
              {t('workspace.facePreviewLabel')}
            </span>
          </div>
          <p className="text-caption-sm text-mute">
            {t('workspace.facePreviewNote')}
          </p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md bg-surface-soft p-3">
        <ShieldCheck className="w-4 h-4 text-success-deep flex-shrink-0 mt-0.5" />
        <p className="text-caption-sm text-mute">
          {t('upload.privacy')}
        </p>
      </div>
    </div>
  );
}
