'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-10 w-full rounded-[12px] border border-line/10 bg-surface px-3 text-sm text-fg',
      'transition-[border-color,box-shadow,transform,opacity] duration-200 ease-brand motion-reduce:transition-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
      'disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

