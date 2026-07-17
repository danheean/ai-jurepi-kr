'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  ariaLabel: string;
}

export function IconButton({
  children,
  ariaLabel,
  className = '',
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      className={`
        flex items-center justify-center
        w-10 h-10 rounded-full
        bg-surface-card text-ink
        hover:bg-surface-card/80 active:bg-hairline-soft
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2 focus-visible:ring-offset-canvas
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
