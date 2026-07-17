'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * ThemeToggle: light/dark mode switch using lucide Moon/Sun icons.
 * Uses hydration check to prevent mismatch. Theme is stored in localStorage.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Hydration check: read theme from DOM after client mount
  useEffect(() => {
    setIsMounted(true);
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const handleToggle = () => {
    if (!isMounted) return;

    const html = document.documentElement;
    const willBeDark = !isDark;

    if (willBeDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    setIsDark(willBeDark);
  };

  // Render null during SSR to avoid hydration mismatch
  if (!isMounted) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Light mode' : 'Dark mode'}
      className="p-sm rounded-md text-ink hover:bg-surface-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
