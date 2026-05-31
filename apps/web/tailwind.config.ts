import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        fg: 'hsl(var(--fg))',
        card: 'hsl(var(--card))',
        muted: 'hsl(var(--muted))',
        'muted-fg': 'hsl(var(--muted-fg))',
        border: 'hsl(var(--border))',
        primary: 'hsl(var(--primary))',
        'primary-fg': 'hsl(var(--primary-fg))',
        violet: 'hsl(var(--violet))',
        success: 'hsl(var(--success))',
        'success-fg': 'hsl(var(--success-fg))',
        danger: 'hsl(var(--danger))',
        'danger-fg': 'hsl(var(--danger-fg))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
