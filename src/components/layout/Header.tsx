'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';

/**
 * Header: logo (left) + search icon + locale switcher + theme toggle (right).
 * Clean, minimal, single-red accent only on primary CTAs elsewhere.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-canvas border-b border-hairline">
      <div className="flex items-center justify-between px-lg py-md max-w-screen-2xl mx-auto h-16">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-heading-md font-bold text-ink hover:text-primary transition-colors"
          aria-label="ai.jurepi.kr Home"
        >
          ai.jurepi.kr
        </Link>

        {/* Right cluster: search + locale + theme */}
        <div className="flex items-center gap-md">
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
