'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { Preference, Length, HairType, Occasion } from '@/lib/hairstyle-recommendation';
import { PREFERENCES, LENGTHS, HAIR_TYPES, OCCASIONS } from '@/lib/hairstyle-recommendation';

interface AttributeValues {
  preference: Preference;
  length?: Length;
  hairType?: HairType;
  occasion: Occasion;
}

interface AttributeSelectorsProps {
  values: AttributeValues;
  onChange: (updates: Partial<AttributeValues>) => void;
  disabled?: boolean;
}

interface PillGroup<T> {
  label: string;
  key: keyof AttributeSelectorsProps['values'];
  options: readonly (T | 'any')[];
  isOptional?: boolean;
}

export default function AttributeSelectors({
  values,
  onChange,
  disabled = false,
}: AttributeSelectorsProps) {
  const t = useTranslations('tools.hairstyle-recommendation');

  const pillGroups: PillGroup<any>[] = [
    {
      label: t('attr.preferenceLabel'),
      key: 'preference',
      options: PREFERENCES,
    },
    {
      label: t('attr.lengthLabel'),
      key: 'length',
      options: [...LENGTHS, 'any'],
      isOptional: true,
    },
    {
      label: t('attr.hairTypeLabel'),
      key: 'hairType',
      options: [...HAIR_TYPES, 'any'],
      isOptional: true,
    },
    {
      label: t('attr.occasionLabel'),
      key: 'occasion',
      options: OCCASIONS,
    },
  ];

  return (
    <div className="space-y-6">
      {pillGroups.map((group) => (
        <div key={group.key} className="space-y-2">
          <label className="text-caption-sm font-body-strong text-mute block">
            {group.label}
          </label>

          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const displayLabel = option === 'any'
                ? t('attr.any')
                : t(`attr.${group.key}${option.charAt(0).toUpperCase()}${option.slice(1)}`);

              const isSelected =
                option === 'any'
                  ? !values[group.key as keyof typeof values]
                  : values[group.key as keyof typeof values] === option;

              return (
                <button
                  key={option}
                  onClick={() => {
                    if (option === 'any') {
                      onChange({ [group.key]: undefined });
                    } else {
                      onChange({ [group.key]: option });
                    }
                  }}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`px-4 py-2 rounded-full font-button-md text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2 disabled:opacity-50 ${
                    isSelected
                      ? 'bg-ink text-on-dark hover:bg-charcoal'
                      : 'bg-surface-card text-ink border border-hairline hover:border-primary'
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
