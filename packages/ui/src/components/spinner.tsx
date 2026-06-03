'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'h-9 w-9 rounded-full border-[3px] border-line/15 border-t-primary/80 animate-spin motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}

