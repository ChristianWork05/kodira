'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CourseLevel, CourseListItem, ListCoursesQuery } from '@kodira/types';
import { useCourseCategoriesQuery, useCoursesQuery } from '@kodira/hooks';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Skeleton } from '@kodira/ui';

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

function Select({
  id,
  value,
  onChange,
  children,
  'aria-label': ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  'aria-label': string;
}) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      className={[
        'h-10 w-full rounded-md border border-border/70 bg-muted/40 px-3 text-sm text-fg',
        'transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0',
        'motion-reduce:transition-none',
      ].join(' ')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

function formatLevel(level: CourseLevel) {
  if (level === 'beginner') return 'Principiante';
  if (level === 'intermediate') return 'Intermedio';
  return 'Avanzado';
}

function CourseCard({ course }: { course: CourseListItem }) {
  const instructorName = course.instructor.fullName?.trim() || course.instructor.username;
  const priceLabel = course.isFree ? 'Gratis' : `${course.price}`;
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
      <Card className="h-full">
        <div className="relative overflow-hidden rounded-t-xl border-b border-border/60 bg-card/30">
          <div
            aria-hidden
            className="absolute inset-0 opacity-90 [background:radial-gradient(80%_70%_at_15%_15%,hsl(var(--primary)_/_0.30),transparent_55%),radial-gradient(70%_60%_at_85%_0%,hsl(var(--violet)_/_0.26),transparent_60%)]"
          />
          <div className="relative flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-border/60 bg-bg/40">
                <span className="font-display text-base text-fg">{courseInitial || 'K'}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-fg/90">{categoryLabel}</p>
                <p className="truncate text-[11px] text-muted-fg">{instructorName}</p>
              </div>
            </div>
            <Badge variant={course.isFree ? 'ok' : 'neutral'}>{priceLabel}</Badge>
          </div>
        </div>

        <CardHeader className="items-start">
          <div className="min-w-0">
            <CardTitle>{course.title}</CardTitle>
            <CardDescription className="mt-1">
              {course.shortDescription?.trim()
                ? course.shortDescription.trim()
                : 'Sin descripción corta.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {course.category ? (
              <Badge variant="neutral">{course.category.name}</Badge>
            ) : (
              <Badge variant="neutral">Sin categoría</Badge>
            )}
            <Badge variant="neutral">{formatLevel(course.level)}</Badge>
          </div>

          <div className="text-xs text-muted-fg">
            <span className="text-fg">{instructorName}</span>
            <span className="px-2 text-border/80">|</span>
            <span>{course.metrics.lessonCount} lecciones</span>
            <span className="px-2 text-border/80">|</span>
            <span>{course.metrics.durationHours}h</span>
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
    <main className="relative min-h-screen overflow-hidden px-5 py-10 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(80%_60%_at_50%_0%,hsl(var(--primary)_/_0.18),transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-fg">KODIRA • Courses</p>
            <h1 className="font-display text-2xl leading-tight text-fg">Catálogo</h1>
            <p className="mt-1 text-sm text-muted-fg">
              Cursos publicados. Filtros y búsqueda según el contrato.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Health</Link>
            </Button>
          </div>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <div>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Buscar por texto, categoría, nivel y precio.</CardDescription>
            </div>

            {courses.isLoading ? (
              <Badge variant="neutral">CARGANDO</Badge>
            ) : courses.isError ? (
              <Badge variant="danger">ERROR</Badge>
            ) : courses.data ? (
              <Badge variant="neutral">{courses.data.total} cursos</Badge>
            ) : (
              <Badge variant="neutral">EMPTY</Badge>
            )}
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="text-sm text-fg" htmlFor="q">
                  Buscar
                </label>
                <div className="mt-1.5">
                  <Input
                    id="q"
                    placeholder="React, NestJS, testing..."
                    defaultValue={q ?? ''}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      const value = (e.currentTarget.value ?? '').trim();
                      setParams({ q: value || undefined }, true);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-fg" htmlFor="category">
                  Categoría
                </label>
                <div className="mt-1.5">
                  <Select
                    id="category"
                    aria-label="Categoría"
                    value={categorySlug ?? ''}
                    onChange={(value) => setParams({ categorySlug: value || undefined }, true)}
                  >
                    <option value="">Todas</option>
                    {categories.data?.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-fg" htmlFor="level">
                  Nivel
                </label>
                <div className="mt-1.5">
                  <Select
                    id="level"
                    aria-label="Nivel"
                    value={level ?? ''}
                    onChange={(value) => setParams({ level: value || undefined }, true)}
                  >
                    <option value="">Todos</option>
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-fg" htmlFor="price">
                  Precio
                </label>
                <div className="mt-1.5">
                  <Select
                    id="price"
                    aria-label="Precio"
                    value={isFree === undefined ? '' : isFree ? 'free' : 'paid'}
                    onChange={(value) =>
                      setParams(
                        {
                          isFree:
                            value === '' ? undefined : value === 'free' ? 'true' : 'false',
                        },
                        true,
                      )
                    }
                  >
                    <option value="">Todos</option>
                    <option value="free">Gratis</option>
                    <option value="paid">De pago</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-fg" htmlFor="sort">
                  Orden
                </label>
                <div className="mt-1.5">
                  <Select
                    id="sort"
                    aria-label="Orden"
                    value={sort ?? ''}
                    onChange={(value) => setParams({ sort: value || undefined }, true)}
                  >
                    <option value="">Relevancia</option>
                    <option value="popular">Popular</option>
                    <option value="new">Nuevo</option>
                  </Select>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="secondary"
                  className="w-full"
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
                <Button variant="ghost" className="w-full" onClick={() => courses.refetch()}>
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {courses.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
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
          <Card>
            <CardHeader>
              <div>
                <CardTitle>No se pudo cargar el catálogo</CardTitle>
                <CardDescription>Verifica que apps/api esté corriendo y reintenta.</CardDescription>
              </div>
              <Badge variant="danger">ERROR</Badge>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" onClick={() => courses.refetch()}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : !courses.data || courses.data.items.length === 0 ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>No hay cursos</CardTitle>
                <CardDescription>Prueba otros filtros o borra la búsqueda.</CardDescription>
              </div>
              <Badge variant="neutral">EMPTY</Badge>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.data.items.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-fg">
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
    </main>
  );
}
