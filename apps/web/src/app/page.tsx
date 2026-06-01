'use client';

import * as React from 'react';
import type { HealthDependencyStatus } from '@kodira/types';
import Link from 'next/link';
import { useHealthQuery } from '@kodira/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from '@kodira/ui';

function StatusDot({ status }: { status: 'ok' | 'danger' }) {
  return (
    <span
      aria-hidden
      className={[
        'h-2.5 w-2.5 rounded-full',
        status === 'ok' ? 'bg-success' : 'bg-danger',
        'shadow-[0_0_0_4px_hsl(var(--bg)),0_0_0_5px_hsl(var(--border))]',
      ].join(' ')}
    />
  );
}

function DependencyRow({ label, value }: { label: string; value: HealthDependencyStatus }) {
  const isUp = value === 'up';
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-3">
        <StatusDot status={isUp ? 'ok' : 'danger'} />
        <span className="text-sm text-fg">{label}</span>
      </div>
      <span className="font-mono text-xs text-muted-fg">{value}</span>
    </div>
  );
}

export default function HomePage() {
  const health = useHealthQuery();

  const overallVariant = health.data?.status === 'ok' ? ('ok' as const) : ('danger' as const);
  const overallLabel = health.data?.status === 'ok' ? 'OK' : 'DEGRADED';

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-10 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(80%_60%_at_50%_0%,hsl(var(--primary)_/_0.22),transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-xl">
        <header className="mb-7">
          <p className="font-mono text-xs tracking-wide text-muted-fg">KODIRA • System</p>
          <h1 className="font-display text-2xl leading-tight text-fg">Health check</h1>
          <p className="mt-1 text-sm text-muted-fg">
            Estado del backend (DB/Redis) según el contrato /api/v1/health.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/register">Register</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>API</CardTitle>
              <CardDescription>GET /api/v1/health</CardDescription>
            </div>

            {health.isLoading ? (
              <Skeleton className="h-7 w-20 rounded-full" />
            ) : health.isError ? (
              <Badge variant="danger">ERROR</Badge>
            ) : health.data ? (
              <Badge variant={overallVariant}>{overallLabel}</Badge>
            ) : (
              <Badge variant="neutral">EMPTY</Badge>
            )}
          </CardHeader>

          <CardContent>
            {health.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
                <Separator />
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              </div>
            ) : health.isError ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-fg">
                  No se pudo consultar el health. Verifica que{' '}
                  <span className="font-mono">apps/api</span> esté corriendo en{' '}
                  <span className="font-mono">:8000</span> (o ajusta{' '}
                  <span className="font-mono">NEXT_PUBLIC_API_URL</span>).
                </p>
                <Button variant="secondary" onClick={() => health.refetch()}>
                  Reintentar
                </Button>
              </div>
            ) : !health.data ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-fg">
                  La API respondió sin payload. Revisa el contrato y la implementación.
                </p>
                <Button variant="secondary" onClick={() => health.refetch()}>
                  Volver a intentar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <StatusDot status={health.data.status === 'ok' ? 'ok' : 'danger'} />
                    <span className="text-sm text-fg">Overall</span>
                  </div>
                  <span className="font-mono text-xs text-muted-fg">{health.data.status}</span>
                </div>

                <Separator />

                <DependencyRow label="Database" value={health.data.db} />
                <DependencyRow label="Redis" value={health.data.redis} />

                <Separator />

                <p className="text-xs text-muted-fg">
                  Última actualización:{' '}
                  <span className="font-mono">{new Date().toLocaleString('es-VE')}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
