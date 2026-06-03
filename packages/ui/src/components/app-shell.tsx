'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { PageTransition } from '../motion/PageTransition';
import { Logo, LogoMark } from './logo';

export interface AppShellNavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export function AppShell({
  nav,
  currentPath,
  title,
  subtitle,
  topbarContent,
  topbarActions,
  children,
  routeKey,
  className,
  contentClassName,
}: {
  nav: AppShellNavItem[];
  currentPath: string;
  title?: string;
  subtitle?: string;
  topbarContent?: React.ReactNode;
  topbarActions?: React.ReactNode;
  children: React.ReactNode;
  routeKey: string;
  className?: string;
  contentClassName?: string;
}) {
  const railRef = React.useRef<HTMLDivElement>(null);
  const [railExpanded, setRailExpanded] = React.useState(false);

  return (
    <div className={cn('min-h-[100dvh] lg:pl-[72px]', className)}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden lg:block',
          'overflow-hidden border-r border-line/10 bg-surface',
          'transition-[width,box-shadow] duration-300 ease-brand motion-reduce:transition-none',
          railExpanded ? 'w-[228px] shadow-[34px_0_70px_-34px_rgba(0,0,0,0.85)]' : 'w-[72px]',
        )}
      >
        <div
          ref={railRef}
          onMouseEnter={() => setRailExpanded(true)}
          onMouseLeave={() => setRailExpanded(false)}
          onFocusCapture={() => setRailExpanded(true)}
          onBlurCapture={(e) => {
            const next = e.relatedTarget as Node | null;
            if (!next || !railRef.current?.contains(next)) setRailExpanded(false);
          }}
          className="relative h-full"
        >
          <div className="flex h-full flex-col px-4 py-5">
            <a
              href="/"
              className={cn(
                'mb-5 flex items-center rounded-[12px] px-1 py-1 ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-strong/30',
                railExpanded ? 'justify-start' : 'justify-center',
              )}
              aria-label="KODIRA"
            >
              {railExpanded ? <Logo markSize={30} /> : <LogoMark size={34} aria-hidden="true" />}
            </a>

            <nav className="flex flex-1 flex-col gap-1">
              {nav.map((item) => {
                const active = currentPath === item.href || currentPath.startsWith(item.href + '/');
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-[12px] px-3 py-3 text-sm font-semibold ring-offset-bg',
                      'transition-[background-color,transform,color,border-color] duration-200 ease-brand motion-reduce:transition-none',
                      railExpanded ? 'justify-start gap-3' : 'justify-center',
                      active
                        ? 'border border-line-strong/14 bg-[linear-gradient(120deg,rgba(59,130,246,0.16),rgba(99,102,241,0.16))] text-fg'
                        : 'border border-transparent text-fg-muted hover:bg-white/5 hover:text-fg',
                    )}
                  >
                    <span
                      className={cn(
                        'grid w-6 place-items-center text-fg-muted transition-colors duration-200 ease-brand motion-reduce:transition-none',
                        active ? 'text-fg' : 'group-hover:text-fg',
                      )}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        'whitespace-nowrap overflow-hidden transition-[opacity,transform,width] duration-200 ease-brand motion-reduce:transition-none',
                        railExpanded ? 'w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-2',
                      )}
                    >
                      {item.label}
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 h-16 border-b border-line/10 bg-bg/60 px-4 backdrop-blur lg:px-[30px]">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-4">
          {topbarContent ? (
            topbarContent
          ) : (
            <>
              <a
                href="/"
                className="rounded-[12px] ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-strong/30"
                aria-label="KODIRA"
              >
                <Logo markSize={28} />
              </a>
              <div className="ml-2">
                {title ? <div className="font-display text-[18px] leading-none text-fg">{title}</div> : null}
                <div className="mt-1 text-sm text-fg-muted">{subtitle ?? 'Zona logueada'}</div>
              </div>
              {topbarActions ? <div className="ml-auto flex items-center gap-2">{topbarActions}</div> : null}
            </>
          )}
        </div>
      </header>

      <div className={cn('mx-auto w-full', contentClassName ?? 'max-w-[1320px] px-4 py-6')}>
        <PageTransition routeKey={routeKey}>
          <main className="min-w-0">{children}</main>
        </PageTransition>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/10 bg-bg/70 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1320px] items-center justify-around px-3 py-2">
          {nav.slice(0, 4).map((item) => {
            const active = currentPath === item.href || currentPath.startsWith(item.href + '/');
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex w-full flex-col items-center gap-1 rounded-[14px] px-2 py-2 text-[11px] font-semibold transition-[background-color,transform] duration-200 ease-brand active:translate-y-px motion-reduce:transition-none',
                  active ? 'text-fg' : 'text-fg-dim',
                )}
              >
                <span
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-[12px] border',
                    active ? 'border-line-strong/18 bg-white/6' : 'border-line/10 bg-bg-2',
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
