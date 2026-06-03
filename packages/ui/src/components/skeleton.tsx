'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        [
          'rounded-md',
          'bg-[linear-gradient(100deg,hsl(var(--surface-2))_30%,rgba(255,255,255,0.07)_50%,hsl(var(--surface-2))_70%)]',
          'bg-[length:200%_100%] animate-shimmer motion-reduce:animate-none',
        ],
        className,
      )}
      {...props}
    />
  );
}
