'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export function ConsentBanner() {
  const t = useTranslations('consent');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem('consent-banner');
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleConsent = (value: boolean) => {
    localStorage.setItem('consent-banner', JSON.stringify({ analytics: value, ads: value }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-dark text-on-dark p-lg border-t border-hairline">
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-lg">
        <div className="flex-1">
          <p className="text-body-md">{t('message')}</p>
        </div>
        <div className="flex items-center gap-md">
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
