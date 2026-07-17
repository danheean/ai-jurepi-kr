'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { FaceShape } from '@/lib/hairstyle-recommendation';
import { FACE_SHAPES } from '@/lib/hairstyle-recommendation';

interface FaceShapePickerProps {
  onSelect: (shape: FaceShape) => void;
}

// Simple SVG face silhouettes for each shape
const FaceShapeSvg: Record<FaceShape, React.ReactNode> = {
  oval: (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      <ellipse cx="50" cy="70" rx="30" ry="50" fill="currentColor" />
    </svg>
  ),
  round: (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      <circle cx="50" cy="70" r="45" fill="currentColor" />
    </svg>
  ),
  square: (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      <rect x="20" y="30" width="60" height="80" rx="8" fill="currentColor" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      <path
        d="M50 130 Q20 90 20 60 Q20 40 35 35 Q50 30 50 45 Q50 30 65 35 Q80 40 80 60 Q80 90 50 130"
        fill="currentColor"
      />
    </svg>
  ),
  oblong: (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      <ellipse cx="50" cy="70" rx="25" ry="55" fill="currentColor" />
    </svg>
  ),
  diamond: (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      <path d="M50 20 L75 70 L50 120 L25 70 Z" fill="currentColor" />
    </svg>
  ),
  triangle: (
    <svg viewBox="0 0 100 140" className="w-full h-full">
      <path d="M50 30 L80 110 L20 110 Z" fill="currentColor" />
    </svg>
  ),
};

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
    >
      {FACE_SHAPES.map((shape, index) => (
        <button
          key={shape}
          onClick={() => handleSelect(shape)}
          tabIndex={index === focusedIndex ? 0 : -1}
          aria-label={t(`face.${shape}`)}
          aria-checked={selectedShape === shape}
          role="radio"
          className={`flex flex-col items-center gap-2 p-3 rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2 ${
            selectedShape === shape
              ? 'border-2 border-primary bg-surface-card'
              : 'border-2 border-hairline bg-canvas hover:border-primary'
          }`}
        >
          {/* SVG silhouette */}
          <div className="w-16 h-20 text-ink">
            {FaceShapeSvg[shape]}
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
