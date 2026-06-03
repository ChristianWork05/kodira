'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export function Atmosphere({ className }: { className?: string }) {
  return <div aria-hidden className={cn('kodira-atmosphere', className)} />;
}

export function NoiseOverlay({ className }: { className?: string }) {
  return <div aria-hidden className={cn('kodira-noise', className)} />;
}

export function Layer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('kodira-layer', className)} {...props} />;
}

