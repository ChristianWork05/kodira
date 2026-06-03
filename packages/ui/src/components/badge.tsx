'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  [
    'inline-flex items-center gap-2 rounded-[10px] border px-2.5 py-1 text-xs font-semibold',
    'transition-[opacity,transform,background-color,border-color] duration-200 ease-brand motion-reduce:transition-none',
  ],
  {
    variants: {
      variant: {
        neutral: 'border-line-strong/16 bg-white/4 text-fg-muted',
        available: 'border-success/30 bg-success/12 text-success-fg',
        inProgress: 'border-primary/30 bg-primary/14 text-fg',
        soon: 'border-line-strong/16 bg-white/4 text-fg-muted',
        ok: 'border-success/30 bg-success/12 text-success-fg',
        danger: 'border-danger/30 bg-danger/12 text-danger-fg',
      },
    },
    defaultVariants: {
      variant: 'soon',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
