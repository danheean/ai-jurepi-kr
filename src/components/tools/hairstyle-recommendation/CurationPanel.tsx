'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { Curation } from '@/lib/hairstyle-recommendation';

interface CurationPanelProps {
  curation: Curation;
}

/**
 * Rendered above RecommendationGrid, only when the response included a
 * `curation` block — a missing block is never an error state, it's just
 * absent. Appears first in the staggered reveal sequence (does not itself
 * stagger).
 */
export default function CurationPanel({ curation }: CurationPanelProps) {
  const t = useTranslations('tools.hairstyle-recommendation');

  return (
    <div
      className="rounded-md bg-canvas p-4 sm:p-5 space-y-3"
      data-testid="curation-panel"
    >
      <h3 className="text-sm font-bold text-charcoal">
        {t('result.curation.title')}
      </h3>
      <p className="text-sm text-charcoal leading-relaxed">{curation.summary}</p>

      {curation.avoid.length > 0 && (
        <div className="space-y-2 border-t border-hairline pt-3">
          <h4 className="text-sm font-bold text-charcoal">
            {t('result.curation.avoidTitle')}
          </h4>
          <ul className="space-y-1.5">
            {curation.avoid.map((item, i) => (
              <li key={i} className="text-sm text-mute leading-relaxed">
                <span className="font-semibold text-charcoal">{item.label}</span>
                {' — '}
                {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
