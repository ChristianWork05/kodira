'use client';

import * as React from 'react';
import Link from 'next/link';
import { Atmosphere, Aurora, Layer, Logo, NoiseOverlay } from '@kodira/ui';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Atmosphere />
      <NoiseOverlay />
      <Layer>
        <div className="relative min-h-[100dvh] overflow-hidden bg-bg px-5 py-12 sm:px-8">
          <Aurora intensity={0.55} />
          <div className="relative mx-auto w-full max-w-md">
            <Link
              href="/"
              className="mb-10 inline-flex rounded-[14px] px-1 py-1 ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              aria-label="KODIRA"
            >
              <Logo markSize={34} />
            </Link>
            {children}
          </div>
        </div>
      </Layer>
    </>
  );
}
