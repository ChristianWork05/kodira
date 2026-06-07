'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserMe } from '@kodira/types';
import { getKodiraApiClient, useCourseBySlugQuery } from '@kodira/hooks';
import {
  AppShell,
  Atmosphere,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Layer,
  NoiseOverlay,
  Skeleton,
} from '@kodira/ui';
import {
  DashboardIcon,
  CubeIcon,
  ExitIcon,
  ExternalLinkIcon,
  GearIcon,
  IdCardIcon,
  MixerHorizontalIcon,
  PersonIcon,
  ReaderIcon,
} from '@radix-ui/react-icons';
import { getApiStatus } from '../../lib/apiError';

type SessionState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'error'; message: string }
  | { status: 'success'; user: UserMe };

type BreadcrumbItem = { label: string; href?: string };

function getInitials(user: Pick<UserMe, 'fullName' | 'username'>) {
  const base = (user.fullName?.trim() || user.username || '').trim();
  if (!base) return 'KU';
  const parts = base.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = (parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1]) ?? '';
  return (first + second).toUpperCase();
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = React.useState<SessionState>({ status: 'loading' });
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSession({ status: 'loading' });
      try {
        const api = getKodiraApiClient();
        const me = await api.users.getMe();
        if (cancelled) return;
        if (!me) {
          setSession({ status: 'guest' });
          return;
        }
        setSession({ status: 'success', user: me });
      } catch (err) {
        if (cancelled) return;
        const status = getApiStatus(err);
        if (status === 401) {
          router.replace('/login');
          return;
        }
        setSession({ status: 'error', message: 'No se pudo cargar tu sesión. Intenta recargar.' });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const isInstructor = session.status === 'success' && session.user.roles.includes('instructor');
  const isSeller = session.status === 'success' && session.user.roles.includes('seller');
  const isDashboard = pathname === '/dashboard';

  const nav = [
    { href: '/dashboard', label: 'Inicio', icon: <DashboardIcon className="h-4 w-4" /> },
    { href: '/courses', label: 'Cursos', icon: <ReaderIcon className="h-4 w-4" /> },
    { href: '/marketplace', label: 'Marketplace', icon: <CubeIcon className="h-4 w-4" /> },
    ...(isInstructor ? [{ href: '/studio', label: 'Studio', icon: <MixerHorizontalIcon className="h-4 w-4" /> }] : []),
    { href: '/seller', label: isSeller ? 'Panel vendedor' : 'Hacerme vendedor', icon: <IdCardIcon className="h-4 w-4" /> },
  ];

  const onLogout = async () => {
    try {
      const api = getKodiraApiClient();
      await api.auth.logout();
    } finally {
      router.replace('/login');
    }
  };

  const segments = React.useMemo(() => pathname.split('/').filter(Boolean), [pathname]);
  const courseSlug = segments[0] === 'courses' && segments[1] ? segments[1] : null;
  const isCourseLearn = segments[0] === 'courses' && segments[2] === 'learn';
  const courseQuery = useCourseBySlugQuery(courseSlug ?? '');

  const breadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    if (pathname === '/dashboard') return [{ label: 'Inicio' }];
    if (pathname === '/courses') return [{ label: 'Cursos' }];
    if (pathname === '/marketplace') return [{ label: 'Marketplace' }];
    if (pathname.startsWith('/courses/') && courseSlug) {
      const title = courseQuery.data?.title ?? courseSlug;
      return [
        { label: 'Cursos', href: '/courses' },
        { label: title, href: `/courses/${courseSlug}` },
        ...(isCourseLearn ? [{ label: 'Aula' }] : []),
      ];
    }
    if (pathname.startsWith('/marketplace/')) {
      if (segments[1] === 'sellers' && segments[2]) {
        return [
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Vendedor' },
        ];
      }
      if (segments[1]) {
        return [
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Oferta' },
        ];
      }
      return [{ label: 'Marketplace' }];
    }
    if (pathname.startsWith('/studio')) return [{ label: 'Studio' }];
    if (pathname.startsWith('/seller')) return [{ label: 'Panel vendedor' }];
    if (pathname.startsWith('/profile')) return [{ label: 'Perfil' }];
    if (pathname.startsWith('/settings')) return [{ label: 'Ajustes' }];
    return [{ label: 'KODIRA' }];
  }, [courseQuery.data?.title, courseSlug, isCourseLearn, pathname]);

  const topbar = (
    <>
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-2">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const Comp = item.href && !isLast ? 'a' : 'span';
            return (
              <li key={`${item.label}-${idx}`} className="flex min-w-0 items-center gap-2">
                <Comp
                  {...(Comp === 'a' ? { href: item.href } : {})}
                  className={
                    isLast
                      ? 'truncate font-display text-[15px] font-black tracking-[-0.02em] text-fg'
                      : 'truncate text-sm font-semibold text-fg-muted transition-colors duration-200 ease-brand hover:text-fg motion-reduce:transition-none'
                  }
                >
                  {courseQuery.isLoading && courseSlug && item.href === `/courses/${courseSlug}` ? (
                    <Skeleton className="h-[14px] w-[140px] rounded-full" />
                  ) : (
                    item.label
                  )}
                </Comp>
                {isLast ? null : (
                  <span aria-hidden="true" className="text-fg-dim">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {(() => {
          const isMarketplace = pathname === '/marketplace' || pathname.startsWith('/marketplace/');
          const placeholder = isMarketplace ? 'Buscar ofertas…' : 'Buscar cursos…';
          const targetBase = isMarketplace ? '/marketplace' : '/courses';
          return (
            <div className="relative w-[200px] max-w-[46vw] sm:w-[240px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-dim"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </svg>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="h-10 rounded-[11px] border-line/10 bg-surface pl-9 pr-3 text-[13px]"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  const q = search.trim();
                  router.push(q ? `${targetBase}?q=${encodeURIComponent(q)}` : targetBase);
                }}
                disabled={session.status !== 'success'}
                aria-label={placeholder}
              />
            </div>
          );
        })()}
        {session.status === 'success' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'relative h-[34px] w-[34px] overflow-hidden rounded-full',
                  'border border-line-strong/14 bg-[linear-gradient(120deg,rgba(59,130,246,0.16),rgba(99,102,241,0.16))]',
                  'ring-offset-bg transition-[transform,opacity] duration-200 ease-brand motion-reduce:transition-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-strong/30',
                  'data-[state=open]:ring-2 data-[state=open]:ring-primary/35',
                )}
                aria-label="Menú de usuario"
              >
                {session.user.avatarUrl ? (
                  <img
                    src={session.user.avatarUrl}
                    alt={session.user.fullName?.trim() || session.user.username}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[linear-gradient(120deg,#3B82F6,#6366F1)]">
                    <span className="text-[12px] font-black tracking-[-0.02em] text-white">
                      {getInitials(session.user)}
                    </span>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              <div className="px-3 py-2">
                <div className="truncate text-sm font-semibold text-fg">
                  {session.user.fullName?.trim() || session.user.username}
                </div>
                <div className="truncate text-xs text-fg-muted">{session.user.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  router.push('/profile');
                }}
              >
                <PersonIcon className="h-4 w-4 text-fg-dim" />
                Cuenta / Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  router.push('/settings');
                }}
              >
                <GearIcon className="h-4 w-4 text-fg-dim" />
                Ajustes
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  window.location.assign('/');
                }}
              >
                <ExternalLinkIcon className="h-4 w-4 text-fg-dim" />
                Ir a la web
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-danger data-[highlighted]:bg-danger/15 data-[highlighted]:text-danger-fg"
                onSelect={(e) => {
                  e.preventDefault();
                  void onLogout();
                }}
              >
                <ExitIcon className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : session.status === 'loading' ? (
          <Skeleton className="h-[34px] w-[34px] rounded-full" />
        ) : session.status === 'error' ? (
          <button
            type="button"
            className="h-[34px] rounded-full border border-line/10 bg-surface-2 px-3 text-[12px] font-semibold text-fg-muted transition-[transform,opacity] duration-200 ease-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-strong/30 motion-reduce:transition-none"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </>
  );

  return (
    <>
      <Atmosphere />
      <NoiseOverlay />
      <Layer>
        <AppShell
          routeKey={pathname}
          currentPath={pathname}
          contentClassName={isDashboard ? 'max-w-[1180px] px-[30px] pt-[34px] pb-[60px]' : undefined}
          topbarContent={topbar}
          nav={nav}
        >
          {children}
        </AppShell>
      </Layer>
    </>
  );
}
