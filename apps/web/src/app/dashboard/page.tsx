'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { UserMe } from '@kodira/types';
import { getKodiraApiClient } from '@kodira/hooks';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@kodira/ui';
import { getApiStatus } from '../../lib/apiError';

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; user: UserMe };

function getDisplayName(user: UserMe) {
  const name = user.fullName?.trim();
  if (name) return name;
  return user.username;
}

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = React.useState<ViewState>({ status: 'loading' });

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setState({ status: 'loading' });
      try {
        const client = getKodiraApiClient();
        const me = await client.users.getMe();
        if (cancelled) return;
        if (!me) {
          setState({ status: 'empty' });
          return;
        }
        setState({ status: 'success', user: me });
      } catch (err) {
        if (cancelled) return;
        const status = getApiStatus(err);
        if (status === 401) {
          router.replace('/login');
          return;
        }
        setState({
          status: 'error',
          message: 'No se pudo cargar tu sesión. Intenta recargar.',
        });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onLogout = async () => {
    try {
      const client = getKodiraApiClient();
      await client.auth.logout();
    } finally {
      router.replace('/login');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-10 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(80%_60%_at_50%_0%,hsl(var(--primary)_/_0.18),transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-xl">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-fg">KODIRA • Dashboard</p>
            <h1 className="font-display text-2xl leading-tight text-fg">Panel</h1>
            <p className="mt-1 text-sm text-muted-fg">Ruta protegida: GET /api/v1/users/me.</p>
          </div>
          <Button variant="secondary" onClick={onLogout}>
            Cerrar sesión
          </Button>
        </header>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sesión</CardTitle>
              <CardDescription>Tu perfil desde el backend.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {state.status === 'loading' ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : state.status === 'empty' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-fg">No hay datos de usuario para mostrar.</p>
                <Button variant="secondary" onClick={() => router.refresh()}>
                  Recargar
                </Button>
              </div>
            ) : state.status === 'error' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-fg">{state.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => router.refresh()}>
                    Recargar
                  </Button>
                  <Button variant="ghost" onClick={() => router.replace('/login')}>
                    Ir a login
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-base text-fg">
                  Hola, <span className="font-medium">{getDisplayName(state.user)}</span>
                </p>
                <p className="text-sm text-muted-fg">
                  <span className="font-mono text-xs">{state.user.email}</span> • roles:{' '}
                  <span className="font-mono text-xs">{state.user.roles.join(', ')}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

