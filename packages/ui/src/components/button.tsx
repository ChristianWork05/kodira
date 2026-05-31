'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md',
    'text-sm font-medium transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:opacity-95',
        secondary: 'bg-muted text-fg hover:bg-muted/80',
        ghost: 'bg-transparent text-fg hover:bg-muted/60',
        destructive: 'bg-danger text-danger-fg hover:opacity-95',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={type ?? 'button'}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
