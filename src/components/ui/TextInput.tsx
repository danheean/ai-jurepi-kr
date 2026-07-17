'use client';

import { InputHTMLAttributes, ReactNode } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: ReactNode;
  helperText?: ReactNode;
}

export function TextInput({
  label,
  error,
  helperText,
  className = '',
  disabled,
  ...props
}: TextInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-body-sm-strong text-ink">{label}</label>
      )}
      <input
        disabled={disabled}
        className={`
          px-4 py-3 text-body-md rounded-md
          bg-canvas border border-ash
          text-ink placeholder:text-ash
          transition-colors duration-150
          disabled:bg-surface-card disabled:text-ash disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-focus-outer focus:ring-offset-2 focus:ring-offset-canvas focus:border-focus-outer
          ${error ? 'border-error' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <div className="text-body-sm text-error">{error}</div>}
      {helperText && !error && (
        <div className="text-body-sm text-mute">{helperText}</div>
      )}
    </div>
  );
}
