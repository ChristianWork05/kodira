'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Course, CourseLevel, Lesson } from '@kodira/types';
import { useCourseBySlugQuery, useEnrollCourseMutation, useMyCoursesQuery } from '@kodira/hooks';
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
  Progress,
  Reveal,
  RevealItem,
  Separator,
  Skeleton,
} from '@kodira/ui';
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
  const myCoursesQuery = useMyCoursesQuery({ page: 1, limit: 50 });

  const [enrollError, setEnrollError] = React.useState<string | null>(null);

  const enrollmentItem = React.useMemo(() => {
    if (!course.data) return null;
    return myCoursesQuery.data?.items.find((item) => item.course.id === course.data!.id) ?? null;
  }, [course.data, myCoursesQuery.data?.items]);
  const isEnrolled = Boolean(enrollmentItem);

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
    <div className="mx-auto w-full max-w-[1320px] space-y-6 pb-24">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-[26px] font-black leading-[1.08] tracking-[-0.03em] text-fg">
            Curso
          </div>
          <div className="mt-1 text-sm text-fg-muted">Detalle y temario.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="glass" size="sm">
            <Link href="/courses">Volver al catálogo</Link>
          </Button>
          <Button asChild variant="glass" size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      {course.isLoading ? (
        <Card variant="solid">
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
        <ErrorState
          title="No se pudo cargar el curso"
          description="Puede que el slug no exista o la API no esté disponible."
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => course.refetch()}>
                Reintentar
              </Button>
              <Button asChild variant="ghost">
                <Link href="/courses">Ir al catálogo</Link>
              </Button>
            </div>
          }
        />
      ) : !course.data ? (
        <EmptyState
          title="Curso no encontrado"
          description="Vuelve al catálogo y elige otro curso."
          action={
            <Button asChild variant="secondary">
              <Link href="/courses">Volver</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card variant="gradient">
            <CardHeader className="items-start">
              <div className="flex w-full items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-[18px] leading-[1.2]">{course.data.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {course.data.shortDescription?.trim() ? course.data.shortDescription.trim() : 'Sin descripción corta.'}
                  </CardDescription>
                </div>
                <Badge variant={course.data.isFree ? 'ok' : 'neutral'}>
                  {course.data.isFree ? 'Gratis' : `${course.data.price}`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">{course.data.category ? course.data.category.name : 'Sin categoría'}</Badge>
                <Badge variant="neutral">{formatLevel(course.data.level)}</Badge>
                <Badge variant="neutral">{course.data.language}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-line/10 bg-bg-2 px-3 py-2">
                  <div className="text-xs text-fg-dim">Instructor</div>
                  <div className="text-sm text-fg">{getInstructorName(course.data)}</div>
                </div>
                <div className="rounded-lg border border-line/10 bg-bg-2 px-3 py-2">
                  <div className="text-xs text-fg-dim">Lecciones</div>
                  <div className="text-sm text-fg">{course.data.metrics.lessonCount}</div>
                </div>
                <div className="rounded-lg border border-line/10 bg-bg-2 px-3 py-2">
                  <div className="text-xs text-fg-dim">Duración</div>
                  <div className="text-sm text-fg">{course.data.metrics.durationHours}h</div>
                </div>
              </div>

              {isEnrolled && enrollmentItem ? (
                <div className="space-y-2 rounded-lg border border-line/10 bg-bg-2 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-fg">Tu progreso</div>
                    <Badge variant="neutral">
                      <span className="font-mono">{Math.round(enrollmentItem.enrollment.progressPercentage)}%</span>
                    </Badge>
                  </div>
                  <Progress value={enrollmentItem.enrollment.progressPercentage} />
                </div>
              ) : null}

              {course.data.description?.trim() ? (
                <p className="text-sm leading-relaxed text-fg-muted">{course.data.description.trim()}</p>
              ) : null}

              <Separator />

              <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="text-sm text-fg">{isEnrolled ? 'Ya estás inscrito.' : '¿Listo para empezar?'}</div>
                  <div className="text-xs text-fg-muted">
                    {course.data.isFree ? 'La inscripción es inmediata para cursos gratis.' : 'Pagos aún no están disponibles.'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {course.data.isFree ? (
                    isEnrolled ? (
                      <>
                        <Button asChild variant="secondary">
                          <Link
                            href={
                              enrollmentItem?.lastLessonId
                                ? `/courses/${course.data.slug}/learn?lessonId=${enrollmentItem.lastLessonId}`
                                : `/courses/${course.data.slug}/learn`
                            }
                          >
                            Entrar al aula
                          </Link>
                        </Button>
                        <Button asChild variant="ghost">
                          <Link href="/dashboard">Dashboard</Link>
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
                <div className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
                  {enrollError}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card variant="solid">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Temario</CardTitle>
                  <CardDescription>Las lecciones Preview se pueden ver sin inscribirse.</CardDescription>
                </div>
                <Badge variant="neutral">{course.data.sections.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.data.sections.length === 0 ? (
                <EmptyState title="Sin secciones" description="Este curso aún no tiene secciones." />
              ) : (
                <Reveal>
                  <div className="space-y-4">
                    {course.data.sections.map((section) => (
                      <RevealItem key={section.id}>
                        <div className="rounded-lg border border-line/10 bg-bg-2">
                          <div className="flex items-start justify-between gap-3 px-4 py-3">
                            <div className="text-sm font-semibold text-fg">{section.title}</div>
                            <Badge variant="neutral">{section.lessons.length}</Badge>
                          </div>
                          <div className="border-t border-line/10">
                            {section.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-start justify-between gap-3 px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm text-fg">{lesson.title}</div>
                                  <div className="mt-0.5 text-xs text-fg-muted">
                                    <span className="font-mono">{lesson.type}</span>
                                    {lesson.videoDuration ? <span className="px-2 text-line/60">·</span> : null}
                                    {lesson.videoDuration ? (
                                      <span className="font-mono">{lesson.videoDuration}s</span>
                                    ) : null}
                                  </div>
                                </div>
                                <Badge variant={lesson.isFreePreview ? 'ok' : 'neutral'}>
                                  {getLessonAvailabilityLabel(lesson, isEnrolled)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </RevealItem>
                    ))}
                  </div>
                </Reveal>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
