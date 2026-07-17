'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'neutral' | 'success' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary text-on-primary',
  neutral: 'bg-surface-card text-ink',
  success: 'bg-success-pale text-success-deep',
  error: 'bg-error-deep/10 text-error-deep',
  info: 'bg-info/10 text-info',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-1 text-caption-sm',
  md: 'px-3 py-1.5 text-button-sm',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  return (
    <div
      className={`
        inline-flex items-center rounded-full font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
