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
  const tHome = useTranslations('home');
  const locale = useLocale();

  // The header search icon focuses the in-page tool search (SearchBar) rather
  // than being a dead affordance — one search field, surfaced from the header.
  const focusSearch = () => {
    const el = document.getElementById('tool-search');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el as HTMLInputElement).focus({ preventScroll: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas border-b border-hairline">
      <nav
        aria-label={t('mainNav')}
        className="flex items-center justify-between px-lg py-md max-w-screen-2xl mx-auto h-16"
      >
        {/* Wordmark — matches apps.jurepi.kr (Gmarket Sans, text-xl) */}
        <Link
          href="/"
          className="whitespace-nowrap font-display text-xl font-bold text-ink hover:text-primary transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Jurepi AI Home"
        >
          Jurepi AI
        </Link>

        {/* Right cluster: sibling link + search + locale + theme */}
        <div className="flex items-center gap-sm">
          {/* Cross-link to the sibling free-tools hub. Hidden on the smallest
              screens (the header would otherwise wrap); mobile users reach it
              from the footer instead. */}
          <a
            href={`${APPS_URL}/${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-xxs px-xs py-xs whitespace-nowrap text-body-sm font-medium text-mute hover:text-ink transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('freeTools')}
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>

          {/* Search — focuses the in-page tool search */}
          <button
            type="button"
            onClick={focusSearch}
            aria-label={tHome('searchAria')}
            className="w-11 h-11 flex items-center justify-center rounded-md text-ink hover:bg-surface-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Locale switcher */}
          <LocaleSwitcher />

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
