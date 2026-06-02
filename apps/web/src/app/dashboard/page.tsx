'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ListMyCoursesResponse, MyCourseItem, UserMe } from '@kodira/types';
import { getKodiraApiClient } from '@kodira/hooks';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@kodira/ui';
import { getApiStatus } from '../../lib/apiError';

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; user: UserMe };

type CoursesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; data: ListMyCoursesResponse };

function getDisplayName(user: UserMe) {
  const name = user.fullName?.trim();
  if (name) return name;
  return user.username;
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full rounded-full bg-muted/50">
      <div
        aria-hidden
        className="h-2 origin-left rounded-full bg-primary transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
    </div>
  );
}

function MyCourseRow({ item }: { item: MyCourseItem }) {
  const continueHref = `/courses/${item.course.slug}`;
  const ctaLabel = item.lastLessonId ? 'Continuar' : 'Ver curso';

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{item.course.title}</p>
          <p className="mt-0.5 text-xs text-muted-fg">
            Progreso: <span className="font-mono text-fg">{item.enrollment.progressPercentage}%</span>
            {item.lastLessonId ? (
              <>
                <span className="px-2 text-border/80">|</span>
                <span className="font-mono">{item.lastLessonId}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={continueHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar value={item.enrollment.progressPercentage} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = React.useState<ViewState>({ status: 'loading' });
  const [coursesState, setCoursesState] = React.useState<CoursesState>({ status: 'loading' });

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setState({ status: 'loading' });
      setCoursesState({ status: 'loading' });
      try {
        const client = getKodiraApiClient();
        const [me, myCourses] = await Promise.all([
          client.users.getMe(),
          client.education.listMyCourses({ page: 1, limit: 20 }),
        ]);
        if (cancelled) return;
        if (!me) {
          setState({ status: 'empty' });
          setCoursesState({ status: 'empty' });
          return;
        }
        setState({ status: 'success', user: me });
        if (!myCourses || myCourses.items.length === 0) {
          setCoursesState({ status: 'empty' });
        } else {
          setCoursesState({ status: 'success', data: myCourses });
        }
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
        setCoursesState({
          status: 'error',
          message: 'No se pudieron cargar tus cursos. Intenta recargar.',
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

      <div className="relative mx-auto w-full max-w-4xl">
        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-fg">KODIRA • Dashboard</p>
            <h1 className="font-display text-2xl leading-tight text-fg">Panel</h1>
            <p className="mt-1 text-sm text-muted-fg">Ruta protegida: GET /api/v1/users/me.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/courses">Catálogo</Link>
            </Button>
            <Button variant="secondary" onClick={onLogout}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        <Card className="mb-6">
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

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Mis cursos</CardTitle>
              <CardDescription>Inscripciones y progreso desde GET /api/v1/me/courses.</CardDescription>
            </div>
            {coursesState.status === 'loading' ? (
              <Badge variant="neutral">CARGANDO</Badge>
            ) : coursesState.status === 'error' ? (
              <Badge variant="danger">ERROR</Badge>
            ) : coursesState.status === 'empty' ? (
              <Badge variant="neutral">VACÍO</Badge>
            ) : (
              <Badge variant="neutral">{coursesState.data.total}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {coursesState.status === 'loading' ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-72" />
                      <Skeleton className="h-3 w-64" />
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : coursesState.status === 'error' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-fg">{coursesState.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => router.refresh()}>
                    Recargar
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/courses">Ir al catálogo</Link>
                  </Button>
                </div>
              </div>
            ) : coursesState.status === 'empty' ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-fg">
                  Aún no estás inscrito en ningún curso. Empieza por el catálogo.
                </p>
                <Button asChild variant="secondary">
                  <Link href="/courses">Explorar cursos</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {coursesState.data.items.map((item) => (
                  <MyCourseRow key={item.course.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

