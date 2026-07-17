'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw, Share2, Copy, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { FaceShape, Recommendation } from '@/lib/hairstyle-recommendation';

interface ResultActionsProps {
  onRegenerate: () => void;
  onReset: () => void;
  faceShape: FaceShape | null;
  recommendations?: Recommendation[];
}

export default function ResultActions({
  onRegenerate,
  onReset,
  faceShape,
  recommendations = [],
}: ResultActionsProps) {
  const t = useTranslations('tools.hairstyle-recommendation');
  const { addToast } = useToast();
  const [isCooldown, setIsCooldown] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);

  // Cooldown timer for rate limiting
  React.useEffect(() => {
    if (!isCooldown) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          setIsCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCooldown]);

  // Copy summary to clipboard
  const handleCopySummary = async () => {
    const summaryText = [
      `얼굴형: ${faceShape}`,
      `추천 헤어스타일:`,
      ...recommendations.map((rec) => `- ${rec.name.ko}: ${rec.reason}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      addToast({
        type: 'success',
        message: t('result.copied'),
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to copy to clipboard',
      });
    }
  };

  // Share (open platform ShareButtons or native share)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '헤어스타일 추천',
          text: `${faceShape} 얼굴형에 추천하는 헤어스타일을 확인해보세요!`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      handleCopySummary();
    }
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {/* Regenerate */}
        <button
          onClick={onRegenerate}
          disabled={isCooldown}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md font-button-md hover:bg-primary-pressed disabled:bg-surface-card disabled:text-ash transition-all duration-150"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          {isCooldown ? `${t('result.regenerate')} (${cooldownSeconds}s)` : t('result.regenerate')}
        </button>

        {/* Copy Summary */}
        <button
          onClick={handleCopySummary}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-bg text-ink rounded-md font-button-md hover:bg-secondary-pressed transition-all duration-150"
        >
          <Copy className="w-4 h-4" strokeWidth={1.5} />
          {t('result.copySummary')}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-bg text-ink rounded-md font-button-md hover:bg-secondary-pressed transition-all duration-150"
        >
          <Share2 className="w-4 h-4" strokeWidth={1.5} />
          {t('result.share')}
        </button>
      </div>

      {/* Reset button (text link) */}
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-ink-soft hover:text-ink underline text-body-sm"
      >
        <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
        {t('result.reset')}
      </button>
    </div>
  );
}
