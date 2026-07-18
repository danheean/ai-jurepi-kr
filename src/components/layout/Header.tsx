'use client';

import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';

// Sibling hub of free (non-AI) tools. Matches the apps.jurepi.kr wordmark
// treatment (Gmarket Sans, text-xl) while keeping the AI identity ("Jurepi AI").
const APPS_URL = 'https://apps.jurepi.kr';

/**
 * Header: wordmark (left) + sibling-site link, search, locale switcher, theme
 * toggle (right). Wordmark font/size mirror apps.jurepi.kr for family consistency.
 */
export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-40 bg-canvas border-b border-hairline">
      <div className="flex items-center justify-between px-lg py-md max-w-screen-2xl mx-auto h-16">
        {/* Wordmark — matches apps.jurepi.kr (Gmarket Sans, text-xl) */}
        <Link
          href="/"
          className="font-display text-xl font-bold text-ink hover:text-primary transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Jurepi AI Home"
        >
          Jurepi AI
        </Link>

        {/* Right cluster: sibling link + search + locale + theme */}
        <div className="flex items-center gap-md">
          {/* Cross-link to the sibling free-tools hub */}
          <a
            href={`${APPS_URL}/${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-xxs text-body-sm font-medium text-mute hover:text-ink transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('freeTools')}
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>

          {/* Search icon (placeholder for future search) */}
          <button
            type="button"
            aria-label="Search tools"
            className="p-sm rounded-md text-ink hover:bg-surface-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Locale switcher */}
          <LocaleSwitcher />

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
