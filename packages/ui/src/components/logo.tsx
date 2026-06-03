'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export type LogoMarkProps = Omit<React.SVGProps<SVGSVGElement>, 'children'> & {
  size?: number;
};

export function LogoMark({ size, className, ...props }: LogoMarkProps) {
  const id = React.useId();
  const gradientId = `kodira-${id}`;
  const px = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="KODIRA"
      className={cn('shrink-0', className)}
      {...px}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="8" y1="8" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="27" fill={`url(#${gradientId})`} />
      <g stroke="#ffffff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
        <path d="M35 28V72" />
        <path d="M35 50L67 28" />
        <path d="M35 50L67 72" />
      </g>
    </svg>
  );
}

export type LogoProps = React.HTMLAttributes<HTMLDivElement> & {
  markSize?: number;
};

export function Logo({ className, markSize = 30, ...props }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)} {...props}>
      <LogoMark size={markSize} aria-hidden="true" />
      <div className="font-display text-[20px] font-black tracking-[-0.03em] text-fg">KODIRA</div>
    </div>
  );
}
