import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand accent (single red per DESIGN.md)
        primary: 'var(--primary)',
        'primary-pressed': 'var(--primary-pressed)',
        'on-primary': 'var(--on-primary)',

        // Surfaces (cream-tinted neutrals)
        canvas: 'var(--canvas)',
        'surface-soft': 'var(--surface-soft)',
        'surface-card': 'var(--surface-card)',
        'surface-dark': 'var(--surface-dark)',

        // Secondary button surfaces
        'secondary-bg': 'var(--secondary-bg)',
        'secondary-pressed': 'var(--secondary-pressed)',

        // Text colors
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        body: 'var(--body)',
        charcoal: 'var(--charcoal)',
        mute: 'var(--mute)',
        ash: 'var(--ash)',
        stone: 'var(--stone)',
        'on-dark': 'var(--on-dark)',
        'on-dark-mute': 'var(--on-dark-mute)',

        // Hairlines and dividers
        hairline: 'var(--hairline)',
        'hairline-soft': 'var(--hairline-soft)',

        // Semantic colors
        success: 'var(--success-deep)',
        'success-pale': 'var(--success-pale)',
        error: 'var(--error)',
        'error-deep': 'var(--error-deep)',
        warning: 'var(--warning)',
        info: 'var(--info)',

        // Focus ring colors
        'focus-outer': 'var(--focus-outer)',
        'focus-inner': 'var(--focus-inner)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        pop: 'var(--shadow-pop)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      spacing: {
        xxs: 'var(--space-xxs)',
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        xxl: 'var(--space-xxl)',
        section: 'var(--space-section)',
      },
      transitionTimingFunction: {
        'ease-out': 'var(--ease-out)',
      },
      maxWidth: {
        container: '1120px',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      fontSize: {
        'display-xl': [
          'clamp(3rem, 1rem + 7vw, 4.375rem)',
          { lineHeight: '1.1', letterSpacing: '-1.2px' },
        ],
        'display-lg': [
          'clamp(2.75rem, 0.75rem + 5vw, 2.75rem)',
          { lineHeight: '1.15', letterSpacing: '-0.8px' },
        ],
        'heading-xl': [
          '1.75rem',
          { lineHeight: '1.2', letterSpacing: '-1.2px' },
        ],
        'heading-lg': [
          '1.375rem',
          { lineHeight: '1.25', letterSpacing: '0' },
        ],
        'heading-md': [
          '1.125rem',
          { lineHeight: '1.3', letterSpacing: '0' },
        ],
        'body-md': [
          '1rem',
          { lineHeight: '1.4', letterSpacing: '0' },
        ],
        'body-strong': [
          '1rem',
          { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' },
        ],
        'body-sm': [
          '0.875rem',
          { lineHeight: '1.4', letterSpacing: '0' },
        ],
        'body-sm-strong': [
          '0.875rem',
          { lineHeight: '1.4', letterSpacing: '0', fontWeight: '700' },
        ],
        'caption-md': [
          '0.75rem',
          { lineHeight: '1.5', letterSpacing: '0', fontWeight: '500' },
        ],
        'caption-sm': [
          '0.75rem',
          { lineHeight: '1.4', letterSpacing: '0' },
        ],
        'link-md': [
          '1rem',
          { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' },
        ],
        'button-md': [
          '0.875rem',
          { lineHeight: '1', letterSpacing: '0', fontWeight: '700' },
        ],
        'button-sm': [
          '0.75rem',
          { lineHeight: '1', letterSpacing: '0', fontWeight: '700' },
        ],
      },
    },
  },
};

export default config;
