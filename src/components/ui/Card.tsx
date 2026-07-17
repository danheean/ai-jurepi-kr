'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  asButton?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  asButton = false,
  onClick,
}: CardProps) {
  const baseClasses =
    'bg-surface-card rounded-md overflow-hidden transition-all duration-150';

  const buttonClasses = asButton
    ? 'cursor-pointer hover:shadow-card active:shadow-pop'
    : '';

  if (asButton) {
    return (
      <button
        onClick={onClick}
        className={`
          ${baseClasses}
          ${buttonClasses}
          text-left
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2
          ${className}
        `}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>{children}</div>
  );
}
