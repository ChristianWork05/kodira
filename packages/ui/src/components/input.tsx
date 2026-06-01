'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          [
            'h-10 w-full rounded-md border border-border/70 bg-muted/40 px-3 text-sm text-fg',
            'placeholder:text-muted-fg/70',
            'transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0',
            'disabled:opacity-60',
            'motion-reduce:transition-none',
          ],
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

