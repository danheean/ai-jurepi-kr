'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

// Sibling hub (apps.jurepi.kr) hosts the shared About/Contact pages; ai.jurepi.kr
// reuses them rather than duplicating. Both sites use localePrefix:'always',
// so links are locale-prefixed (/ko/about, /en/about).
const APPS_URL = 'https://apps.jurepi.kr';

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="bg-canvas border-t border-hairline mt-section">
      <div className="max-w-screen-2xl mx-auto px-lg py-xxl">
        {/* Link Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-xl mb-xl">
          <div>
            <h3 className="text-body-sm-strong text-ink mb-md">Tools</h3>
            <ul className="space-y-sm">
              <li>
                <Link
                  href="/"
                  className="text-body-sm text-mute hover:text-ink transition-colors"
                >
                  {t('nav.home')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-body-sm-strong text-ink mb-md">Company</h3>
            <ul className="space-y-sm">
              <li>
                <a
                  href={`${APPS_URL}/${locale}/about`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm text-mute hover:text-ink transition-colors"
                >
                  {t('nav.about')}
                </a>
              </li>
              <li>
                <a
                  href={`${APPS_URL}/${locale}/contact`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm text-mute hover:text-ink transition-colors"
                >
                  {t('nav.contact')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-body-sm-strong text-ink mb-md">Legal</h3>
            <ul className="space-y-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-body-sm text-mute hover:text-ink transition-colors"
                >
                  {t('nav.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-body-sm text-mute hover:text-ink transition-colors"
                >
                  {t('nav.terms')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-body-sm-strong text-ink mb-md">Social</h3>
            <ul className="space-y-sm">
              <li>
                <a
                  href="https://github.com/jurepi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm text-mute hover:text-ink transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="border-t border-hairline pt-xl flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="text-caption-sm text-mute">
            {t('footer.copyright')}
          </div>
          <div className="text-caption-sm text-mute">
            {t('footer.allRightsReserved')}
          </div>
        </div>
      </div>
    </footer>
  );
}
