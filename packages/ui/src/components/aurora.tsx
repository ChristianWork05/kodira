'use client';

import * as React from 'react';
import { cn } from '../utils/cn';

export function Aurora({
  className,
  intensity = 0.55,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-[-20%] -z-10 blur-[60px]', className)}
      style={{ opacity: intensity }}
    >
      <span
        className="absolute left-[5%] top-[8%] h-[46vw] w-[46vw] rounded-full mix-blend-screen animate-aurora-1"
        style={{ background: 'radial-gradient(circle,#3B82F6,transparent 60%)' }}
      />
      <span
        className="absolute right-0 top-0 h-[40vw] w-[40vw] rounded-full mix-blend-screen animate-aurora-2"
        style={{ background: 'radial-gradient(circle,#6366F1,transparent 60%)' }}
      />
      <span
        className="absolute bottom-[-10%] left-[30%] h-[38vw] w-[38vw] rounded-full mix-blend-screen animate-aurora-3"
        style={{ background: 'radial-gradient(circle,#7C3AED,transparent 60%)' }}
      />
    </div>
  );
}

