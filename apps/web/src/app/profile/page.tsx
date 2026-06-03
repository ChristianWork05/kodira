'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { UserMe } from '@kodira/types';
import { getKodiraApiClient } from '@kodira/hooks';
import { Badge, Card, CardContent, CardHeader, CardTitle, ErrorState, Skeleton } from '@kodira/ui';
import { getApiStatus } from '../../lib/apiError';

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; user: UserMe };

export default function ProfilePage() {
  const router = useRouter();
  const [state, setState] = React.useState<ViewState>({ status: 'loading' });

  const load = React.useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const api = getKodiraApiClient();
      const me = await api.users.getMe();
      setState({ status: 'success', user: me });
    } catch (err) {
      const status = getApiStatus(err);
      if (status === 401) {
        router.replace('/login');
        return;
      }
      setState({ status: 'error', message: 'No se pudo cargar tu perfil. Intenta de nuevo.' });
    }
  }, [router]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-[980px] pb-24">
      {state.status === 'error' ? (
        <ErrorState
          title="No se pudo cargar tu cuenta"
          description={state.message}
          action={
            <button
              type="button"
              className="rounded-[12px] border border-line/12 bg-surface-2 px-4 py-2 text-sm font-semibold text-fg transition-[transform,opacity] duration-200 ease-brand active:translate-y-px motion-reduce:transition-none"
              onClick={() => void load()}
            >
              Reintentar
            </button>
          }
        />
      ) : (
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Cuenta</CardTitle>
                <div className="mt-1 text-sm text-fg-muted">Información de tu sesión y perfil.</div>
              </div>
              {state.status === 'loading' ? (
                <Skeleton className="h-6 w-[120px] rounded-full" />
              ) : (
                <Badge variant="neutral">ACTIVA</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[14px] border border-line/10 bg-surface-2 p-4">
                <div className="text-xs font-semibold text-fg-dim">Nombre</div>
                <div className="mt-2 text-sm font-semibold text-fg">
                  {state.status === 'loading' ? (
                    <Skeleton className="h-5 w-[220px] rounded-full" />
                  ) : (
                    state.user.fullName?.trim() || state.user.username
                  )}
                </div>
              </div>
              <div className="rounded-[14px] border border-line/10 bg-surface-2 p-4">
                <div className="text-xs font-semibold text-fg-dim">Email</div>
                <div className="mt-2 text-sm font-semibold text-fg">
                  {state.status === 'loading' ? (
                    <Skeleton className="h-5 w-[260px] rounded-full" />
                  ) : (
                    state.user.email
                  )}
                </div>
              </div>
              <div className="rounded-[14px] border border-line/10 bg-surface-2 p-4">
                <div className="text-xs font-semibold text-fg-dim">Usuario</div>
                <div className="mt-2 text-sm font-semibold text-fg">
                  {state.status === 'loading' ? <Skeleton className="h-5 w-[160px] rounded-full" /> : state.user.username}
                </div>
              </div>
              <div className="rounded-[14px] border border-line/10 bg-surface-2 p-4">
                <div className="text-xs font-semibold text-fg-dim">Roles</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {state.status === 'loading'
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-6 w-[90px] rounded-full" />
                      ))
                    : state.user.roles.map((role) => (
                        <Badge key={role} variant="neutral">
                          {role.toUpperCase()}
                        </Badge>
                      ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

