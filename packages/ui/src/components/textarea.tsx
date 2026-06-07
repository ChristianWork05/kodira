'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[104px] w-full resize-y rounded-[12px] border border-line/10 bg-surface px-3 py-2 text-sm text-fg',
      'placeholder:text-fg-dim',
      'transition-[border-color,box-shadow,transform,opacity] duration-200 ease-brand motion-reduce:transition-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
      'disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

