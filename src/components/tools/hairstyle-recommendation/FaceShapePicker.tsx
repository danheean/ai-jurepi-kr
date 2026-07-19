'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { FaceShape } from '@/lib/hairstyle-recommendation';
import { FACE_SHAPES } from '@/lib/hairstyle-recommendation';
import { getFaceShapeReference } from '@/lib/hairstyle-recommendation/face-shapes-catalog';

interface FaceShapePickerProps {
  onSelect: (shape: FaceShape) => void;
}

export default function FaceShapePicker({ onSelect }: FaceShapePickerProps) {
  const t = useTranslations('tools.hairstyle-recommendation');
  const [selectedShape, setSelectedShape] = React.useState<FaceShape | null>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleSelect = (shape: FaceShape) => {
    setSelectedShape(shape);
    onSelect(shape);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % FACE_SHAPES.length);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + FACE_SHAPES.length) % FACE_SHAPES.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(FACE_SHAPES[focusedIndex]);
    }
  };

  React.useEffect(() => {
    const buttons = containerRef.current?.querySelectorAll('button');
    buttons?.[focusedIndex]?.focus();
  }, [focusedIndex]);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-max"
      onKeyDown={handleKeyDown}
      role="radiogroup"
      aria-label={t('face.pickTitle')}
    >
      {FACE_SHAPES.map((shape, index) => (
        <button
          key={shape}
          onClick={() => handleSelect(shape)}
          tabIndex={index === focusedIndex ? 0 : -1}
          aria-label={t(`face.${shape}`)}
          aria-checked={selectedShape === shape}
          role="radio"
          className={`relative flex flex-col items-center gap-2 p-3 rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2 ${
            selectedShape === shape
              ? 'border-2 border-primary bg-surface-card'
              : 'border-2 border-hairline bg-canvas hover:border-primary'
          }`}
        >
          {/* AI-generated face-shape reference image */}
          <div className="w-16 h-20 rounded-sm overflow-hidden">
            <img
              src={getFaceShapeReference(shape).image.src}
              alt=""
              width={768}
              height={960}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Label */}
          <span className="text-caption-sm text-mute text-center truncate max-w-full">
            {t(`face.${shape}`)}
          </span>

          {/* Check badge */}
          {selectedShape === shape && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-on-primary text-xs font-bold">
              ✓
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
