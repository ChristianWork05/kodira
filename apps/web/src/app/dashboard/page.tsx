'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CourseListItem, GetCourseLessonsResponse, UserMe } from '@kodira/types';
import { getKodiraApiClient, useCourseLessonsQuery, useCoursesQuery, useMyCoursesQuery } from '@kodira/hooks';
import {
  Badge,
  Button,
  Progress,
  Skeleton,
} from '@kodira/ui';
import { getApiStatus } from '../../lib/apiError';

type SessionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; user: UserMe };

function getDisplayName(user: UserMe) {
  const name = user.fullName?.trim();
  if (name) return name;
  return user.username;
}

function hashToIndex(input: string, modulo: number) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return modulo === 0 ? 0 : h % modulo;
}

function coverGradient(seed: string) {
  const variants = [
    'linear-gradient(120deg,#3B82F6,#6366F1)',
    'linear-gradient(120deg,#6366F1,#7C3AED)',
    'linear-gradient(120deg,#0EA5E9,#3B82F6)',
  ];
  return variants[hashToIndex(seed, variants.length)] ?? variants[0]!;
}

function formatPrice(course: CourseListItem) {
  if (course.isFree || course.price === 0) return 'Gratis';
  return `$${course.discountPrice ?? course.price}`;
}

function findLessonMeta(lessons: GetCourseLessonsResponse | undefined, lessonId: string | null) {
  if (!lessons || !lessonId) return null;
  for (const section of lessons.sections ?? []) {
    for (const lesson of section.lessons ?? []) {
      if (lesson.id === lessonId) return { lessonTitle: lesson.title, lessonOrder: lesson.order };
    }
  }
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = React.useState<SessionState>({ status: 'loading' });
  const myCoursesQuery = useMyCoursesQuery({ page: 1, limit: 20 });
  const recommendedQuery = useCoursesQuery({ page: 1, limit: 3, sort: 'popular' });

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setSession({ status: 'loading' });
      try {
        const client = getKodiraApiClient();
        const me = await client.users.getMe();
        if (cancelled) return;
        setSession({ status: 'success', user: me });
      } catch (err) {
        if (cancelled) return;
        const status = getApiStatus(err);
        if (status === 401) {
          router.replace('/login');
          return;
        }
        setSession({
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

  React.useEffect(() => {
    if (!myCoursesQuery.isError) return;
    const status = getApiStatus(myCoursesQuery.error);
    if (status === 401) router.replace('/login');
  }, [myCoursesQuery.error, myCoursesQuery.isError, router]);

  const items = myCoursesQuery.data?.items ?? [];
  const activeCourses = items.filter((x) => !x.enrollment.isCompleted);
  const avgProgress =
    items.length === 0 ? 0 : Math.round(items.reduce((acc, it) => acc + (it.enrollment.progressPercentage ?? 0), 0) / items.length);
  const continueItem =
    items.find((it) => Boolean(it.lastLessonId)) ??
    items.find((it) => (it.enrollment.progressPercentage ?? 0) > 0) ??
    activeCourses[0] ??
    null;

  const lessonsQuery = useCourseLessonsQuery(continueItem?.course.id ?? '');

  React.useEffect(() => {
    if (!lessonsQuery.isError) return;
    const status = getApiStatus(lessonsQuery.error);
    if (status === 401) router.replace('/login');
  }, [lessonsQuery.error, lessonsQuery.isError, router]);

  const continueLesson = React.useMemo(
    () => findLessonMeta(lessonsQuery.data, continueItem?.lastLessonId ?? null),
    [continueItem?.lastLessonId, lessonsQuery.data],
  );

  const stats = React.useMemo(() => {
    const out: Array<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = [];
    out.push({
      label: 'Cursos activos',
      value: <span className="bg-[var(--gradient-brand)] bg-clip-text font-display text-[28px] font-black text-transparent">{activeCourses.length}</span>,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-primary/80">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      ),
    });
    out.push({
      label: 'Progreso medio',
      value: (
        <span className="bg-[var(--gradient-brand)] bg-clip-text font-display text-[28px] font-black text-transparent">
          {avgProgress}%
        </span>
      ),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-primary/80">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l3 3 5-6" />
        </svg>
      ),
    });
    if (session.status === 'success') {
      out.push({
        label: 'Racha (días)',
        value: (
          <span className="bg-[var(--gradient-brand)] bg-clip-text font-display text-[28px] font-black text-transparent">
            {session.user.currentStreak}
          </span>
        ),
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-primary/80">
            <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
          </svg>
        ),
      });
    }
    return out;
  }, [activeCourses.length, avgProgress, session]);

  const myCoursesState = myCoursesQuery.isLoading ? 'loading' : myCoursesQuery.isError ? 'error' : 'success';
  const showLearningSections = myCoursesState === 'success' && items.length > 0;

  return (
    <div className="pb-24">
      <div className="mb-6">
        {session.status === 'loading' ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-56" />
          </div>
        ) : session.status === 'error' ? (
          <div className="rounded-[12px] border border-danger/25 bg-surface px-6 py-6">
            <div className="font-display text-[18px] leading-[1.15] text-fg">No se pudo cargar tu sesión</div>
            <div className="mt-2 text-sm leading-6 text-fg-muted">{session.message}</div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => router.refresh()}>
                Recargar
              </Button>
              <Button variant="ghost" onClick={() => router.replace('/login')}>
                Ir a login
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="font-display text-[30px] font-black leading-[1.1] tracking-[-0.02em] text-fg">
              Hola, {getDisplayName(session.user)} 👋
            </div>
            <div className="mt-1 text-[15px] text-fg-muted">Continúa donde lo dejaste.</div>
          </div>
        )}
      </div>

      {myCoursesState === 'loading' ? (
        <section className="mb-6 overflow-hidden rounded-[20px] border border-line-strong/14 bg-surface">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
            <div className="min-h-[190px] bg-bg-2" />
            <div className="px-7 py-7">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-3 h-7 w-[420px] max-w-full" />
              <Skeleton className="mt-2 h-5 w-72" />
              <div className="mt-5 space-y-2">
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="mt-6 h-11 w-44 rounded-[12px]" />
            </div>
          </div>
        </section>
      ) : myCoursesState === 'error' ? (
        <div className="mb-8 rounded-[12px] border border-danger/25 bg-surface px-6 py-6">
          <div className="font-display text-[18px] leading-[1.15] text-fg">No se pudieron cargar tus cursos</div>
          <div className="mt-2 text-sm leading-6 text-fg-muted">Intenta recargar.</div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => myCoursesQuery.refetch()}>
              Reintentar
            </Button>
            <Button asChild variant="ghost">
              <Link href="/courses">Ir al catálogo</Link>
            </Button>
          </div>
        </div>
      ) : showLearningSections && continueItem ? (
        <section className="mb-6 overflow-hidden rounded-[20px] border border-line-strong/14 bg-surface">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
            <div
              className="relative min-h-[190px] overflow-hidden"
              style={{ backgroundImage: coverGradient(continueItem.course.slug) }}
            >
              {continueItem.course.thumbnailUrl ? (
                <img
                  src={continueItem.course.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-65"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 [background:radial-gradient(140px_100px_at_75%_20%,rgba(255,255,255,.28),transparent)]" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-14 w-14 place-items-center rounded-full border border-white/35 bg-white/18 backdrop-blur">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center px-7 py-7">
              <div className="font-mono text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
                Continuar aprendiendo
              </div>
              <div className="mt-2 font-display text-[24px] font-bold leading-[1.1] tracking-[-0.02em] text-fg">
                {continueItem.course.title}
              </div>
              <div className="mt-1 text-sm text-fg-muted">
                {continueLesson ? `Lección ${continueLesson.lessonOrder} · ${continueLesson.lessonTitle}` : 'Lección en curso'}
              </div>

              <div className="mt-4">
                <Progress value={continueItem.enrollment.progressPercentage} className="h-[7px]" />
                <div className="mt-2 flex items-center justify-between text-xs text-fg-dim">
                  <div>
                    <span className="font-mono">{Math.round(continueItem.enrollment.progressPercentage)}%</span> completado
                  </div>
                  <div className="font-mono">
                    {Math.round((continueItem.enrollment.progressPercentage / 100) * continueItem.course.metrics.lessonCount)} /{' '}
                    {continueItem.course.metrics.lessonCount} lecciones
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Button asChild>
                  <Link
                    href={
                      continueItem.lastLessonId
                        ? `/courses/${continueItem.course.slug}/learn?lessonId=${continueItem.lastLessonId}`
                        : `/courses/${continueItem.course.slug}/learn`
                    }
                  >
                    Continuar lección
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="mb-8 rounded-[12px] border border-line/10 bg-surface px-6 py-6">
          <div className="font-display text-[18px] leading-[1.15] text-fg">Empieza por el catálogo</div>
          <div className="mt-2 text-sm leading-6 text-fg-muted">Inscríbete en tu primer curso y vuelve aquí para continuar.</div>
          <div className="mt-5">
            <Button asChild variant="secondary">
              <Link href="/courses">Explorar catálogo</Link>
            </Button>
          </div>
        </div>
      )}

      {myCoursesState === 'loading' ? (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[15px] border border-line/10 bg-surface px-5 py-4">
              <div className="mb-3 grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-line-strong/14 bg-bg-2">
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-8 w-28" />
              <Skeleton className="mt-2 h-4 w-24" />
            </div>
          ))}
        </section>
      ) : showLearningSections ? (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[15px] border border-line/10 bg-surface px-5 py-4 transition-[transform,border-color] duration-300 ease-brand hover:-translate-y-1 hover:border-line-strong/14 motion-reduce:transition-none"
            >
              <div className="mb-3 grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-line-strong/14 bg-[linear-gradient(120deg,rgba(59,130,246,0.16),rgba(99,102,241,0.16))]">
                {s.icon}
              </div>
              <div>{s.value}</div>
              <div className="mt-1 text-[12.5px] text-fg-dim">{s.label}</div>
            </div>
          ))}
        </section>
      ) : null}

      {showLearningSections ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-[19px] font-bold leading-[1.1] tracking-[-0.02em] text-fg">Mis cursos</div>
            <Link href="/courses" className="text-[13.5px] font-medium text-primary hover:underline">
              Ver todos →
            </Link>
          </div>

          <section className="mb-9 grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 6).map((item, idx) => (
              <Link
                key={item.course.id}
                href={item.lastLessonId ? `/courses/${item.course.slug}/learn?lessonId=${item.lastLessonId}` : `/courses/${item.course.slug}/learn`}
                className="group overflow-hidden rounded-[16px] border border-line/10 bg-surface transition-[transform,box-shadow,border-color] duration-300 ease-brand hover:-translate-y-1 hover:border-line-strong/14 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.75)] motion-reduce:transition-none"
              >
                <div className="relative h-[120px]" style={{ backgroundImage: coverGradient(`${item.course.slug}-${idx}`) }}>
                  {item.course.thumbnailUrl ? (
                    <img
                      src={item.course.thumbnailUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-70"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="text-[15px] font-bold text-fg">{item.course.title}</div>
                  <div className="mt-1 text-xs text-fg-dim">
                    {Math.round((item.enrollment.progressPercentage / 100) * item.course.metrics.lessonCount)} /{' '}
                    {item.course.metrics.lessonCount} lecciones
                  </div>
                  <div className="mt-3">
                    <Progress value={item.enrollment.progressPercentage} className="h-[6px]" />
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <div className="font-display text-[19px] font-bold leading-[1.1] tracking-[-0.02em] text-fg">Recomendados para ti</div>
        <Link href="/courses" className="text-[13.5px] font-medium text-primary hover:underline">
          Explorar catálogo →
        </Link>
      </div>

      <section className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
        {recommendedQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[16px] border border-line/10 bg-surface">
              <div className="h-[120px] bg-bg-2" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-40" />
                <div className="pt-2">
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
            </div>
          ))
        ) : recommendedQuery.isError ? (
          <div className="col-span-full rounded-[12px] border border-danger/25 bg-surface px-6 py-6">
            <div className="font-display text-[18px] leading-[1.15] text-fg">No se pudo cargar el catálogo</div>
            <div className="mt-2 text-sm leading-6 text-fg-muted">Intenta recargar para ver recomendados.</div>
            <div className="mt-5">
              <Button variant="secondary" onClick={() => recommendedQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          </div>
        ) : (recommendedQuery.data?.items ?? []).map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="group overflow-hidden rounded-[16px] border border-line/10 bg-surface transition-[transform,box-shadow,border-color] duration-300 ease-brand hover:-translate-y-1 hover:border-line-strong/14 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.75)] motion-reduce:transition-none"
          >
            <div className="relative h-[120px]" style={{ backgroundImage: coverGradient(course.slug) }}>
              <Badge variant="neutral" className="absolute left-3 top-3 border-white/15 bg-black/40 text-fg">
                {course.category?.name ?? 'Curso'}
              </Badge>
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-75"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>
            <div className="p-4">
              <div className="text-[15px] font-bold text-fg">{course.title}</div>
              <div className="mt-1 text-xs text-fg-dim">{course.instructor.fullName ?? course.instructor.username}</div>
              <div className="mt-3 flex items-center justify-between">
                <div className="bg-[var(--gradient-brand)] bg-clip-text font-display text-[15px] font-bold text-transparent">
                  {formatPrice(course)}
                </div>
                <Badge variant="available">Disponible</Badge>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

