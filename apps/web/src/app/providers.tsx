'use client';

import * as React from 'react';
import { KodiraQueryProvider } from '@kodira/hooks';

export function Providers({ children }: { children: React.ReactNode }) {
  return <KodiraQueryProvider>{children}</KodiraQueryProvider>;
}
