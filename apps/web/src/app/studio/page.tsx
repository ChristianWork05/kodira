'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CourseState, Lesson, UserMe } from '@kodira/types';
import {
  getKodiraApiClient,
  useCourseLessonsQuery,
  useCreateUploadUrlMutation,
  useInstructorCoursesQuery,
  useUpdateLessonMutation,
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
  Input,
  LoadingState,
  Progress,
  Reveal,
  RevealItem,
  Separator,
  Skeleton,
  Tabs,
} from '@kodira/ui';
import { getApiErrorResponse, getApiStatus } from '../../lib/apiError';

type ViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'unauthorized' }
  | { status: 'forbidden' }
  | { status: 'success'; user: UserMe };

type UploadState =
  | { status: 'idle' }
  | { status: 'preparing' }
  | { status: 'uploading'; progress: number }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

async function getVideoDurationSeconds(file: File): Promise<number | null> {
  if (!file.type.startsWith('video/')) return null;
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    const duration = await new Promise<number>((resolve, reject) => {
      const onLoaded = () => resolve(video.duration);
      const onError = () => reject(new Error('failed to load metadata'));
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });
    });
    if (!Number.isFinite(duration) || duration <= 0) return null;
    return duration;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadWithProgress(params: {
  uploadUrl: string;
  file: File;
  contentType: string;
  onProgress: (pct: number) => void;
}): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', params.uploadUrl, true);
    xhr.setRequestHeader('Content-Type', params.contentType);

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.max(0, Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
      params.onProgress(pct);
    };

    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      if (!ok) {
        reject(new Error(`Upload failed (${xhr.status})`));
        return;
      }
      resolve();
    };
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.send(params.file);
  });
}

function StatusBadge({ state }: { state: UploadState }) {
  if (state.status === 'idle') return <Badge variant="neutral">LISTO</Badge>;
  if (state.status === 'preparing') return <Badge variant="neutral">PREPARANDO</Badge>;
  if (state.status === 'uploading') return <Badge variant="neutral">SUBIENDO {state.progress}%</Badge>;
  if (state.status === 'saving') return <Badge variant="neutral">GUARDANDO</Badge>;
  if (state.status === 'success') return <Badge variant="success">OK</Badge>;
  return <Badge variant="danger">ERROR</Badge>;
}

function LessonRow(params: {
  courseSlug: string;
  courseId: string;
  sectionId: string;
  lesson: Lesson;
}) {
  const { courseId, courseSlug, sectionId, lesson } = params;

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadState, setUploadState] = React.useState<UploadState>({ status: 'idle' });
  const [attachmentState, setAttachmentState] = React.useState<UploadState>({ status: 'idle' });

  const createUploadUrl = useCreateUploadUrlMutation();
  const updateLesson = useUpdateLessonMutation();

  const onPickVideo = () => fileInputRef.current?.click();
  const onPickAttachment = () => attachmentInputRef.current?.click();

  const onVideoSelected = async (file: File) => {
    setUploadState({ status: 'preparing' });
    try {
      const durationSeconds = await getVideoDurationSeconds(file);
      const res = await createUploadUrl.mutateAsync({
        kind: 'video',
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        courseId,
        lessonId: lesson.id,
      });

      setUploadState({ status: 'uploading', progress: 0 });
      await uploadWithProgress({
        uploadUrl: res.uploadUrl,
        file,
        contentType: file.type,
        onProgress: (progress) => setUploadState({ status: 'uploading', progress }),
      });

      setUploadState({ status: 'saving' });
      await updateLesson.mutateAsync({
        courseId,
        sectionId,
        lessonId: lesson.id,
        data: {
          videoUrl: res.publicUrl,
          videoDuration: durationSeconds,
        },
        courseSlug,
      });

      setUploadState({ status: 'success' });
      window.setTimeout(() => setUploadState({ status: 'idle' }), 1_000);
    } catch (err) {
      const status = getApiStatus(err);
      const apiError = getApiErrorResponse(err);
      const message =
        status === 403
          ? 'No tienes permisos para subir video a esta lección.'
          : apiError?.message ||
            (err instanceof Error ? err.message : 'No se pudo subir el video. Intenta de nuevo.');
      setUploadState({ status: 'error', message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onAttachmentSelected = async (file: File) => {
    setAttachmentState({ status: 'preparing' });
    try {
      const res = await createUploadUrl.mutateAsync({
        kind: 'attachment',
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        courseId,
        lessonId: lesson.id,
      });

      setAttachmentState({ status: 'uploading', progress: 0 });
      await uploadWithProgress({
        uploadUrl: res.uploadUrl,
        file,
        contentType: file.type,
        onProgress: (progress) => setAttachmentState({ status: 'uploading', progress }),
      });

      setAttachmentState({ status: 'saving' });
      const existing = Array.isArray(lesson.resourceUrls) ? lesson.resourceUrls : [];
      await updateLesson.mutateAsync({
        courseId,
        sectionId,
        lessonId: lesson.id,
        data: {
          resourceUrls: [...existing, res.publicUrl],
        },
        courseSlug,
      });

      setAttachmentState({ status: 'success' });
      window.setTimeout(() => setAttachmentState({ status: 'idle' }), 1_000);
    } catch (err) {
      const status = getApiStatus(err);
      const apiError = getApiErrorResponse(err);
      const message =
        status === 403
          ? 'No tienes permisos para subir adjuntos a esta lección.'
          : apiError?.message ||
            (err instanceof Error ? err.message : 'No se pudo subir el adjunto. Intenta de nuevo.');
      setAttachmentState({ status: 'error', message });
    } finally {
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  };

  const hasVideo = Boolean(lesson.videoUrl);
  const hasAttachments = (lesson.resourceUrls ?? []).length > 0;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-fg">{lesson.title}</p>
            <Badge variant="neutral">{lesson.type}</Badge>
            {hasVideo ? <Badge variant="success">VIDEO OK</Badge> : <Badge variant="neutral">SIN VIDEO</Badge>}
            {hasAttachments ? (
              <Badge variant="neutral">{lesson.resourceUrls.length} adjunto(s)</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-fg">
            Lección: <span className="font-mono text-[11px] text-fg">{lesson.id}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onPickVideo} disabled={uploadState.status !== 'idle'}>
              Subir video
            </Button>
            <Button variant="ghost" size="sm" onClick={onPickAttachment} disabled={attachmentState.status !== 'idle'}>
              Subir adjunto
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge state={uploadState} />
            <StatusBadge state={attachmentState} />
          </div>
        </div>
      </div>

      {uploadState.status === 'uploading' ? (
        <div className="mt-3 space-y-2">
          <Progress value={uploadState.progress} />
        </div>
      ) : null}

      {attachmentState.status === 'uploading' ? (
        <div className="mt-3 space-y-2">
          <Progress value={attachmentState.progress} />
        </div>
      ) : null}

      {uploadState.status === 'error' ? (
        <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
          {uploadState.message}
        </div>
      ) : null}

      {attachmentState.status === 'error' ? (
        <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
          {attachmentState.message}
        </div>
      ) : null}

      {hasVideo ? (
        <div className="mt-3">
          <a
            className="text-sm text-primary underline underline-offset-4 hover:opacity-90"
            href={lesson.videoUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
          >
            Abrir video (R2)
          </a>
        </div>
      ) : null}

      {hasAttachments ? (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium text-fg">Recursos</p>
          <div className="space-y-1">
            {lesson.resourceUrls.map((url) => (
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
      ) : null}

      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept="video/mp4,video/webm"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (!file) return;
          void onVideoSelected(file);
        }}
      />

      <input
        ref={attachmentInputRef}
        className="hidden"
        type="file"
        accept="application/pdf,application/zip,application/x-zip-compressed"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (!file) return;
          void onAttachmentSelected(file);
        }}
      />
    </div>
  );
}

export default function StudioPage() {
  const router = useRouter();
  const [state, setState] = React.useState<ViewState>({ status: 'loading' });
  const [courseState, setCourseState] = React.useState<'all' | CourseState>('all');
  const [courseSearch, setCourseSearch] = React.useState('');
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);
  const [selectedCourseSlug, setSelectedCourseSlug] = React.useState<string | null>(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = React.useState<string | null>(null);

  const instructorCoursesQuery = useInstructorCoursesQuery(
    {
      page: 1,
      limit: 50,
      state: courseState === 'all' ? undefined : courseState,
    },
    { enabled: state.status === 'success' },
  );

  const lessonsQuery = useCourseLessonsQuery(selectedCourseId ?? '');

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setState({ status: 'loading' });
      try {
        const api = getKodiraApiClient();
        const me = await api.users.getMe();
        if (cancelled) return;
        if (!me) {
          setState({ status: 'unauthorized' });
          return;
        }
        const isInstructor = me.roles.includes('instructor');
        if (!isInstructor) {
          setState({ status: 'forbidden' });
          return;
        }
        setState({ status: 'success', user: me });
      } catch (err) {
        if (cancelled) return;
        const status = getApiStatus(err);
        if (status === 401) {
          setState({ status: 'unauthorized' });
          return;
        }
        setState({
          status: 'error',
          message: 'No se pudo cargar tu sesión. Intenta recargar.',
        });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const canUse = state.status === 'success';
  const courses = instructorCoursesQuery.data?.items ?? [];
  const filteredCourses = React.useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [courseSearch, courses]);

  React.useEffect(() => {
    if (!selectedCourseId) return;
    if (filteredCourses.some((c) => c.id === selectedCourseId)) return;
    setSelectedCourseId(null);
    setSelectedCourseSlug(null);
    setSelectedCourseTitle(null);
  }, [filteredCourses, selectedCourseId]);

  return (
    <div className="space-y-6 pb-24">

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Acceso</CardTitle>
            <CardDescription>Solo el rol instructor puede usar esta vista.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {state.status === 'loading' ? (
            <LoadingState label="Cargando sesión...">
              <div className="space-y-3">
                <Skeleton className="h-6 w-72" />
                <Skeleton className="h-4 w-80" />
              </div>
            </LoadingState>
          ) : state.status === 'unauthorized' ? (
            <EmptyState
              title="Necesitas iniciar sesión"
              description="Entra con tu cuenta para acceder a Studio."
              action={
                <Button variant="secondary" onClick={() => router.replace('/login')}>
                  Ir a login
                </Button>
              }
            />
          ) : state.status === 'forbidden' ? (
            <ErrorState
              title="Sin permisos de instructor"
              description="Tu usuario no tiene rol instructor."
              action={
                <Button asChild variant="secondary">
                  <Link href="/dashboard">Volver al dashboard</Link>
                </Button>
              }
            />
          ) : state.status === 'error' ? (
            <ErrorState
              title="No se pudo cargar tu sesión"
              description={state.message}
              action={
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => router.refresh()}>
                    Recargar
                  </Button>
                  <Button variant="ghost" onClick={() => router.replace('/login')}>
                    Ir a login
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="text-sm text-fg-muted">
              <span className="font-mono text-xs text-fg">{state.user.email}</span>
              <span className="px-2 text-line/60">|</span>
              roles: <span className="font-mono text-xs text-fg">{state.user.roles.join(', ')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>Curso</CardTitle>
            <CardDescription>Elige uno de tus cursos para gestionar sus lecciones.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-2">
              <label className="text-sm text-fg" htmlFor="course-search">
                Buscar
              </label>
              <Input
                id="course-search"
                placeholder="Título o slug..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                disabled={!canUse}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-fg">Estado</div>
              <Tabs
                value={courseState}
                onValueChange={(v) => setCourseState(v as 'all' | CourseState)}
                items={[
                  { value: 'all', label: 'Todos' },
                  { value: 'published', label: 'Publicado' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'review', label: 'Review' },
                ]}
                className="w-full"
              />
            </div>
          </div>

          {!canUse ? (
            <EmptyState title="Acceso requerido" description="Inicia sesión como instructor para ver tus cursos." />
          ) : instructorCoursesQuery.isLoading ? (
            <LoadingState label="Cargando tus cursos...">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-line/10 bg-bg-2 p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </LoadingState>
          ) : instructorCoursesQuery.isError ? (
            <ErrorState
              title="No se pudieron cargar tus cursos"
              description="Reintenta. Si el error persiste, revisa tu sesión."
              action={
                <Button variant="secondary" onClick={() => instructorCoursesQuery.refetch()}>
                  Reintentar
                </Button>
              }
            />
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              title="No hay cursos para mostrar"
              description="Prueba con otro estado o borra la búsqueda."
              action={
                <Button variant="secondary" onClick={() => setCourseSearch('')}>
                  Limpiar búsqueda
                </Button>
              }
            />
          ) : (
            <Reveal>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((c) => {
                  const selected = c.id === selectedCourseId;
                  return (
                    <RevealItem key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourseId(c.id);
                          setSelectedCourseSlug(c.slug);
                          setSelectedCourseTitle(c.title);
                        }}
                        className="w-full text-left"
                      >
                        <Card
                          variant={selected ? 'gradient' : 'solid'}
                          className="transition-[transform,opacity] duration-200 ease-brand active:translate-y-px motion-reduce:transition-none"
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <CardTitle className="truncate">{c.title}</CardTitle>
                                <CardDescription className="truncate">{c.slug}</CardDescription>
                              </div>
                              <Badge variant="neutral">{c.state}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="flex items-center justify-between text-xs text-fg-dim">
                            <span className="font-mono">{c.sections.length} secciones</span>
                            <span className="font-mono">{c.createdAt.slice(0, 10)}</span>
                          </CardContent>
                        </Card>
                      </button>
                    </RevealItem>
                  );
                })}
              </div>
            </Reveal>
          )}

          {selectedCourseId ? (
            <div className="rounded-lg border border-line/10 bg-bg-2 px-4 py-3 text-sm text-fg-muted">
              Curso seleccionado:{' '}
              <span className="text-fg">{selectedCourseTitle ?? selectedCourseSlug ?? selectedCourseId}</span>
              <span className="px-2 text-line/60">|</span>
              <span className="font-mono text-xs">{selectedCourseId}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Temario</CardTitle>
              <CardDescription>Sube video y adjuntos por lección.</CardDescription>
            </div>
            {selectedCourseSlug ? (
              <Button asChild variant="glass" size="sm">
                <Link href={`/courses/${selectedCourseSlug}`}>Abrir curso</Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedCourseId ? (
            <EmptyState title="Elige un curso" description="Selecciona un curso para ver sus secciones y lecciones." />
          ) : lessonsQuery.isLoading ? (
            <LoadingState label="Cargando temario...">
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </LoadingState>
          ) : lessonsQuery.isError ? (
            <ErrorState
              title="No se pudo cargar el temario"
              description="Reintenta. Si el error persiste, revisa tus permisos."
              action={
                <Button variant="secondary" onClick={() => lessonsQuery.refetch()}>
                  Reintentar
                </Button>
              }
            />
          ) : lessonsQuery.data?.sections?.length ? (
            <div className="space-y-6">
              {lessonsQuery.data.sections.map((section) => {
                const lessons = section.lessons ?? [];
                return (
                  <div key={section.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-fg">{section.title}</div>
                        <div className="mt-1 text-xs text-fg-muted">
                          <span className="font-mono">{lessons.length} lecciones</span>
                          <span className="px-2 text-line/60">|</span>
                          <span className="font-mono text-[11px]">{section.id}</span>
                        </div>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    {lessons.length === 0 ? (
                      <EmptyState
                        title="Sin lecciones"
                        description="Esta sección aún no tiene lecciones."
                        className="text-left"
                      />
                    ) : (
                      <div className="space-y-3">
                        {lessons.map((lesson) => (
                          <LessonRow
                            key={lesson.id}
                            courseId={selectedCourseId}
                            courseSlug={selectedCourseSlug ?? ''}
                            sectionId={section.id}
                            lesson={lesson}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Temario vacío" description="Este curso aún no tiene secciones o lecciones." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

