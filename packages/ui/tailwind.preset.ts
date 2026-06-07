import type { Config } from 'tailwindcss';

export const kodiraUiPreset = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        'bg-2': 'hsl(var(--bg-2) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',

        fg: 'hsl(var(--fg) / <alpha-value>)',
        'fg-muted': 'hsl(var(--fg-muted) / <alpha-value>)',
        'fg-dim': 'hsl(var(--fg-dim) / <alpha-value>)',

        card: 'hsl(var(--card) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        'muted-fg': 'hsl(var(--muted-fg) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',

        line: 'hsl(var(--line) / <alpha-value>)',
        'line-strong': 'hsl(var(--line-strong) / <alpha-value>)',

        primary: 'hsl(var(--primary) / <alpha-value>)',
        'primary-fg': 'hsl(var(--primary-fg) / <alpha-value>)',
        violet: 'hsl(var(--violet) / <alpha-value>)',

        success: 'hsl(var(--success) / <alpha-value>)',
        'success-fg': 'hsl(var(--success-fg) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        'danger-fg': 'hsl(var(--danger-fg) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        glow: 'var(--shadow-glow)',
        glass: 'var(--shadow-glass)',
      },
      transitionTimingFunction: {
        brand: 'var(--ease-brand)',
        soft: 'var(--ease-soft)',
      },
      keyframes: {
        'aurora-1': {
          '0%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.55' },
          '40%': { transform: 'translate3d(92px,36px,0) scale(1.12)', opacity: '0.62' },
          '70%': { transform: 'translate3d(-46px,86px,0) scale(0.96)', opacity: '0.5' },
          '100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.55' },
        },
        'aurora-2': {
          '0%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.55' },
          '45%': { transform: 'translate3d(-78px,88px,0) scale(0.96)', opacity: '0.5' },
          '75%': { transform: 'translate3d(54px,24px,0) scale(1.12)', opacity: '0.62' },
          '100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.55' },
        },
        'aurora-3': {
          '0%': { transform: 'translate3d(0,0,0)', opacity: '0.5' },
          '45%': { transform: 'translate3d(62px,-46px,0)', opacity: '0.56' },
          '75%': { transform: 'translate3d(-88px,18px,0)', opacity: '0.48' },
          '100%': { transform: 'translate3d(0,0,0)', opacity: '0.5' },
        },
        'dropdown-in': {
          '0%': { opacity: '0', transform: 'translate3d(0,-6px,0) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translate3d(0,0,0) scale(1)' },
        },
        'dropdown-out': {
          '0%': { opacity: '1', transform: 'translate3d(0,0,0) scale(1)' },
          '100%': { opacity: '0', transform: 'translate3d(0,-4px,0) scale(0.98)' },
        },
        'dialog-overlay-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'dialog-overlay-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'dialog-in': {
          '0%': { opacity: '0', transform: 'translate3d(0,14px,0) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translate3d(0,0,0) scale(1)' },
        },
        'dialog-out': {
          '0%': { opacity: '1', transform: 'translate3d(0,0,0) scale(1)' },
          '100%': { opacity: '0', transform: 'translate3d(0,10px,0) scale(0.985)' },
        },
        shimmer: {
          to: { backgroundPosition: '-200% 0' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'aurora-1': 'aurora-1 11s var(--ease-soft) infinite',
        'aurora-2': 'aurora-2 13s var(--ease-soft) infinite',
        'aurora-3': 'aurora-3 15s var(--ease-soft) infinite',
        'dropdown-in': 'dropdown-in 180ms var(--ease-brand) both',
        'dropdown-out': 'dropdown-out 140ms var(--ease-brand) both',
        'dialog-overlay-in': 'dialog-overlay-in 160ms var(--ease-brand) both',
        'dialog-overlay-out': 'dialog-overlay-out 120ms var(--ease-brand) both',
        'dialog-in': 'dialog-in 220ms var(--ease-brand) both',
        'dialog-out': 'dialog-out 160ms var(--ease-brand) both',
        shimmer: 'shimmer 1.4s linear infinite',
        spin: 'spin 0.8s linear infinite',
      },
    },
  },
} satisfies Config;
