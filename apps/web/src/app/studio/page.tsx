'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Course, CourseLevel, CourseState, CreateCourseRequest, Lesson, LessonType, Section, UserMe } from '@kodira/types';
import { COURSE_LEVELS, LESSON_TYPES } from '@kodira/types';
import {
  getKodiraApiClient,
  useAddLessonMutation,
  useAddSectionMutation,
  useCourseCategoriesQuery,
  useCreateCourseMutation,
  useCreateUploadUrlMutation,
  useDeleteLessonMutation,
  useDeleteSectionMutation,
  useInstructorCoursesQuery,
  usePublishCourseMutation,
  useUpdateCourseMutation,
  useUpdateLessonMutation,
  useUpdateSectionMutation,
} from '@kodira/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Progress,
  Reveal,
  RevealItem,
  Select,
  Separator,
  Skeleton,
  Tabs,
  Textarea,
  Toggle,
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

type SelectedCourseState =
  | { status: 'idle' }
  | { status: 'loading'; courseId: string }
  | { status: 'error'; courseId: string; message: string }
  | { status: 'success'; course: Course };

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

function sortSections(sections: Section[]) {
  return [...(sections ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function sortLessons(lessons: Lesson[]) {
  return [...(lessons ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function formatSeconds(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '0:00';
  const total = Math.round(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function StatusBadge({ state }: { state: UploadState }) {
  if (state.status === 'idle') return <Badge variant="neutral">LISTO</Badge>;
  if (state.status === 'preparing') return <Badge variant="neutral">PREPARANDO</Badge>;
  if (state.status === 'uploading') return <Badge variant="neutral">SUBIENDO {state.progress}%</Badge>;
  if (state.status === 'saving') return <Badge variant="neutral">GUARDANDO</Badge>;
  if (state.status === 'success') return <Badge variant="success">OK</Badge>;
  return <Badge variant="danger">ERROR</Badge>;
}

function Field(params: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-fg">{params.label}</label>
        {params.hint ? <span className="text-xs text-fg-dim">{params.hint}</span> : null}
      </div>
      {params.children}
      {params.error ? <div className="text-sm text-danger-fg">{params.error}</div> : null}
    </div>
  );
}

function ConfirmDialog(params: {
  title: string;
  description: string;
  confirmLabel: string;
  trigger: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  variant?: 'danger' | 'secondary';
}) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await params.onConfirm();
      setOpen(false);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setError(apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo completar la acción.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (submitting ? undefined : setOpen(v))}>
      <DialogTrigger asChild>{params.trigger}</DialogTrigger>
      <DialogContent className="p-0">
        <div className="p-6">
          <DialogTitle>{params.title}</DialogTitle>
          <DialogDescription className="mt-2">{params.description}</DialogDescription>
          {error ? (
            <div className="mt-4 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
              {error}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line/10 bg-bg-2/30 p-4 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="ghost" disabled={submitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant={params.variant === 'danger' ? 'danger' : 'secondary'}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? 'Procesando...' : params.confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CourseFormDialog(params: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  course?: Course | null;
  onSubmit: (data: CreateCourseRequest | { courseId: string; data: Partial<CreateCourseRequest> }) => Promise<void>;
}) {
  const categoriesQuery = useCourseCategoriesQuery();

  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const initial = params.course;
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [shortDescription, setShortDescription] = React.useState(initial?.shortDescription ?? '');
  const [description, setDescription] = React.useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = React.useState<string>(initial?.category?.id ?? '');
  const [level, setLevel] = React.useState<CourseLevel>(initial?.level ?? 'beginner');
  const [language, setLanguage] = React.useState(initial?.language ?? 'es');
  const [isFree, setIsFree] = React.useState<boolean>(initial?.isFree ?? true);
  const [price, setPrice] = React.useState<number>(initial?.price ?? 0);
  const [thumbnailUrl, setThumbnailUrl] = React.useState(initial?.thumbnailUrl ?? '');

  React.useEffect(() => {
    if (!params.open) return;
    setError(null);
    setSubmitting(false);
    setTitle(initial?.title ?? '');
    setShortDescription(initial?.shortDescription ?? '');
    setDescription(initial?.description ?? '');
    setCategoryId(initial?.category?.id ?? '');
    setLevel(initial?.level ?? 'beginner');
    setLanguage(initial?.language ?? 'es');
    setIsFree(initial?.isFree ?? true);
    setPrice(initial?.price ?? 0);
    setThumbnailUrl(initial?.thumbnailUrl ?? '');
  }, [initial?.category?.id, initial?.description, initial?.isFree, initial?.language, initial?.level, initial?.price, initial?.shortDescription, initial?.thumbnailUrl, initial?.title, params.open]);

  const [titleError, setTitleError] = React.useState<string | null>(null);
  const [priceError, setPriceError] = React.useState<string | null>(null);

  const validate = () => {
    const t = title.trim();
    setTitleError(t.length < 2 ? 'El título debe tener al menos 2 caracteres.' : null);
    if (!isFree) {
      setPriceError(price <= 0 ? 'El precio debe ser mayor que 0.' : null);
    } else {
      setPriceError(null);
    }
    return t.length >= 2 && (isFree || price > 0);
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (params.mode === 'create') {
        await params.onSubmit({
          title: title.trim(),
          shortDescription: shortDescription.trim().length ? shortDescription.trim() : null,
          description: description.trim().length ? description.trim() : null,
          categoryId: categoryId || null,
          level,
          language: language.trim().length ? language.trim() : 'es',
          isFree,
          price: isFree ? 0 : price,
          thumbnailUrl: thumbnailUrl.trim().length ? thumbnailUrl.trim() : null,
        });
      } else {
        await params.onSubmit({
          courseId: params.course!.id,
          data: {
            title: title.trim(),
            shortDescription: shortDescription.trim().length ? shortDescription.trim() : null,
            description: description.trim().length ? description.trim() : null,
            categoryId: categoryId || null,
            level,
            language: language.trim().length ? language.trim() : 'es',
            isFree,
            price: isFree ? 0 : price,
            thumbnailUrl: thumbnailUrl.trim().length ? thumbnailUrl.trim() : null,
          },
        });
      }
      params.onOpenChange(false);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setError(apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo guardar el curso.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={params.open} onOpenChange={(v) => (submitting ? undefined : params.onOpenChange(v))}>
      <DialogContent className="p-0">
        <div className="p-6">
          <DialogTitle>{params.mode === 'create' ? 'Nuevo curso' : 'Editar curso'}</DialogTitle>
          <DialogDescription className="mt-2">
            {params.mode === 'create'
              ? 'Crea el curso en draft. Después podrás montar el temario y publicar.'
              : 'Actualiza título, categoría, precio y portada.'}
          </DialogDescription>

          {error ? (
            <div className="mt-4 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            <Field label="Título" error={titleError}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Next.js desde cero" />
            </Field>

            <Field label="Descripción corta" hint="Opcional">
              <Input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Una frase para la tarjeta del catálogo."
              />
            </Field>

            <Field label="Descripción" hint="Opcional">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Qué aprenderá el alumno, para quién es, y qué incluye."
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Categoría">
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={categoriesQuery.isLoading || categoriesQuery.isError}
                >
                  <option value="">Sin categoría</option>
                  {(categoriesQuery.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Nivel">
                <Select value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)}>
                  {COURSE_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Idioma">
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="es" />
              </Field>

              <Field label="Portada (URL)" hint="Opcional">
                <Input
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[14px] border border-line/10 bg-bg-2/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-fg">Gratis</div>
                    <div className="mt-1 text-xs text-fg-muted">Si está activo, el precio se fuerza a 0.</div>
                  </div>
                  <Toggle checked={isFree} onCheckedChange={setIsFree} />
                </div>
              </div>

              <Field label="Precio" error={priceError}>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={String(isFree ? 0 : price)}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  disabled={isFree}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line/10 bg-bg-2/30 p-4 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="ghost" disabled={submitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button variant="primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LessonRow(params: {
  course: Course;
  section: Section;
  lesson: Lesson;
  onCourseUpdated: (course: Course) => void;
}) {
  const { course, section, lesson } = params;

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadState, setUploadState] = React.useState<UploadState>({ status: 'idle' });
  const [attachmentState, setAttachmentState] = React.useState<UploadState>({ status: 'idle' });
  const [resourceDraft, setResourceDraft] = React.useState('');
  const [editOpen, setEditOpen] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = React.useState(false);
  const [rowError, setRowError] = React.useState<string | null>(null);

  const [draftTitle, setDraftTitle] = React.useState(lesson.title ?? '');
  const [draftType, setDraftType] = React.useState<LessonType>(lesson.type);
  const [draftIsFreePreview, setDraftIsFreePreview] = React.useState<boolean>(lesson.isFreePreview);
  const [draftDurationSeconds, setDraftDurationSeconds] = React.useState<string>(
    String(typeof lesson.videoDuration === 'number' ? Math.round(lesson.videoDuration) : 0),
  );

  React.useEffect(() => {
    if (!editOpen) return;
    setEditError(null);
    setDraftTitle(lesson.title ?? '');
    setDraftType(lesson.type);
    setDraftIsFreePreview(lesson.isFreePreview);
    setDraftDurationSeconds(String(typeof lesson.videoDuration === 'number' ? Math.round(lesson.videoDuration) : 0));
  }, [editOpen, lesson.isFreePreview, lesson.title, lesson.type, lesson.videoDuration]);

  const createUploadUrl = useCreateUploadUrlMutation();
  const updateLesson = useUpdateLessonMutation();
  const deleteLesson = useDeleteLessonMutation();

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
        courseId: course.id,
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
      const updated = await updateLesson.mutateAsync({
        courseId: course.id,
        sectionId: section.id,
        lessonId: lesson.id,
        data: {
          videoUrl: res.publicUrl,
          videoDuration: durationSeconds,
        },
      });
      params.onCourseUpdated(updated);

      setUploadState({ status: 'success' });
      window.setTimeout(() => setUploadState({ status: 'idle' }), 1_000);
      setRowError(null);
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
        courseId: course.id,
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
      const updated = await updateLesson.mutateAsync({
        courseId: course.id,
        sectionId: section.id,
        lessonId: lesson.id,
        data: {
          resourceUrls: [...existing, res.publicUrl],
        },
      });
      params.onCourseUpdated(updated);

      setAttachmentState({ status: 'success' });
      window.setTimeout(() => setAttachmentState({ status: 'idle' }), 1_000);
      setRowError(null);
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

  const sectionLessons = sortLessons(section.lessons ?? []);
  const idx = sectionLessons.findIndex((l) => l.id === lesson.id);
  const canMoveUp = idx > 0;
  const canMoveDown = idx >= 0 && idx < sectionLessons.length - 1;

  const moveLesson = async (direction: 'up' | 'down') => {
    try {
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const other = sectionLessons[targetIdx];
      if (!other) return;
      const aOrder = lesson.order ?? idx;
      const bOrder = other.order ?? targetIdx;

      const updatedA = await updateLesson.mutateAsync({
        courseId: course.id,
        sectionId: section.id,
        lessonId: lesson.id,
        data: { order: bOrder },
      });
      params.onCourseUpdated(updatedA);

      const updatedB = await updateLesson.mutateAsync({
        courseId: course.id,
        sectionId: section.id,
        lessonId: other.id,
        data: { order: aOrder },
      });
      params.onCourseUpdated(updatedB);
      setRowError(null);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setRowError(apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo reordenar la lección.'));
    }
  };

  const onRemoveResource = async (url: string) => {
    try {
      const next = (lesson.resourceUrls ?? []).filter((x) => x !== url);
      const updated = await updateLesson.mutateAsync({
        courseId: course.id,
        sectionId: section.id,
        lessonId: lesson.id,
        data: { resourceUrls: next },
      });
      params.onCourseUpdated(updated);
      setRowError(null);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setRowError(apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo quitar el recurso.'));
    }
  };

  const onAddResource = async () => {
    const nextUrl = resourceDraft.trim();
    if (!nextUrl) return;
    try {
      const next = Array.from(new Set([...(lesson.resourceUrls ?? []), nextUrl]));
      const updated = await updateLesson.mutateAsync({
        courseId: course.id,
        sectionId: section.id,
        lessonId: lesson.id,
        data: { resourceUrls: next },
      });
      params.onCourseUpdated(updated);
      setResourceDraft('');
      setRowError(null);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setRowError(apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo añadir el recurso.'));
    }
  };

  const onSaveLessonMeta = async () => {
    const titleValue = draftTitle.trim();
    if (titleValue.length < 2) {
      setEditError('El título debe tener al menos 2 caracteres.');
      return;
    }
    const rawDuration = Number(draftDurationSeconds);
    const nextDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : null;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const updated = await updateLesson.mutateAsync({
        courseId: course.id,
        sectionId: section.id,
        lessonId: lesson.id,
        data: {
          title: titleValue,
          type: draftType,
          isFreePreview: draftIsFreePreview,
          videoDuration: nextDuration,
        },
      });
      params.onCourseUpdated(updated);
      setEditOpen(false);
      setRowError(null);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setEditError(apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo guardar la lección.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-fg">{lesson.title}</p>
            <Badge variant="neutral">{lesson.type}</Badge>
            {hasVideo ? <Badge variant="success">VIDEO OK</Badge> : <Badge variant="neutral">SIN VIDEO</Badge>}
            <Badge variant="neutral">{formatSeconds(lesson.videoDuration)}</Badge>
            {hasAttachments ? (
              <Badge variant="neutral">{lesson.resourceUrls.length} adjunto(s)</Badge>
            ) : null}
            {lesson.isFreePreview ? <Badge variant="available">Preview</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted-fg">
            Lección: <span className="font-mono text-[11px] text-fg">{lesson.id}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <Dialog open={editOpen} onOpenChange={(v) => (editSubmitting ? undefined : setEditOpen(v))}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0">
                <div className="p-6">
                  <DialogTitle>Editar lección</DialogTitle>
                  <DialogDescription className="mt-2">Ajusta título, tipo, preview y duración.</DialogDescription>
                  {editError ? (
                    <div className="mt-4 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
                      {editError}
                    </div>
                  ) : null}
                  <div className="mt-5 grid gap-4">
                    <Field label="Título">
                      <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Tipo">
                        <Select value={draftType} onChange={(e) => setDraftType(e.target.value as LessonType)}>
                          {LESSON_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <div className="rounded-[14px] border border-line/10 bg-bg-2/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-fg">Preview</div>
                            <div className="mt-1 text-xs text-fg-muted">Visible sin inscripción.</div>
                          </div>
                          <Toggle checked={draftIsFreePreview} onCheckedChange={setDraftIsFreePreview} />
                        </div>
                      </div>
                    </div>
                    <Field label="Duración (segundos)" hint="0 para desconocida">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={draftDurationSeconds}
                        onChange={(e) => setDraftDurationSeconds(e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-line/10 bg-bg-2/30 p-4 sm:flex-row sm:justify-end">
                  <DialogClose asChild>
                    <Button variant="ghost" disabled={editSubmitting}>
                      Cerrar
                    </Button>
                  </DialogClose>
                  <Button variant="primary" onClick={() => void onSaveLessonMeta()} disabled={editSubmitting}>
                    {editSubmitting ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="secondary" size="sm" onClick={onPickVideo} disabled={uploadState.status !== 'idle'}>
              Subir video
            </Button>
            <Button variant="ghost" size="sm" onClick={onPickAttachment} disabled={attachmentState.status !== 'idle'}>
              Subir adjunto
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canMoveUp || updateLesson.isPending}
              onClick={() => void moveLesson('up')}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canMoveDown || updateLesson.isPending}
              onClick={() => void moveLesson('down')}
            >
              ↓
            </Button>
            <ConfirmDialog
              title="Eliminar lección"
              description="Esta acción no se puede deshacer."
              confirmLabel="Eliminar"
              variant="danger"
              trigger={
                <Button variant="ghost" size="sm">
                  Eliminar
                </Button>
              }
              onConfirm={async () => {
                await deleteLesson.mutateAsync({
                  courseId: course.id,
                  sectionId: section.id,
                  lessonId: lesson.id,
                });
                const nextCourse: Course = {
                  ...course,
                  sections: (course.sections ?? []).map((s) =>
                    s.id === section.id ? { ...s, lessons: (s.lessons ?? []).filter((l) => l.id !== lesson.id) } : s,
                  ),
                };
                params.onCourseUpdated(nextCourse);
                setRowError(null);
              }}
            />
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

      {rowError ? (
        <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
          {rowError}
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
          <div className="space-y-2">
            {lesson.resourceUrls.map((url) => (
              <div key={url} className="flex items-center justify-between gap-2">
                <a
                  className="min-w-0 truncate text-sm text-primary underline underline-offset-4 hover:opacity-90"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {url}
                </a>
                <Button variant="ghost" size="sm" onClick={() => void onRemoveResource(url)}>
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          placeholder="Añadir recurso por URL (https://...)"
          value={resourceDraft}
          onChange={(e) => setResourceDraft(e.target.value)}
        />
        <Button variant="secondary" size="sm" onClick={() => void onAddResource()} disabled={!resourceDraft.trim()}>
          Añadir
        </Button>
      </div>

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
  const [selectedCourse, setSelectedCourse] = React.useState<SelectedCourseState>({ status: 'idle' });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [curriculumError, setCurriculumError] = React.useState<string | null>(null);
  const [uploadCoverState, setUploadCoverState] = React.useState<UploadState>({ status: 'idle' });

  const instructorCoursesQuery = useInstructorCoursesQuery(
    {
      page: 1,
      limit: 50,
      state: courseState === 'all' ? undefined : courseState,
    },
    { enabled: state.status === 'success' },
  );

  const createCourse = useCreateCourseMutation();
  const updateCourse = useUpdateCourseMutation();
  const publishCourse = usePublishCourseMutation();
  const addSection = useAddSectionMutation();
  const updateSection = useUpdateSectionMutation();
  const deleteSection = useDeleteSectionMutation();
  const addLesson = useAddLessonMutation();

  const createUploadUrl = useCreateUploadUrlMutation();

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
    setSelectedCourse({ status: 'idle' });
  }, [filteredCourses, selectedCourseId]);

  React.useEffect(() => {
    if (!selectedCourseId) return;
    if (!canUse) return;
    let cancelled = false;

    const run = async () => {
      setSelectedCourse({ status: 'loading', courseId: selectedCourseId });
      setCurriculumError(null);
      try {
        const course = await updateCourse.mutateAsync({ courseId: selectedCourseId, data: {} });
        if (cancelled) return;
        setSelectedCourse({ status: 'success', course });
      } catch (err) {
        if (cancelled) return;
        const apiError = getApiErrorResponse(err);
        setSelectedCourse({
          status: 'error',
          courseId: selectedCourseId,
          message: apiError?.message ?? 'No se pudo cargar el curso. Reintenta.',
        });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [canUse, selectedCourseId, updateCourse]);

  const selectedCourseValue = selectedCourse.status === 'success' ? selectedCourse.course : null;
  const selectedSections = selectedCourseValue ? sortSections(selectedCourseValue.sections ?? []) : [];

  const onCourseUpdated = (course: Course) => {
    setSelectedCourse({ status: 'success', course });
  };

  const onCreateCourse = async (data: CreateCourseRequest) => {
    const course = await createCourse.mutateAsync(data);
    await instructorCoursesQuery.refetch();
    setSelectedCourseId(course.id);
    setSelectedCourseSlug(course.slug);
    setSelectedCourseTitle(course.title);
    setSelectedCourse({ status: 'success', course });
  };

  const onUpdateCourse = async (payload: { courseId: string; data: Partial<CreateCourseRequest> }) => {
    const course = await updateCourse.mutateAsync({ courseId: payload.courseId, data: payload.data });
    await instructorCoursesQuery.refetch();
    setSelectedCourseSlug(course.slug);
    setSelectedCourseTitle(course.title);
    setSelectedCourse({ status: 'success', course });
  };

  const onPublishCourse = async () => {
    if (!selectedCourseValue) return;
    setCurriculumError(null);
    try {
      const course = await publishCourse.mutateAsync({ courseId: selectedCourseValue.id });
      await instructorCoursesQuery.refetch();
      setSelectedCourse({ status: 'success', course });
      setSelectedCourseSlug(course.slug);
      setSelectedCourseTitle(course.title);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setCurriculumError(
        apiError?.message ??
          (err instanceof Error ? err.message : 'No se pudo publicar. Revisa requisitos y reintenta.'),
      );
    }
  };

  const onUnpublishCourse = async () => {
    if (!selectedCourseValue) return;
    setCurriculumError(null);
    try {
      const course = await updateCourse.mutateAsync({ courseId: selectedCourseValue.id, data: { state: 'draft' } });
      await instructorCoursesQuery.refetch();
      setSelectedCourse({ status: 'success', course });
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setCurriculumError(apiError?.message ?? 'No se pudo despublicar. Reintenta.');
    }
  };

  const onAddSection = async (title: string) => {
    if (!selectedCourseValue) return;
    const nextOrder = selectedSections.length > 0 ? (selectedSections[selectedSections.length - 1].order ?? 0) + 1 : 0;
    const course = await addSection.mutateAsync({
      courseId: selectedCourseValue.id,
      data: { title: title.trim(), order: nextOrder },
    });
    onCourseUpdated(course);
  };

  const onMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!selectedCourseValue) return;
    const idx = selectedSections.findIndex((s) => s.id === sectionId);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const other = selectedSections[targetIdx];
    const current = selectedSections[idx];
    if (!other || !current) return;
    const aOrder = current.order ?? idx;
    const bOrder = other.order ?? targetIdx;
    const updatedA = await updateSection.mutateAsync({
      courseId: selectedCourseValue.id,
      sectionId: current.id,
      data: { order: bOrder },
    });
    onCourseUpdated(updatedA);
    const updatedB = await updateSection.mutateAsync({
      courseId: selectedCourseValue.id,
      sectionId: other.id,
      data: { order: aOrder },
    });
    onCourseUpdated(updatedB);
  };

  const onUploadCover = async (file: File) => {
    if (!selectedCourseValue) return;
    setUploadCoverState({ status: 'preparing' });
    try {
      const res = await createUploadUrl.mutateAsync({
        kind: 'image',
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        courseId: selectedCourseValue.id,
      });
      setUploadCoverState({ status: 'uploading', progress: 0 });
      await uploadWithProgress({
        uploadUrl: res.uploadUrl,
        file,
        contentType: file.type,
        onProgress: (progress) => setUploadCoverState({ status: 'uploading', progress }),
      });
      setUploadCoverState({ status: 'saving' });
      const updated = await updateCourse.mutateAsync({
        courseId: selectedCourseValue.id,
        data: { thumbnailUrl: res.publicUrl },
      });
      onCourseUpdated(updated);
      setUploadCoverState({ status: 'success' });
      window.setTimeout(() => setUploadCoverState({ status: 'idle' }), 1_000);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setUploadCoverState({
        status: 'error',
        message: apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo subir la portada.'),
      });
    }
  };

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
            <CardDescription>Crea, edita, publica y gestiona el temario.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => setCreateOpen(true)} disabled={!canUse}>
                Nuevo curso
              </Button>
              <Button
                variant="secondary"
                onClick={() => setEditOpen(true)}
                disabled={!selectedCourseValue || !canUse}
              >
                Editar datos
              </Button>
            </div>

            {selectedCourseValue ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{selectedCourseValue.state}</Badge>
                {selectedCourseValue.state === 'published' ? (
                  <Button variant="ghost" onClick={() => void onUnpublishCourse()} disabled={updateCourse.isPending}>
                    Despublicar
                  </Button>
                ) : (
                  <Button variant="glass" onClick={() => void onPublishCourse()} disabled={publishCourse.isPending}>
                    Publicar
                  </Button>
                )}
              </div>
            ) : (
              <Badge variant="neutral">SIN SELECCIÓN</Badge>
            )}
          </div>

          {curriculumError ? (
            <div className="rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
              {curriculumError}
            </div>
          ) : null}

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
                  { value: 'archived', label: 'Archivado' },
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
              <CardDescription>Añade secciones y lecciones, reordena y sube contenido.</CardDescription>
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
            <EmptyState title="Elige un curso" description="Selecciona un curso para editar su temario." />
          ) : selectedCourse.status === 'loading' ? (
            <LoadingState label="Cargando curso...">
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </LoadingState>
          ) : selectedCourse.status === 'error' ? (
            <ErrorState
              title="No se pudo cargar el curso"
              description={selectedCourse.message}
              action={
                <Button variant="secondary" onClick={() => updateCourse.mutate({ courseId: selectedCourse.courseId, data: {} })}>
                  Reintentar
                </Button>
              }
            />
          ) : selectedCourseValue ? (
            <div className="space-y-6">
              <div className="rounded-[14px] border border-line/10 bg-bg-2/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-[16px] font-bold leading-[1.1] text-fg">{selectedCourseValue.title}</div>
                    <div className="mt-1 text-sm text-fg-muted">
                      {selectedCourseValue.isFree ? 'Gratis' : `${selectedCourseValue.price} EUR`} · {selectedCourseValue.level} ·{' '}
                      {selectedCourseValue.language}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="hidden"
                      id="course-cover-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (!file) return;
                        void onUploadCover(file);
                        e.currentTarget.value = '';
                      }}
                    />
                    <Button asChild variant="secondary" size="sm" disabled={!selectedCourseValue}>
                      <label htmlFor="course-cover-upload">Subir portada</label>
                    </Button>
                    <StatusBadge state={uploadCoverState} />
                  </div>
                </div>

                {uploadCoverState.status === 'uploading' ? (
                  <div className="mt-3">
                    <Progress value={uploadCoverState.progress} />
                  </div>
                ) : null}

                {uploadCoverState.status === 'error' ? (
                  <div className="mt-3 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
                    {uploadCoverState.message}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-fg">Secciones</div>
                  <div className="mt-1 text-xs text-fg-muted">Crea y ordena el temario.</div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="primary" size="sm">
                      Añadir sección
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="p-0">
                    <AddSectionDialogContent onCreate={(title) => void onAddSection(title)} />
                  </DialogContent>
                </Dialog>
              </div>

              {selectedSections.length === 0 ? (
                <EmptyState title="Temario vacío" description="Añade una sección para empezar." />
              ) : (
                <div className="space-y-6">
                  {selectedSections.map((section, sectionIndex) => {
                    const lessons = sortLessons(section.lessons ?? []);
                    const canMoveUp = sectionIndex > 0;
                    const canMoveDown = sectionIndex < selectedSections.length - 1;

                    return (
                      <div key={section.id} className="rounded-[18px] border border-line/10 bg-surface p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-fg">{section.title}</div>
                            <div className="mt-1 text-xs text-fg-muted">
                              <span className="font-mono">{lessons.length} lecciones</span>
                              <span className="px-2 text-line/60">|</span>
                              <span className="font-mono text-[11px]">{section.id}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canMoveUp || updateSection.isPending}
                              onClick={() => void onMoveSection(section.id, 'up')}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canMoveDown || updateSection.isPending}
                              onClick={() => void onMoveSection(section.id, 'down')}
                            >
                              ↓
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Editar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="p-0">
                                <EditSectionDialogContent
                                  section={section}
                                  onSave={async (title) => {
                                    const updated = await updateSection.mutateAsync({
                                      courseId: selectedCourseValue.id,
                                      sectionId: section.id,
                                      data: { title: title.trim() },
                                    });
                                    onCourseUpdated(updated);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>

                            <ConfirmDialog
                              title="Eliminar sección"
                              description="También eliminarás todas sus lecciones."
                              confirmLabel="Eliminar"
                              variant="danger"
                              trigger={
                                <Button variant="ghost" size="sm">
                                  Eliminar
                                </Button>
                              }
                              onConfirm={async () => {
                                await deleteSection.mutateAsync({ courseId: selectedCourseValue.id, sectionId: section.id });
                                const nextCourse: Course = {
                                  ...selectedCourseValue,
                                  sections: (selectedCourseValue.sections ?? []).filter((s) => s.id !== section.id),
                                };
                                onCourseUpdated(nextCourse);
                              }}
                            />

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="secondary" size="sm">
                                  Añadir lección
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="p-0">
                                <AddLessonDialogContent
                                  onCreate={async (data) => {
                                    const nextOrder = lessons.length > 0 ? (lessons[lessons.length - 1].order ?? 0) + 1 : 0;
                                    const updated = await addLesson.mutateAsync({
                                      courseId: selectedCourseValue.id,
                                      sectionId: section.id,
                                      data: { ...data, order: nextOrder },
                                    });
                                    onCourseUpdated(updated);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {lessons.length === 0 ? (
                          <EmptyState title="Sin lecciones" description="Añade la primera lección." className="text-left" />
                        ) : (
                          <div className="space-y-3">
                            {lessons.map((lesson) => (
                              <LessonRow
                                key={lesson.id}
                                course={selectedCourseValue}
                                section={section}
                                lesson={lesson}
                                onCourseUpdated={onCourseUpdated}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <EmptyState title="Carga pendiente" description="Selecciona un curso para ver su temario." />
          )}
        </CardContent>
      </Card>

      <CourseFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSubmit={(data) => onCreateCourse(data as CreateCourseRequest)}
      />

      <CourseFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        course={selectedCourseValue}
        onSubmit={(data) => onUpdateCourse(data as any)}
      />
    </div>
  );
}

function AddSectionDialogContent(params: { onCreate: (title: string) => void | Promise<void> }) {
  const [title, setTitle] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    const t = title.trim();
    if (t.length < 2) {
      setError('El título debe tener al menos 2 caracteres.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await params.onCreate(t);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setError(apiError?.message ?? 'No se pudo crear la sección.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <DialogTitle>Añadir sección</DialogTitle>
        <DialogDescription className="mt-2">Estructura el curso en bloques cortos.</DialogDescription>
        {error ? (
          <div className="mt-4 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
            {error}
          </div>
        ) : null}
        <div className="mt-5">
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Fundamentos" />
          </Field>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-line/10 bg-bg-2/30 p-4 sm:flex-row sm:justify-end">
        <DialogClose asChild>
          <Button variant="ghost" disabled={submitting}>
            Cancelar
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="primary" onClick={() => void onSubmit()} disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear'}
          </Button>
        </DialogClose>
      </div>
    </>
  );
}

function EditSectionDialogContent(params: { section: Section; onSave: (title: string) => void | Promise<void> }) {
  const [title, setTitle] = React.useState(params.section.title ?? '');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setTitle(params.section.title ?? '');
  }, [params.section.title]);

  const onSubmit = async () => {
    const t = title.trim();
    if (t.length < 2) {
      setError('El título debe tener al menos 2 caracteres.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await params.onSave(t);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setError(apiError?.message ?? 'No se pudo actualizar la sección.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <DialogTitle>Editar sección</DialogTitle>
        <DialogDescription className="mt-2">Renombra la sección sin romper el temario.</DialogDescription>
        {error ? (
          <div className="mt-4 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
            {error}
          </div>
        ) : null}
        <div className="mt-5">
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-line/10 bg-bg-2/30 p-4 sm:flex-row sm:justify-end">
        <DialogClose asChild>
          <Button variant="ghost" disabled={submitting}>
            Cancelar
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="primary" onClick={() => void onSubmit()} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogClose>
      </div>
    </>
  );
}

function AddLessonDialogContent(params: { onCreate: (data: { title: string; type: LessonType; isFreePreview: boolean }) => void | Promise<void> }) {
  const [title, setTitle] = React.useState('');
  const [type, setType] = React.useState<LessonType>('video');
  const [isFreePreview, setIsFreePreview] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    const t = title.trim();
    if (t.length < 2) {
      setError('El título debe tener al menos 2 caracteres.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await params.onCreate({ title: t, type, isFreePreview });
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setError(apiError?.message ?? 'No se pudo crear la lección.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <DialogTitle>Añadir lección</DialogTitle>
        <DialogDescription className="mt-2">Crea la lección y luego sube video y recursos.</DialogDescription>
        {error ? (
          <div className="mt-4 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
            {error}
          </div>
        ) : null}
        <div className="mt-5 grid gap-4">
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Instalación y setup" />
          </Field>
          <Field label="Tipo">
            <Select value={type} onChange={(e) => setType(e.target.value as LessonType)}>
              {LESSON_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <div className="rounded-[14px] border border-line/10 bg-bg-2/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-fg">Preview</div>
                <div className="mt-1 text-xs text-fg-muted">Visible sin inscripción.</div>
              </div>
              <Toggle checked={isFreePreview} onCheckedChange={setIsFreePreview} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-line/10 bg-bg-2/30 p-4 sm:flex-row sm:justify-end">
        <DialogClose asChild>
          <Button variant="ghost" disabled={submitting}>
            Cancelar
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="primary" onClick={() => void onSubmit()} disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear'}
          </Button>
        </DialogClose>
      </div>
    </>
  );
}

