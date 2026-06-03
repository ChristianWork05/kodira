'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { Course, Lesson, Section } from '@kodira/types';
import {
  useCourseBySlugQuery,
  useCourseLessonsQuery,
  useLessonCompleteMutation,
  useLessonProgressMutation,
  useMyCoursesQuery,
} from '@kodira/hooks';
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
  Separator,
  Skeleton,
  Tabs,
} from '@kodira/ui';
import { getApiStatus } from '../../../../lib/apiError';

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-enrolled' }
  | { status: 'success' };

type MobileTab = 'lesson' | 'curriculum' | 'resources';

function clampPct(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function flattenLessons(sections: Section[]) {
  const items: Array<{ section: Section; lesson: Lesson }> = [];
  for (const section of sections ?? []) {
    for (const lesson of section.lessons ?? []) items.push({ section, lesson });
  }
  return items;
}

function findLessonById(sections: Section[], lessonId: string | null) {
  if (!lessonId) return null;
  for (const section of sections ?? []) {
    const lesson = (section.lessons ?? []).find((l) => l.id === lessonId);
    if (lesson) return { section, lesson };
  }
  return null;
}

function getFirstLessonId(sections: Section[]) {
  const firstSection = (sections ?? [])[0];
  const firstLesson = firstSection?.lessons?.[0];
  return firstLesson?.id ?? null;
}

function getNextLessonId(sections: Section[], currentLessonId: string) {
  const flat = flattenLessons(sections);
  const idx = flat.findIndex((x) => x.lesson.id === currentLessonId);
  if (idx < 0) return null;
  return flat[idx + 1]?.lesson.id ?? null;
}

function storageKey(courseId: string, lessonId: string) {
  return `kodira.learn.v1.${courseId}.${lessonId}`;
}

function readLocalProgress(courseId: string, lessonId: string) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(courseId, lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lastPositionSeconds?: number; completed?: boolean } | null;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      lastPositionSeconds:
        typeof parsed.lastPositionSeconds === 'number' && parsed.lastPositionSeconds >= 0
          ? parsed.lastPositionSeconds
          : 0,
      completed: Boolean(parsed.completed),
    };
  } catch {
    return null;
  }
}

function writeLocalProgress(courseId: string, lessonId: string, data: { lastPositionSeconds?: number; completed?: boolean }) {
  if (typeof window === 'undefined') return;
  try {
    const prev = readLocalProgress(courseId, lessonId) ?? { lastPositionSeconds: 0, completed: false };
    const next = {
      lastPositionSeconds:
        typeof data.lastPositionSeconds === 'number' ? Math.max(0, data.lastPositionSeconds) : prev.lastPositionSeconds,
      completed: typeof data.completed === 'boolean' ? data.completed : prev.completed,
    };
    window.localStorage.setItem(storageKey(courseId, lessonId), JSON.stringify(next));
  } catch {
    return;
  }
}

function getLessonProgress(lesson: Lesson, courseId: string) {
  if (lesson.lessonProgress) {
    return {
      isCompleted: lesson.lessonProgress.isCompleted,
      lastPositionSeconds: lesson.lessonProgress.lastPositionSeconds,
      watchPercentage: lesson.lessonProgress.watchPercentage,
      source: 'backend' as const,
    };
  }

  const local = readLocalProgress(courseId, lesson.id);
  return {
    isCompleted: Boolean(local?.completed),
    lastPositionSeconds: local?.lastPositionSeconds ?? 0,
    watchPercentage: 0,
    source: 'local' as const,
  };
}

function LessonBody({ lesson }: { lesson: Lesson }) {
  const content = (lesson.content ?? '').trim();
  if (!content) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
      <p className="text-xs font-medium text-fg">Contenido</p>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-fg">{content}</div>
    </div>
  );
}

function ResourcesPanel({ lesson }: { lesson: Lesson }) {
  const urls = lesson.resourceUrls ?? [];
  if (urls.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
        <p className="text-sm text-muted-fg">No hay recursos en esta lección.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
      <p className="text-xs font-medium text-fg">Recursos</p>
      <div className="mt-3 space-y-2">
        {urls.map((url) => (
          <a
            key={url}
            className="block truncate text-sm text-primary underline underline-offset-4 hover:opacity-90"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {url}
          </a>
        ))}
      </div>
    </div>
  );
}

function VideoPlayer(props: {
  courseId: string;
  lesson: Lesson;
  onProgressPing: (payload: { lastPositionSeconds: number; watchPercentage: number }) => void;
}) {
  const { lesson, courseId, onProgressPing } = props;
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [speed, setSpeed] = React.useState(1);
  const [ready, setReady] = React.useState(false);
  const lastSentAtRef = React.useRef(0);
  const lastSentPosRef = React.useRef(-1);

  React.useEffect(() => {
    setReady(false);
  }, [lesson.id]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
  }, [speed]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMeta = () => {
      setReady(true);
      const fromBackend = lesson.lessonProgress?.lastPositionSeconds ?? 0;
      const local = readLocalProgress(courseId, lesson.id);
      const seconds = fromBackend > 0 ? fromBackend : local?.lastPositionSeconds ?? 0;
      if (seconds > 0 && Number.isFinite(video.duration) && seconds < video.duration - 2) {
        video.currentTime = seconds;
      }
    };
    const sendProgress = (force: boolean) => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      const lastPositionSeconds = Math.max(0, Math.floor(video.currentTime));
      const watchPercentage = clampPct((video.currentTime / video.duration) * 100);
      const now = Date.now();
      const sinceLastMs = now - lastSentAtRef.current;
      const posChanged = Math.abs(lastPositionSeconds - lastSentPosRef.current);
      if (!force && (sinceLastMs < 5_000 || posChanged < 2)) return;
      lastSentAtRef.current = now;
      lastSentPosRef.current = lastPositionSeconds;
      writeLocalProgress(courseId, lesson.id, { lastPositionSeconds });
      onProgressPing({ lastPositionSeconds, watchPercentage });
    };
    const onPause = () => sendProgress(true);
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName ?? '';
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (target && target.isContentEditable)
      )
        return;
      if (e.key === ' ') {
        e.preventDefault();
        if (video.paused) void video.play();
        else video.pause();
      } else if (e.key === 'ArrowLeft') {
        video.currentTime = Math.max(0, video.currentTime - 5);
      } else if (e.key === 'ArrowRight') {
        video.currentTime = Math.min(video.duration || video.currentTime + 5, video.currentTime + 5);
      } else if (e.key.toLowerCase() === 'm') {
        video.muted = !video.muted;
      } else if (e.key.toLowerCase() === 'p') {
        const anyVideo = video as any;
        if (typeof anyVideo.requestPictureInPicture === 'function') void anyVideo.requestPictureInPicture();
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMeta);
    video.addEventListener('pause', onPause);
    window.addEventListener('keydown', onKey);
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      video.removeEventListener('pause', onPause);
      window.removeEventListener('keydown', onKey);
    };
  }, [courseId, lesson.id, onProgressPing]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const interval = window.setInterval(() => {
      if (video.paused) return;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      const lastPositionSeconds = Math.max(0, Math.floor(video.currentTime));
      const watchPercentage = clampPct((video.currentTime / video.duration) * 100);
      const now = Date.now();
      const sinceLastMs = now - lastSentAtRef.current;
      const posChanged = Math.abs(lastPositionSeconds - lastSentPosRef.current);
      if (sinceLastMs < 6_000 || posChanged < 2) return;
      lastSentAtRef.current = now;
      lastSentPosRef.current = lastPositionSeconds;
      writeLocalProgress(courseId, lesson.id, { lastPositionSeconds });
      onProgressPing({ lastPositionSeconds, watchPercentage });
    }, 6_000);
    return () => window.clearInterval(interval);
  }, [courseId, lesson.id, onProgressPing]);

  if (!lesson.videoUrl) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
        <p className="text-sm text-muted-fg">Esta lección no tiene video.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{lesson.title}</p>
          <p className="mt-0.5 text-xs text-muted-fg">
            Atajos: espacio play/pausa, flechas buscar, m mute, p PiP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-fg">Velocidad</span>
          <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
            {[0.75, 1, 1.25, 1.5, 2].map((v) => (
              <button
                key={v}
                type="button"
                className={
                  'rounded-md px-2 py-1 text-xs transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 ' +
                  (speed === v ? 'bg-primary text-primary-fg' : 'text-fg hover:bg-muted/70')
                }
                aria-pressed={speed === v}
                onClick={() => setSpeed(v)}
                disabled={!ready}
              >
                {v}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2 pb-2 pt-3 sm:px-4 sm:pb-4">
        <video
          ref={videoRef}
          className="aspect-video w-full rounded-xl bg-black outline-none"
          src={lesson.videoUrl ?? undefined}
          controls
          playsInline
        />
      </div>
    </div>
  );
}

export default function CourseLearnPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;

  const [tab, setTab] = React.useState<MobileTab>('lesson');
  const [activeLessonId, setActiveLessonId] = React.useState<string | null>(null);
  const [completedOverrides, setCompletedOverrides] = React.useState<Record<string, boolean>>({});

  const courseQuery = useCourseBySlugQuery(slug);
  const myCoursesQuery = useMyCoursesQuery({ page: 1, limit: 50 });

  const course: Course | null = courseQuery.data ?? null;
  const enrollmentItem = React.useMemo(() => {
    if (!course) return null;
    return myCoursesQuery.data?.items.find((i) => i.course.slug === course.slug) ?? null;
  }, [course, myCoursesQuery.data?.items]);
  const isEnrolled = Boolean(enrollmentItem);

  const lessonsQuery = useCourseLessonsQuery(isEnrolled && course ? course.id : '');

  const progressMutation = useLessonProgressMutation();
  const completeMutation = useLessonCompleteMutation();

  React.useEffect(() => {
    if (!myCoursesQuery.isError) return;
    const status = getApiStatus(myCoursesQuery.error);
    if (status === 401) router.replace('/login');
  }, [myCoursesQuery.isError, myCoursesQuery.error, router]);

  const hasRedirectedRef = React.useRef(false);
  React.useEffect(() => {
    if (!course) return;
    if (!myCoursesQuery.data) return;
    if (isEnrolled) return;
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    router.replace(`/courses/${course.slug}`);
  }, [course, isEnrolled, myCoursesQuery.data, router]);

  const sections = lessonsQuery.data?.sections ?? [];
  const active = findLessonById(sections, activeLessonId);
  const activeLesson = active?.lesson ?? null;

  React.useEffect(() => {
    if (!course) return;
    if (!isEnrolled) return;
    if (!lessonsQuery.data) return;
    if (sections.length === 0) return;

    const requested = searchParams.get('lessonId');
    const requestedExists = requested ? Boolean(findLessonById(sections, requested)) : false;
    const preferred = requestedExists ? requested : enrollmentItem?.lastLessonId ?? null;
    const preferredExists = preferred ? Boolean(findLessonById(sections, preferred)) : false;
    const initial = preferredExists ? preferred : getFirstLessonId(sections);
    setActiveLessonId((prev) => prev ?? initial);
  }, [course, enrollmentItem?.lastLessonId, isEnrolled, lessonsQuery.data, searchParams, sections]);

  const onProgressPing = React.useCallback(
    (payload: { lastPositionSeconds: number; watchPercentage: number }) => {
      if (!activeLesson) return;
      progressMutation.mutate({
        lessonId: activeLesson.id,
        data: {
          watchPercentage: payload.watchPercentage,
          lastPositionSeconds: payload.lastPositionSeconds,
        },
      });
    },
    [activeLesson, progressMutation],
  );

  const onComplete = async () => {
    if (!course || !activeLesson) return;
    const prevLocal = readLocalProgress(course.id, activeLesson.id);
    writeLocalProgress(course.id, activeLesson.id, { completed: true });
    setCompletedOverrides((prev) => ({ ...prev, [activeLesson.id]: true }));
    try {
      await completeMutation.mutateAsync({ lessonId: activeLesson.id });
    } catch {
      writeLocalProgress(course.id, activeLesson.id, { completed: Boolean(prevLocal?.completed) });
      setCompletedOverrides((prev) => ({ ...prev, [activeLesson.id]: Boolean(prevLocal?.completed) }));
      return;
    }
    const nextId = getNextLessonId(sections, activeLesson.id);
    if (nextId) {
      setActiveLessonId(nextId);
      setTab('lesson');
      return;
    }
    router.replace('/dashboard');
  };

  const courseProgress = enrollmentItem?.enrollment.progressPercentage ?? 0;

  const state: ViewState = (() => {
    if (courseQuery.isLoading || myCoursesQuery.isLoading) return { status: 'loading' };
    if (courseQuery.isError) return { status: 'error', message: 'No se pudo cargar el curso.' };
    if (myCoursesQuery.isError) {
      const status = getApiStatus(myCoursesQuery.error);
      if (status === 401) return { status: 'loading' };
      return { status: 'error', message: 'No se pudieron cargar tus cursos.' };
    }
    if (!course) return { status: 'error', message: 'No se pudo obtener el curso.' };
    if (!isEnrolled) return { status: 'not-enrolled' };
    if (lessonsQuery.isLoading) return { status: 'loading' };
    if (lessonsQuery.isError) return { status: 'error', message: 'No se pudo cargar el temario.' };
    return { status: 'success' };
  })();

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-6 pb-24">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-[26px] font-black leading-[1.08] tracking-[-0.03em] text-fg">
              {course ? course.title : 'Aula'}
            </div>
            <div className="mt-1 truncate text-sm text-fg-muted">
              {state.status === 'success' && activeLesson ? activeLesson.title : 'Progreso y temario'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="glass" size="sm">
              <Link href={`/courses/${slug}`}>Detalle</Link>
            </Button>
            <Button asChild variant="glass" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-line/10 bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">
                Progreso <span className="font-mono">{clampPct(courseProgress)}%</span>
              </Badge>
              {activeLesson?.lessonProgress ? (
                <Badge variant="neutral">
                  Reanudar <span className="font-mono">{activeLesson.lessonProgress.lastPositionSeconds}s</span>
                </Badge>
              ) : null}
              {state.status === 'loading' ? <Badge variant="neutral">CARGANDO</Badge> : null}
              {state.status === 'error' ? <Badge variant="danger">ERROR</Badge> : null}
            </div>
            <div className="w-full sm:w-[220px]">
              <Progress value={courseProgress} />
            </div>
          </div>
        </div>
      </header>

        {state.status === 'loading' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle>Temario</CardTitle>
                <CardDescription>Cargando...</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        ) : state.status === 'error' ? (
          <ErrorState
            title="Algo falló"
            description={state.message}
            action={
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => router.refresh()}>
                  Reintentar
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/courses/${slug}`}>Volver al curso</Link>
                </Button>
              </div>
            }
          />
        ) : state.status === 'not-enrolled' ? (
          <EmptyState
            title="No estás inscrito"
            description="Para acceder al aula, primero tienes que inscribirte en el curso."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/courses/${slug}`}>Ir al detalle</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/dashboard">Volver al dashboard</Link>
                </Button>
              </div>
            }
          />
        ) : !course ? (
          <ErrorState title="Curso no disponible" description="No se pudo obtener el curso." />
        ) : sections.length === 0 ? (
          <EmptyState
            title="Temario vacío"
            description="Este curso no tiene lecciones publicadas."
            action={
              <Button asChild variant="secondary">
                <Link href={`/courses/${slug}`}>Volver al detalle</Link>
              </Button>
            }
          />
        ) : !activeLesson ? (
          <EmptyState title="Elige una lección" description="Selecciona una lección desde el temario." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-4">
              <div className="lg:hidden">
                <Tabs
                  value={tab}
                  onValueChange={(v) => setTab(v as MobileTab)}
                  items={[
                    { value: 'lesson', label: 'Lección' },
                    { value: 'curriculum', label: 'Temario' },
                    { value: 'resources', label: 'Recursos' },
                  ]}
                />
              </div>

              {tab === 'curriculum' ? (
                <Card className="lg:hidden">
                  <CardHeader>
                    <CardTitle>Temario</CardTitle>
                    <CardDescription>Progreso {clampPct(courseProgress)}%</CardDescription>
                    <div className="mt-3">
                      <Progress value={courseProgress} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sections.map((section) => (
                      <div key={section.id}>
                        <p className="text-xs font-medium text-fg">{section.title}</p>
                        <div className="mt-2 space-y-1">
                          {(section.lessons ?? []).map((lesson) => {
                            const isActive = lesson.id === activeLesson.id;
                            const progress = getLessonProgress(lesson, course.id);
                            const override = completedOverrides[lesson.id];
                            const isDone = override ?? progress.isCompleted;
                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                onClick={() => {
                                  setActiveLessonId(lesson.id);
                                  setTab('lesson');
                                }}
                                className={
                                  'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-[transform,background-color,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 ' +
                                  (isActive
                                    ? 'border-primary/50 bg-primary/10 text-fg'
                                    : 'border-border/60 bg-muted/10 text-muted-fg hover:bg-muted/25 hover:text-fg')
                                }
                              >
                                <span className="min-w-0 truncate">{lesson.title}</span>
                                <span className="flex items-center gap-2">
                                  <span className="rounded-md bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-fg">
                                    {lesson.type}
                                  </span>
                                  {isDone ? (
                                    <span className="rounded-md bg-success/15 px-2 py-0.5 font-mono text-[10px] text-success-fg">
                                      OK
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {tab === 'resources' ? (
                <div className="space-y-4 lg:hidden">
                  <ResourcesPanel lesson={activeLesson} />
                </div>
              ) : null}

              {tab === 'lesson' ? (
                <div className="space-y-4">
                  <VideoPlayer courseId={course.id} lesson={activeLesson} onProgressPing={onProgressPing} />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">
                        Lección <span className="font-mono">{activeLesson.id}</span>
                      </Badge>
                      {progressMutation.isPending ? <Badge variant="neutral">GUARDANDO</Badge> : null}
                      {progressMutation.isError ? <Badge variant="danger">ERROR</Badge> : null}
                      {completeMutation.isPending ? <Badge variant="neutral">COMPLETANDO</Badge> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={onComplete} disabled={completeMutation.isPending}>
                        Marcar como completada
                      </Button>
                    </div>
                  </div>

                  <Separator />
                  <LessonBody lesson={activeLesson} />
                  <div className="hidden lg:block">
                    <ResourcesPanel lesson={activeLesson} />
                  </div>
                </div>
              ) : null}
            </section>

            <aside className="hidden lg:block">
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle>Temario</CardTitle>
                      <CardDescription>Lecciones del curso.</CardDescription>
                    </div>
                    <Badge variant="neutral">{sections.length}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Progress value={courseProgress} />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-auto pr-2">
                  <div className="space-y-4">
                    {sections.map((section) => (
                      <div key={section.id}>
                        <p className="text-xs font-medium text-fg">{section.title}</p>
                        <div className="mt-2 space-y-1">
                          {(section.lessons ?? []).map((lesson) => {
                            const isActive = lesson.id === activeLesson.id;
                            const progress = getLessonProgress(lesson, course.id);
                            const override = completedOverrides[lesson.id];
                            const isDone = override ?? progress.isCompleted;
                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                onClick={() => setActiveLessonId(lesson.id)}
                                className={
                                  'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-[transform,background-color,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 ' +
                                  (isActive
                                    ? 'border-primary/50 bg-primary/10 text-fg'
                                    : 'border-border/60 bg-muted/10 text-muted-fg hover:bg-muted/25 hover:text-fg')
                                }
                              >
                                <span className="min-w-0 truncate">{lesson.title}</span>
                                <span className="flex items-center gap-2">
                                  <span className="rounded-md bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-fg">
                                    {lesson.type}
                                  </span>
                                  {isDone ? (
                                    <span className="rounded-md bg-success/15 px-2 py-0.5 font-mono text-[10px] text-success-fg">
                                      OK
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
    </div>
  );
}

