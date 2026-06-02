'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Course, CourseLevel, Lesson } from '@kodira/types';
import { getKodiraApiClient, useCourseBySlugQuery, useEnrollCourseMutation } from '@kodira/hooks';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator, Skeleton } from '@kodira/ui';
import { getApiErrorResponse, getApiStatus } from '../../../lib/apiError';

function formatLevel(level: CourseLevel) {
  if (level === 'beginner') return 'Principiante';
  if (level === 'intermediate') return 'Intermedio';
  return 'Avanzado';
}

function getInstructorName(course: Course) {
  const fullName = course.instructor.fullName?.trim();
  return fullName ? fullName : course.instructor.username;
}

function getLessonAvailabilityLabel(lesson: Lesson, isEnrolled: boolean) {
  if (lesson.isFreePreview) return 'Preview';
  if (isEnrolled) return 'Incluida';
  return 'Solo inscritos';
}

function getEnrollErrorMessage(error: unknown) {
  const status = getApiStatus(error);
  if (status === 401) return 'Necesitas iniciar sesión para inscribirte.';

  const api = getApiErrorResponse(error);
  if (!api) return 'No se pudo completar la inscripción. Intenta de nuevo.';
  if (api.code === 'VALIDATION_ERROR') return api.message;
  if (api.code === 'FORBIDDEN') return api.message;
  return api.message || 'Ocurrió un error al inscribirte.';
}

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const slug = params.slug;

  const course = useCourseBySlugQuery(slug);
  const enroll = useEnrollCourseMutation();

  const [isEnrolled, setIsEnrolled] = React.useState(false);
  const [enrollError, setEnrollError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!course.data) return;
      try {
        const client = getKodiraApiClient();
        const my = await client.education.listMyCourses({ page: 1, limit: 50 });
        if (cancelled) return;
        const found = my.items.some((item) => item.course.id === course.data!.id);
        setIsEnrolled(found);
      } catch (err) {
        if (cancelled) return;
        const status = getApiStatus(err);
        if (status === 401) {
          setIsEnrolled(false);
          return;
        }
        setIsEnrolled(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [course.data]);

  const onEnroll = async () => {
    setEnrollError(null);
    const current = course.data;
    if (!current) return;

    try {
      const res = await enroll.mutateAsync({ courseId: current.id });
      setIsEnrolled(true);
      if (res) router.push('/dashboard');
    } catch (err) {
      const status = getApiStatus(err);
      if (status === 401) {
        router.push('/login');
        return;
      }
      setEnrollError(getEnrollErrorMessage(err));
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-10 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(80%_60%_at_50%_0%,hsl(var(--violet)_/_0.20),transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-4xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-fg">KODIRA • Course</p>
            <h1 className="font-display text-2xl leading-tight text-fg">Detalle</h1>
            <p className="mt-1 text-sm text-muted-fg">
              Vista pública del curso y temario, con inscripción si es gratis.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/courses">Volver al catálogo</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </header>

        {course.isLoading ? (
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-6 w-80" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-7 w-24 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-5 w-72" />
                <Skeleton className="h-5 w-64" />
              </div>
            </CardContent>
          </Card>
        ) : course.isError ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>No se pudo cargar el curso</CardTitle>
                <CardDescription>Puede que el slug no exista o la API no esté disponible.</CardDescription>
              </div>
              <Badge variant="danger">ERROR</Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => course.refetch()}>
                Reintentar
              </Button>
              <Button asChild variant="ghost">
                <Link href="/courses">Ir al catálogo</Link>
              </Button>
            </CardContent>
          </Card>
        ) : !course.data ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Curso no encontrado</CardTitle>
                <CardDescription>Vuelve al catálogo y elige otro curso.</CardDescription>
              </div>
              <Badge variant="neutral">EMPTY</Badge>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="/courses">Volver</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="items-start">
                <div className="min-w-0">
                  <CardTitle className="text-lg">{course.data.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {course.data.shortDescription?.trim()
                      ? course.data.shortDescription.trim()
                      : 'Sin descripción corta.'}
                  </CardDescription>
                </div>
                <Badge variant={course.data.isFree ? 'ok' : 'neutral'}>
                  {course.data.isFree ? 'Gratis' : `${course.data.price}`}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {course.data.category ? (
                    <Badge variant="neutral">{course.data.category.name}</Badge>
                  ) : (
                    <Badge variant="neutral">Sin categoría</Badge>
                  )}
                  <Badge variant="neutral">{formatLevel(course.data.level)}</Badge>
                  <Badge variant="neutral">{course.data.language}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-fg">Instructor</p>
                    <p className="text-sm text-fg">{getInstructorName(course.data)}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-fg">Lecciones</p>
                    <p className="text-sm text-fg">{course.data.metrics.lessonCount}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-fg">Duración</p>
                    <p className="text-sm text-fg">{course.data.metrics.durationHours}h</p>
                  </div>
                </div>

                {course.data.description?.trim() ? (
                  <p className="text-sm leading-relaxed text-fg/90">{course.data.description.trim()}</p>
                ) : null}

                <Separator />

                <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-fg">
                      {isEnrolled ? 'Ya estás inscrito.' : '¿Listo para empezar?'}
                    </p>
                    <p className="text-xs text-muted-fg">
                      {course.data.isFree
                        ? 'La inscripción es inmediata para cursos gratis.'
                        : 'Pagos y checkout aún no están disponibles en el MVP.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {course.data.isFree ? (
                      isEnrolled ? (
                        <>
                          <Button asChild variant="secondary">
                            <Link href="/dashboard">Ver en dashboard</Link>
                          </Button>
                          <Button asChild variant="ghost">
                            <Link href="/courses">Seguir explorando</Link>
                          </Button>
                        </>
                      ) : (
                        <Button onClick={onEnroll} disabled={enroll.isPending}>
                          {enroll.isPending ? 'Inscribiendo...' : 'Inscribirme gratis'}
                        </Button>
                      )
                    ) : (
                      <Button disabled>Próximamente</Button>
                    )}
                  </div>
                </div>

                {enrollError ? (
                  <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
                    {enrollError}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Temario</CardTitle>
                  <CardDescription>
                    Las lecciones marcadas como Preview se pueden ver sin inscribirse.
                  </CardDescription>
                </div>
                <Badge variant="neutral">{course.data.sections.length} secciones</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.data.sections.length === 0 ? (
                  <p className="text-sm text-muted-fg">Este curso aún no tiene secciones.</p>
                ) : (
                  <div className="space-y-4">
                    {course.data.sections.map((section) => (
                      <div key={section.id} className="rounded-xl border border-border/60 bg-muted/20">
                        <div className="flex items-start justify-between gap-3 px-4 py-3">
                          <p className="text-sm font-medium text-fg">{section.title}</p>
                          <Badge variant="neutral">{section.lessons.length}</Badge>
                        </div>
                        <div className="border-t border-border/60">
                          {section.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-start justify-between gap-3 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm text-fg">{lesson.title}</p>
                                <p className="mt-0.5 text-xs text-muted-fg">
                                  {lesson.type}
                                  {lesson.videoDuration ? ` • ${lesson.videoDuration}s` : ''}
                                </p>
                              </div>
                              <Badge variant={lesson.isFreePreview ? 'ok' : 'neutral'}>
                                {getLessonAvailabilityLabel(lesson, isEnrolled)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
