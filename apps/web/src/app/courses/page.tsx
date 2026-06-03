'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CourseLevel, CourseListItem, ListCoursesQuery } from '@kodira/types';
import { useCourseCategoriesQuery, useCoursesQuery } from '@kodira/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  Reveal,
  RevealItem,
  Skeleton,
  Tabs,
} from '@kodira/ui';

function toNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function parseBool(value: string | null): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function formatLevel(level: CourseLevel) {
  if (level === 'beginner') return 'Principiante';
  if (level === 'intermediate') return 'Intermedio';
  return 'Avanzado';
}

function CourseCard({ course }: { course: CourseListItem }) {
  const instructorName = course.instructor.fullName?.trim() || course.instructor.username;
  const courseInitial = course.title.trim().slice(0, 1).toUpperCase();
  const categoryLabel = course.category?.name?.trim() ? course.category.name.trim() : 'KODIRA';

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={[
        'group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
        'hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:transform-none',
      ].join(' ')}
    >
      <Card variant="gradient" className="h-full">
        <CardHeader className="items-start">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-[12px] border border-line/10 bg-bg-2">
                  <span className="font-display text-base font-black text-fg">{courseInitial || 'K'}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-fg">{categoryLabel}</div>
                  <div className="truncate text-[11px] text-fg-muted">{instructorName}</div>
                </div>
              </div>
              <CardTitle className="mt-3">{course.title}</CardTitle>
              <CardDescription className="mt-1">
                {course.shortDescription?.trim() ? course.shortDescription.trim() : 'Sin descripción corta.'}
              </CardDescription>
            </div>
            <Badge variant={course.isFree ? 'ok' : 'neutral'}>{course.isFree ? 'Gratis' : `${course.price}`}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{course.category ? course.category.name : 'Sin categoría'}</Badge>
            <Badge variant="neutral">{formatLevel(course.level)}</Badge>
          </div>
          <div className="text-xs text-fg-muted">
            <span className="font-mono">{course.metrics.lessonCount} lecciones</span>
            <span className="px-2 text-line/60">·</span>
            <span className="font-mono">{course.metrics.durationHours}h</span>
            <span className="px-2 text-line/60">·</span>
            <span className="font-mono">{course.metrics.enrollmentCount} inscritos</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function CoursesCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = toNumber(searchParams.get('page')) ?? 1;
  const limit = toNumber(searchParams.get('limit')) ?? 12;
  const categorySlug = searchParams.get('categorySlug') ?? undefined;
  const level = (searchParams.get('level') as CourseLevel | null) ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const isFree = parseBool(searchParams.get('isFree'));
  const sort = (searchParams.get('sort') as ListCoursesQuery['sort'] | null) ?? undefined;
  const [searchValue, setSearchValue] = React.useState(q ?? '');

  React.useEffect(() => {
    setSearchValue(q ?? '');
  }, [q]);

  const query: ListCoursesQuery = React.useMemo(
    () => ({
      page,
      limit,
      categorySlug,
      level,
      q,
      isFree,
      sort,
    }),
    [page, limit, categorySlug, level, q, isFree, sort],
  );

  const categories = useCourseCategoriesQuery();
  const courses = useCoursesQuery(query);

  const setParams = React.useCallback(
    (patch: Record<string, string | undefined | null>, resetPage?: boolean) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      if (resetPage) next.delete('page');
      const qs = next.toString();
      router.push(qs ? `/courses?${qs}` : '/courses');
    },
    [router, searchParams],
  );

  const totalPages = courses.data?.totalPages ?? 1;

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-6 pb-24">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-[26px] font-black leading-[1.08] tracking-[-0.03em] text-fg">
            Catálogo
          </div>
          <div className="mt-1 text-sm text-fg-muted">Cursos publicados. Búsqueda y filtros.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="glass" size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <Card variant="glass">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Encuentra un curso y entra al detalle.</CardDescription>
            </div>
            {courses.isLoading ? (
              <Badge variant="neutral">CARGANDO</Badge>
            ) : courses.isError ? (
              <Badge variant="danger">ERROR</Badge>
            ) : courses.data ? (
              <Badge variant="neutral">{courses.data.total}</Badge>
            ) : (
              <Badge variant="neutral">0</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-2">
              <label className="text-sm text-fg" htmlFor="q">
                Buscar
              </label>
              <Input
                id="q"
                placeholder="React, NestJS, testing..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  const value = (e.currentTarget.value ?? '').trim();
                  setParams({ q: value || undefined }, true);
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-fg">Nivel</div>
              <Tabs
                value={level ?? ''}
                onValueChange={(v) => setParams({ level: v || undefined }, true)}
                items={[
                  { value: '', label: 'Todos' },
                  { value: 'beginner', label: 'Principiante' },
                  { value: 'intermediate', label: 'Intermedio' },
                  { value: 'advanced', label: 'Avanzado' },
                ]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-fg">Categorías</div>
            <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              <Button
                variant={categorySlug ? 'glass' : 'secondary'}
                size="sm"
                onClick={() => setParams({ categorySlug: undefined }, true)}
              >
                Todas
              </Button>
              {categories.isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-9 w-[120px] shrink-0 rounded-[12px] border border-line/10 bg-bg-2">
                      <div className="h-full w-full animate-pulse rounded-[inherit] bg-white/5" />
                    </div>
                  ))
                : categories.data?.map((c) => (
                    <Button
                      key={c.id}
                      variant={categorySlug === c.slug ? 'secondary' : 'glass'}
                      size="sm"
                      onClick={() => setParams({ categorySlug: c.slug }, true)}
                    >
                      {c.name}
                    </Button>
                  ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm text-fg">Precio</div>
              <Tabs
                value={isFree === undefined ? 'all' : isFree ? 'free' : 'paid'}
                onValueChange={(v) =>
                  setParams(
                    { isFree: v === 'all' ? undefined : v === 'free' ? 'true' : 'false' },
                    true,
                  )
                }
                items={[
                  { value: 'all', label: 'Todos' },
                  { value: 'free', label: 'Gratis' },
                  { value: 'paid', label: 'De pago' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-fg">Orden</div>
              <Tabs
                value={sort ?? ''}
                onValueChange={(v) => setParams({ sort: v || undefined }, true)}
                items={[
                  { value: '', label: 'Relevancia' },
                  { value: 'popular', label: 'Popular' },
                  { value: 'new', label: 'Nuevo' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setParams(
                  {
                    q: undefined,
                    categorySlug: undefined,
                    level: undefined,
                    isFree: undefined,
                    sort: undefined,
                  },
                  true,
                )
              }
            >
              Limpiar
            </Button>
            <Button variant="ghost" onClick={() => courses.refetch()}>
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {courses.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} variant="solid">
              <CardHeader>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.isError ? (
        <ErrorState
          title="No se pudo cargar el catálogo"
          description="Verifica que la API esté disponible y reintenta."
          action={
            <Button variant="secondary" onClick={() => courses.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : !courses.data || courses.data.items.length === 0 ? (
        <EmptyState
          title="No hay cursos"
          description="Prueba otros filtros o borra la búsqueda."
          action={
            <Button
              variant="secondary"
              onClick={() =>
                setParams(
                  {
                    q: undefined,
                    categorySlug: undefined,
                    level: undefined,
                    isFree: undefined,
                    sort: undefined,
                  },
                  true,
                )
              }
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          <Reveal>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.data.items.map((course) => (
                <RevealItem key={course.id}>
                  <CourseCard course={course} />
                </RevealItem>
              ))}
            </div>
          </Reveal>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-fg-muted">
              Página <span className="font-mono text-fg">{courses.data.page}</span> de{' '}
              <span className="font-mono text-fg">{courses.data.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setParams({ page: String(Math.max(1, page - 1)) })}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setParams({ page: String(Math.min(totalPages, page + 1)) })}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
