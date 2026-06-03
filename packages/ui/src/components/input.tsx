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
            'h-11 w-full rounded-[12px] border border-line/12 bg-bg-2 px-4 text-[15px] text-fg',
            'placeholder:text-fg-dim',
            'transition-[transform,box-shadow,border-color] duration-200 ease-brand motion-reduce:transition-none',
            'focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0',
            'disabled:opacity-60',
          ],
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

