'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export function ConsentBanner() {
  const t = useTranslations('consent');
  const [showBanner, setShowBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasConsent = localStorage.getItem('consent-banner');
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, []);

  // While the fixed banner is visible, reserve equal space at the bottom of the
  // page so it never overlaps content (e.g. the first tool card). Tracks the
  // banner's own height so the reservation stays correct when it wraps on mobile.
  useEffect(() => {
    if (!showBanner) return;
    const el = bannerRef.current;
    if (!el) return;
    const sync = () => {
      document.body.style.paddingBottom = `${el.offsetHeight}px`;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = '';
    };
  }, [showBanner]);

  const handleConsent = (value: boolean) => {
    localStorage.setItem('consent-banner', JSON.stringify({ analytics: value, ads: value }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    // A compact consent card, not a full-width bar. On desktop it docks to the
    // bottom-right corner so it never sits over the left-aligned category chips /
    // favorites toggle (a full-bleed bar overlapped them on tall, short viewports).
    // On mobile it becomes a centered bottom toast with side gutters.
    <div
      ref={bannerRef}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-md md:justify-end md:px-lg md:pb-lg"
    >
      <div className="pointer-events-auto flex w-full max-w-[26rem] flex-col gap-md rounded-md border border-hairline bg-surface-dark p-lg text-on-dark shadow-pop">
        <p className="text-body-md">{t('message')}</p>
        <div className="flex items-center justify-end gap-md">
          <Button
            variant="secondary"
            size="md"
            onClick={() => handleConsent(false)}
          >
            {t('reject')}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleConsent(true)}
          >
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
