'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  [
    'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
    'transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        ok: 'border-success/25 bg-success/12 text-success-fg',
        danger: 'border-danger/25 bg-danger/12 text-danger-fg',
        neutral: 'border-border/60 bg-muted/40 text-fg',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
