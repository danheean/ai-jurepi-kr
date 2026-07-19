'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Scissors } from 'lucide-react';

interface EntryChooserProps {
  onChoose: (path: 'photo' | 'manual') => void;
}

export default function EntryChooser({ onChoose }: EntryChooserProps) {
  const t = useTranslations('tools.hairstyle-recommendation');

  return (
    <div className="space-y-6">
      <p className="text-body text-charcoal">
        {t('entry.photoSub')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Photo Path */}
        <button
          onClick={() => onChoose('photo')}
          className="group relative rounded-md bg-canvas border-2 border-hairline p-5 text-left transition-all duration-150 hover:border-primary hover:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2"
        >
          {/* Icon tile */}
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-md bg-surface-card group-hover:bg-hairline-soft mb-3">
            <Camera className="w-6 h-6 text-ink" strokeWidth={1.5} />
          </div>

          {/* Title */}
          <span className="block text-heading-md font-semibold text-ink mb-1">
            {t('entry.photoLabel')}
          </span>

          {/* Subtitle */}
          <p className="text-body-sm text-mute">
            {t('entry.photoSub')}
          </p>
        </button>

        {/* Manual Path */}
        <button
          onClick={() => onChoose('manual')}
          className="group relative rounded-md bg-canvas border-2 border-hairline p-5 text-left transition-all duration-150 hover:border-primary hover:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2"
        >
          {/* Icon tile */}
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-md bg-surface-card group-hover:bg-hairline-soft mb-3">
            <Scissors className="w-6 h-6 text-ink" strokeWidth={1.5} />
          </div>

          {/* Title */}
          <span className="block text-heading-md font-semibold text-ink mb-1">
            {t('entry.manualLabel')}
          </span>

          {/* Subtitle */}
          <p className="text-body-sm text-mute">
            {t('entry.manualSub')}
          </p>
        </button>
      </div>
    </div>
  );
}
