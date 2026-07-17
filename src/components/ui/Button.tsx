'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary/90 active:bg-primary-pressed',
  secondary:
    'bg-secondary-bg text-ink hover:bg-secondary-pressed active:bg-secondary-pressed',
  tertiary: 'bg-transparent text-ink hover:bg-surface-card active:bg-hairline',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-button-sm min-h-9',
  md: 'px-3.5 py-2.5 text-button-md min-h-10',
  lg: 'px-4 py-3 text-button-md min-h-12',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        rounded-md font-medium transition-colors duration-150
        motion-safe:active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2 focus-visible:ring-offset-canvas
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? '...' : children}
    </button>
  );
}
