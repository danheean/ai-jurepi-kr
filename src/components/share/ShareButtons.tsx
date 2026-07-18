'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Link2, Share2 } from 'lucide-react';
import { SHARE_TARGETS, buildShareUrl } from '@/lib/share/share-targets';
import {
  NaverIcon,
  XIcon,
  FacebookIcon,
  ThreadsIcon,
  TelegramIcon,
  WhatsAppIcon,
} from './ShareIcons';

const ICON_MAP = {
  naver: NaverIcon,
  x: XIcon,
  facebook: FacebookIcon,
  threads: ThreadsIcon,
  telegram: TelegramIcon,
  whatsapp: WhatsAppIcon,
};

interface ShareButtonsProps {
  /** Optional CSS class. */
  className?: string;
  /** Optional URL to share (defaults to window.location.href if not provided). */
  url?: string;
  /** Optional title to share (defaults to document.title if not provided). */
  title?: string;
  /**
   * Layout of the label vs. the button row.
   * - `vertical` (default): label stacked above the buttons (breadcrumb rows, panels).
   * - `horizontal`: label and buttons on one line — an anchored inline affordance
   *   (e.g. "share this hub" on the home page) instead of a floating icon cluster.
   */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * ShareButtons — horizontal row of SNS share buttons + copy link + native share.
 * Renders at SSR time. The native-share button is mounted-gated (mobile-only).
 * Buttons share the `url`/`title` props when given (e.g. an entity spoke URL from
 * a hub detail panel); otherwise they resolve both at click time from the current page.
 */
export function ShareButtons({
  className = '',
  url,
  title,
  orientation = 'vertical',
}: ShareButtonsProps): React.ReactNode {
  const t = useTranslations('share');
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [nativeShareSupported, setNativeShareSupported] = useState(false);

  // Gate native-share button: only show if navigator.share is available
  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setNativeShareSupported(true);
    }
  }, []);

  const handleShareClick = (id: string) => {
    try {
      const resolvedUrl = url ?? window.location.href;
      const resolvedTitle = title ?? document.title;
      const shareUrl = buildShareUrl(id as any, { url: resolvedUrl, title: resolvedTitle });
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=640');
    } catch (error) {
      // Silently handle share errors
    }
  };

  const handleCopyLink = async () => {
    try {
      const resolvedUrl = url ?? window.location.href;
      await navigator.clipboard.writeText(resolvedUrl);
      setCopiedId('copy');
      setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      // Silent fail on clipboard error
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        const resolvedUrl = url ?? window.location.href;
        const resolvedTitle = title ?? document.title;
        await navigator.share({
          title: resolvedTitle,
          url: resolvedUrl,
        });
      }
    } catch (error) {
      // User cancel (AbortError) is silent
      if ((error as Error).name !== 'AbortError') {
        // Silently handle native share errors
      }
    }
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className={`flex gap-x-3 gap-y-2 ${
        isHorizontal
          ? 'flex-row flex-wrap items-center'
          : 'flex-col gap-4'
      } ${className}`}
    >
      {/* Heading (quiet label) */}
      <div className="text-xs font-semibold uppercase tracking-widest text-mute">
        {t('heading')}
      </div>

      {/* Button row — SNS + copy + native, wraps on small screens */}
      <div className="flex flex-wrap gap-2">
        {/* 6 SNS buttons */}
        {SHARE_TARGETS.map((target) => {
          const Icon = ICON_MAP[target.id];
          return (
            <button
              key={target.id}
              type="button"
              aria-label={t(target.labelKey)}
              title={t(target.labelKey)}
              onClick={() => handleShareClick(target.id)}
              className="
                inline-flex items-center justify-center
                w-11 h-11
                rounded-full
                bg-transparent hover:bg-surface-card/50
                text-ink hover:text-mute
                transition-all duration-150
                motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-card
                motion-safe:active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2
              "
              data-testid={`share-button-${target.id}`}
            >
              <Icon className="w-5 h-5" aria-hidden />
            </button>
          );
        })}

        {/* Copy link button */}
        <button
          type="button"
          aria-label={
            copiedId === 'copy' ? t('copied') : t('copyLink')
          }
          title={copiedId === 'copy' ? t('copied') : t('copyLink')}
          onClick={handleCopyLink}
          className="
            inline-flex items-center justify-center
            w-11 h-11
            rounded-full
            bg-transparent hover:bg-surface-card/50
            text-ink hover:text-mute
            transition-all duration-150
            motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-card
            motion-safe:active:scale-95
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2
          "
          data-testid="share-button-copy"
          aria-live="polite"
        >
          {copiedId === 'copy' ? (
            <Check className="w-5 h-5" aria-hidden />
          ) : (
            <Link2 className="w-5 h-5" aria-hidden />
          )}
        </button>

        {/* Native share button (mobile only, mounted-gated) */}
        {mounted && nativeShareSupported && (
          <button
            type="button"
            aria-label={t('native')}
            title={t('native')}
            onClick={handleNativeShare}
            className="
              inline-flex items-center justify-center
              w-11 h-11
              rounded-full
              bg-transparent hover:bg-surface-card/50
              text-ink hover:text-mute
              transition-all duration-150
              motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-card
              motion-safe:active:scale-95
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2
            "
            data-testid="share-button-native"
          >
            <Share2 className="w-5 h-5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
