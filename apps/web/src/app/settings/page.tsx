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

function valueOrDash(value: string | null | undefined) {
  const v = value?.trim();
  return v ? v : '—';
}

export default function SettingsPage() {
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
      setState({ status: 'error', message: 'No se pudieron cargar tus ajustes. Intenta de nuevo.' });
    }
  }, [router]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6 pb-24">
      {state.status === 'error' ? (
        <ErrorState
          title="No se pudieron cargar los ajustes"
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
                <CardTitle>Ajustes</CardTitle>
                <div className="mt-1 text-sm text-fg-muted">Preferencias de idioma y región.</div>
              </div>
              {state.status === 'loading' ? (
                <Skeleton className="h-6 w-[120px] rounded-full" />
              ) : state.user.emailVerified ? (
                <Badge variant="neutral">EMAIL VERIFICADO</Badge>
              ) : (
                <Badge variant="danger">EMAIL SIN VERIFICAR</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[14px] border border-line/10 bg-surface-2 p-4">
                <div className="text-xs font-semibold text-fg-dim">Idioma</div>
                <div className="mt-2 text-sm font-semibold text-fg">
                  {state.status === 'loading' ? (
                    <Skeleton className="h-5 w-[90px] rounded-full" />
                  ) : (
                    valueOrDash(state.user.preferredLanguage)
                  )}
                </div>
              </div>
              <div className="rounded-[14px] border border-line/10 bg-surface-2 p-4">
                <div className="text-xs font-semibold text-fg-dim">Zona horaria</div>
                <div className="mt-2 text-sm font-semibold text-fg">
                  {state.status === 'loading' ? (
                    <Skeleton className="h-5 w-[140px] rounded-full" />
                  ) : (
                    valueOrDash(state.user.timezone)
                  )}
                </div>
              </div>
              <div className="rounded-[14px] border border-line/10 bg-surface-2 p-4">
                <div className="text-xs font-semibold text-fg-dim">País</div>
                <div className="mt-2 text-sm font-semibold text-fg">
                  {state.status === 'loading' ? (
                    <Skeleton className="h-5 w-[70px] rounded-full" />
                  ) : (
                    valueOrDash(state.user.country)
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

