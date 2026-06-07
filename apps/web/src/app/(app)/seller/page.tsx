'use client';

import * as React from 'react';
import Image from 'next/image';
import type { Offering, OfferingStatus, OfferingType, SellerProfile, SellerProfileStatus } from '@kodira/types';
import { OFFERING_TYPES } from '@kodira/types';
import {
  getKodiraApiClient,
  useApplySellerMutation,
  useCreateDigitalAssetMutation,
  useCreateOfferingUploadUrlMutation,
  useCreateSellerOfferingMutation,
  useMySellerOfferingsQuery,
  useMySellerProfileQuery,
  usePauseSellerOfferingMutation,
  useSubmitSellerOfferingMutation,
  useUnpauseSellerOfferingMutation,
  useUpdateSellerOfferingMutation,
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
  Field,
  Input,
  Select,
  Skeleton,
  Tabs,
  Textarea,
  Toggle,
  cn,
} from '@kodira/ui';
import { getApiErrorResponse, getApiStatus } from '../../../lib/apiError';

type SessionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; isSeller: boolean };

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'success' }
  | { status: 'error'; message: string };

function formatMoneyEUR(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function splitCsv(input: string) {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function statusLabel(status: OfferingStatus) {
  if (status === 'draft') return 'Borrador';
  if (status === 'pending') return 'Pendiente';
  if (status === 'published') return 'Publicada';
  if (status === 'paused') return 'Pausada';
  return 'Rechazada';
}

function statusBadgeVariant(status: OfferingStatus) {
  if (status === 'published') return 'ok' as const;
  if (status === 'pending') return 'inProgress' as const;
  if (status === 'paused') return 'soon' as const;
  if (status === 'rejected') return 'danger' as const;
  return 'neutral' as const;
}

function offeringTypeLabel(type: OfferingType) {
  if (type === 'digital_product') return 'Producto digital';
  if (type === 'fixed_package') return 'Paquete';
  return 'Servicio a medida';
}

function priceLabel(offering: Offering) {
  if (offering.type === 'custom_service') {
    if (typeof offering.price === 'number' && offering.price > 0) return `Desde ${formatMoneyEUR(offering.price)}`;
    return 'Presupuesto';
  }
  if (typeof offering.price === 'number') return formatMoneyEUR(offering.price);
  return 'Sin precio';
}

async function uploadWithProgress(params: {
  uploadUrl: string;
  file: File;
  onProgress: (progress: number) => void;
}) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', params.uploadUrl);
    xhr.setRequestHeader('Content-Type', params.file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)));
      params.onProgress(pct);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(params.file);
  });
}

function SellerStatusCard({ seller }: { seller: SellerProfile }) {
  const label =
    seller.status === 'pending'
      ? 'Pendiente de aprobación'
      : seller.status === 'rejected'
        ? 'Rechazado'
        : seller.status === 'suspended'
          ? 'Suspendido'
          : 'Aprobado';

  const variant =
    seller.status === 'approved'
      ? 'ok'
      : seller.status === 'pending'
        ? 'inProgress'
        : seller.status === 'rejected'
          ? 'danger'
          : 'soon';

  return (
    <Card className="border-line/10 bg-bg-2/40">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Tu perfil de vendedor</span>
          <Badge variant={variant}>{label}</Badge>
        </CardTitle>
        <CardDescription>
          {seller.status === 'approved'
            ? 'Ya puedes crear y publicar ofertas.'
            : 'Revisaremos tu solicitud y activaremos el panel cuando esté aprobada.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-fg-muted">
          <span className="font-semibold text-fg">{seller.displayName}</span>
          <span className="px-2 text-line/60">/</span>
          <span className="text-fg-dim">{seller.categories.join(', ') || 'Sin categorías'}</span>
        </div>
        <div className="text-sm text-fg-muted">★ {seller.ratingAvg.toFixed(1)} · {seller.salesCount} ventas</div>
      </CardContent>
    </Card>
  );
}

function OfferingFormDialog(params: {
  mode: 'create' | 'edit';
  initial?: Offering;
  onSaved?: (offering: Offering) => void;
}) {
  const createOffering = useCreateSellerOfferingMutation();
  const updateOffering = useUpdateSellerOfferingMutation();
  const createUploadUrl = useCreateOfferingUploadUrlMutation();
  const createAsset = useCreateDigitalAssetMutation();

  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [uploadState, setUploadState] = React.useState<UploadState>({ status: 'idle' });

  const initial = params.initial;
  const [type, setType] = React.useState<OfferingType>(initial?.type ?? 'digital_product');
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [description, setDescription] = React.useState(initial?.description ?? '');
  const [category, setCategory] = React.useState(initial?.category ?? '');
  const [coverImageUrl, setCoverImageUrl] = React.useState(initial?.coverImageUrl ?? '');
  const [gallery, setGallery] = React.useState((initial?.gallery ?? []).join('\n'));
  const [price, setPrice] = React.useState<string>(typeof initial?.price === 'number' ? String(initial.price) : '');
  const [deliveryDays, setDeliveryDays] = React.useState<string>(
    typeof initial?.deliveryDays === 'number' ? String(initial.deliveryDays) : '',
  );
  const [deliverables, setDeliverables] = React.useState((initial?.deliverables ?? []).join('\n'));
  const [licenseTerms, setLicenseTerms] = React.useState('Uso personal y comercial en un único proyecto.');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    setUploadState({ status: 'idle' });
    setType(initial?.type ?? 'digital_product');
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setCategory(initial?.category ?? '');
    setCoverImageUrl(initial?.coverImageUrl ?? '');
    setGallery((initial?.gallery ?? []).join('\n'));
    setPrice(typeof initial?.price === 'number' ? String(initial.price) : '');
    setDeliveryDays(typeof initial?.deliveryDays === 'number' ? String(initial.deliveryDays) : '');
    setDeliverables((initial?.deliverables ?? []).join('\n'));
  }, [initial, open]);

  const validate = () => {
    if (title.trim().length < 2) return 'El título debe tener al menos 2 caracteres.';
    if (description.trim().length < 10) return 'La descripción debe tener al menos 10 caracteres.';
    if (!category.trim()) return 'La categoría es obligatoria.';

    const priceValue = price.trim() ? Number(price) : null;
    if (type !== 'custom_service' && (!priceValue || !Number.isFinite(priceValue) || priceValue <= 0)) {
      return 'El precio es obligatorio para este tipo de oferta.';
    }
    if (type === 'custom_service' && price.trim() && (!Number.isFinite(priceValue) || (priceValue ?? 0) <= 0)) {
      return 'El precio "desde" debe ser un número mayor que 0.';
    }

    if (type === 'fixed_package') {
      const dd = Number(deliveryDays);
      if (!Number.isFinite(dd) || dd <= 0) return 'Los días de entrega deben ser un número mayor que 0.';
      const ds = deliverables
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (ds.length === 0) return 'Añade al menos un deliverable.';
    }

    return null;
  };

  const onSave = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    const parsedPrice = price.trim() ? Number(price) : null;
    const parsedDeliveryDays = deliveryDays.trim() ? Number(deliveryDays) : null;
    const parsedGallery = gallery
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedDeliverables = deliverables
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    setError(null);
    try {
      if (params.mode === 'create') {
        const res = await createOffering.mutateAsync({
          type,
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          coverImageUrl: coverImageUrl.trim() ? coverImageUrl.trim() : null,
          gallery: parsedGallery,
          price: parsedPrice,
          deliveryDays: type === 'fixed_package' ? parsedDeliveryDays : null,
          deliverables: type === 'fixed_package' ? parsedDeliverables : [],
        });
        params.onSaved?.(res.offering);
        setOpen(false);
      } else if (params.mode === 'edit' && initial) {
        const res = await updateOffering.mutateAsync({
          offeringId: initial.id,
          data: {
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            coverImageUrl: coverImageUrl.trim() ? coverImageUrl.trim() : null,
            gallery: parsedGallery,
            price: parsedPrice,
            deliveryDays: type === 'fixed_package' ? parsedDeliveryDays : null,
            deliverables: type === 'fixed_package' ? parsedDeliverables : [],
          },
        });
        params.onSaved?.(res.offering);
        setOpen(false);
      }
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setError(apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo guardar la oferta.'));
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = () => fileInputRef.current?.click();

  const onUploadDigitalAsset = async (file: File, offeringId: string) => {
    setUploadState({ status: 'uploading', progress: 1 });
    try {
      const uploadUrlRes = await createUploadUrl.mutateAsync({
        offeringId,
        data: {
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        },
      });

      await uploadWithProgress({
        uploadUrl: uploadUrlRes.uploadUrl,
        file,
        onProgress: (p) => setUploadState({ status: 'uploading', progress: p }),
      });

      const lt = licenseTerms.trim();
      if (!lt) {
        setUploadState({ status: 'error', message: 'Añade términos de licencia antes de registrar el asset.' });
        return;
      }

      await createAsset.mutateAsync({
        offeringId,
        data: {
          fileKey: uploadUrlRes.fileKey,
          fileName: file.name,
          sizeBytes: file.size,
          licenseTerms: lt,
        },
      });

      setUploadState({ status: 'success' });
      window.setTimeout(() => setUploadState({ status: 'idle' }), 1_200);
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setUploadState({
        status: 'error',
        message: apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo subir el archivo.'),
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const offeringIdForUpload = params.mode === 'edit' ? initial?.id : null;

  return (
    <Dialog open={open} onOpenChange={(v) => (saving ? undefined : setOpen(v))}>
      <DialogTrigger asChild>
        {params.mode === 'create' ? (
          <Button variant="primary">Nueva oferta</Button>
        ) : (
          <Button variant="ghost" size="sm">
            Editar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="p-0">
        <div className="p-6">
          <DialogTitle>{params.mode === 'create' ? 'Crear oferta' : 'Editar oferta'}</DialogTitle>
          <DialogDescription className="mt-2">
            Define la propuesta, el precio y los detalles que verá el comprador.
          </DialogDescription>

          {error ? (
            <div className="mt-4 rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo">
                <Select value={type} onChange={(e) => setType(e.target.value as OfferingType)} disabled={params.mode === 'edit'}>
                  {OFFERING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {offeringTypeLabel(t)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Categoría" hint="Ej. web, mobile, odoo">
                <Input value={category} onChange={(e) => setCategory(e.target.value)} />
              </Field>
            </div>

            <Field label="Título">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>

            <Field label="Descripción">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label={type === 'custom_service' ? 'Precio desde (opcional)' : 'Precio'} hint="EUR">
                <Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              </Field>

              {type === 'fixed_package' ? (
                <Field label="Días de entrega" hint="Ej. 7">
                  <Input type="number" inputMode="numeric" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} />
                </Field>
              ) : (
                <div className="rounded-[14px] border border-line/10 bg-bg-2/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-fg">Publicación</div>
                      <div className="mt-1 text-xs text-fg-muted">Envía a revisión cuando esté lista.</div>
                    </div>
                    <Toggle checked={false} onCheckedChange={() => undefined} disabled />
                  </div>
                </div>
              )}
            </div>

            {type === 'fixed_package' ? (
              <Field label="Deliverables" hint="Una línea por deliverable">
                <Textarea value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={4} />
              </Field>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Portada (URL)" hint="Opcional">
                <Input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Galería (URLs)" hint="Una por línea, opcional">
                <Textarea value={gallery} onChange={(e) => setGallery(e.target.value)} rows={3} placeholder="https://..." />
              </Field>
            </div>

            {type === 'digital_product' ? (
              <Card className="border-line/10 bg-bg-2/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-fg">Archivo del producto</div>
                      <div className="mt-1 text-xs text-fg-muted">
                        Sube el archivo después de crear la oferta o al editarla.
                      </div>
                    </div>
                    <Badge variant="neutral">digital</Badge>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <Field label="Términos de licencia">
                      <Textarea value={licenseTerms} onChange={(e) => setLicenseTerms(e.target.value)} rows={3} />
                    </Field>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (!offeringIdForUpload) {
                          setUploadState({ status: 'error', message: 'Guarda la oferta antes de subir el archivo.' });
                          return;
                        }
                        void onUploadDigitalAsset(f, offeringIdForUpload);
                      }}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="secondary" onClick={onPickFile} disabled={!offeringIdForUpload || uploadState.status === 'uploading'}>
                        Subir archivo
                      </Button>
                      {uploadState.status === 'uploading' ? (
                        <div className="text-sm text-fg-muted">{`Subiendo: ${uploadState.progress}%`}</div>
                      ) : uploadState.status === 'success' ? (
                        <div className="text-sm text-emerald-200">Archivo subido y registrado.</div>
                      ) : uploadState.status === 'error' ? (
                        <div className="text-sm text-danger-fg">{uploadState.message}</div>
                      ) : (
                        <div className="text-sm text-fg-dim">Requiere una oferta guardada.</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line/10 bg-bg-2/30 p-4 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="ghost" disabled={saving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button variant="primary" onClick={() => void onSave()} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SellerPanelPage() {
  const [session, setSession] = React.useState<SessionState>({ status: 'loading' });

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const api = getKodiraApiClient();
        const me = await api.users.getMe();
        if (cancelled) return;
        setSession({ status: 'success', isSeller: me.roles.includes('seller') });
      } catch (err) {
        if (cancelled) return;
        const status = getApiStatus(err);
        const apiError = getApiErrorResponse(err);
        const msg =
          status === 401 ? 'Inicia sesión para acceder al panel.' : apiError?.message ?? 'No se pudo cargar la sesión.';
        setSession({ status: 'error', message: msg });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const sellerProfileQuery = useMySellerProfileQuery({ enabled: session.status === 'success' });
  const applySeller = useApplySellerMutation();

  const [tab, setTab] = React.useState('offerings');
  const [applyDisplayName, setApplyDisplayName] = React.useState('');
  const [applyBio, setApplyBio] = React.useState('');
  const [applyCategories, setApplyCategories] = React.useState('');
  const [applyError, setApplyError] = React.useState<string | null>(null);

  const myOfferingsQuery = useMySellerOfferingsQuery(
    { page: 1, limit: 20 },
    { enabled: session.status === 'success' && session.isSeller },
  );
  const submitOffering = useSubmitSellerOfferingMutation();
  const pauseOffering = usePauseSellerOfferingMutation();
  const unpauseOffering = useUnpauseSellerOfferingMutation();

  const seller = sellerProfileQuery.data ?? null;

  const onApply = async () => {
    setApplyError(null);
    const dn = applyDisplayName.trim();
    const cats = splitCsv(applyCategories);
    if (dn.length < 2) {
      setApplyError('El display name debe tener al menos 2 caracteres.');
      return;
    }
    if (cats.length === 0) {
      setApplyError('Añade al menos una categoría.');
      return;
    }
    try {
      await applySeller.mutateAsync({
        displayName: dn,
        bio: applyBio.trim() ? applyBio.trim() : null,
        categories: cats,
      });
      setApplyDisplayName('');
      setApplyBio('');
      setApplyCategories('');
    } catch (err) {
      const apiError = getApiErrorResponse(err);
      setApplyError(apiError?.message ?? (err instanceof Error ? err.message : 'No se pudo enviar la solicitud.'));
    }
  };

  const sellerErrorMessage = React.useMemo(() => {
    if (!sellerProfileQuery.isError) return null;
    const status = getApiStatus(sellerProfileQuery.error);
    const apiError = getApiErrorResponse(sellerProfileQuery.error);
    if (status === 401) return 'Necesitas iniciar sesión para ver tu perfil de vendedor.';
    return apiError?.message ?? 'No se pudo cargar tu perfil de vendedor.';
  }, [sellerProfileQuery.error, sellerProfileQuery.isError]);

  const offeringsError = React.useMemo(() => {
    if (!myOfferingsQuery.isError) return null;
    const status = getApiStatus(myOfferingsQuery.error);
    const apiError = getApiErrorResponse(myOfferingsQuery.error);
    if (status === 403) return 'Tu cuenta aún no tiene acceso de vendedor.';
    return apiError?.message ?? 'No se pudieron cargar tus ofertas.';
  }, [myOfferingsQuery.error, myOfferingsQuery.isError]);

  if (session.status === 'loading') {
    return (
      <div className="space-y-6 pb-24">
        <Skeleton className="h-10 w-[45%]" />
        <Skeleton className="h-5 w-[60%]" />
        <Skeleton className="h-[160px] w-full rounded-[16px]" />
      </div>
    );
  }

  if (session.status === 'error') {
    return (
      <ErrorState
        title="No se pudo abrir el panel"
        description={session.message}
        action={
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <div className="font-display text-[24px] font-black tracking-[-0.03em] text-fg">Panel de vendedor</div>
        <div className="mt-1 text-sm text-fg-muted">
          Crea ofertas, sube tus assets y envíalas a revisión.
        </div>
      </div>

      {sellerProfileQuery.isLoading ? (
        <Skeleton className="h-[168px] w-full rounded-[16px]" />
      ) : sellerErrorMessage ? (
        <ErrorState
          title="No se pudo cargar tu perfil"
          description={sellerErrorMessage}
          action={
            <Button variant="secondary" onClick={() => sellerProfileQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : seller ? (
        <SellerStatusCard seller={seller} />
      ) : (
        <Card className="border-line/10 bg-bg-2/40">
          <CardHeader>
            <CardTitle>Hazte vendedor</CardTitle>
            <CardDescription>
              Completa tu perfil para poder crear ofertas y aparecer en el marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {applyError ? (
              <div className="rounded-[12px] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger-fg">
                {applyError}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Display name">
                <Input value={applyDisplayName} onChange={(e) => setApplyDisplayName(e.target.value)} />
              </Field>
              <Field label="Categorías" hint="Separadas por coma">
                <Input value={applyCategories} onChange={(e) => setApplyCategories(e.target.value)} placeholder="web, mobile, odoo" />
              </Field>
            </div>
            <Field label="Bio" hint="Opcional">
              <Textarea value={applyBio} onChange={(e) => setApplyBio(e.target.value)} rows={4} />
            </Field>
            <Button variant="primary" onClick={() => void onApply()} disabled={applySeller.isPending}>
              {applySeller.isPending ? 'Enviando…' : 'Enviar solicitud'}
            </Button>
          </CardContent>
        </Card>
      )}

      {seller && seller.status !== 'approved' ? (
        <EmptyState
          title={seller.status === 'pending' ? 'Estamos revisando tu solicitud' : 'Acceso no disponible'}
          description="Puedes explorar el marketplace mientras se resuelve el estado de tu perfil."
          action={
            <Button asChild variant="secondary">
              <a href="/marketplace">Ir al marketplace</a>
            </Button>
          }
        />
      ) : null}

      {seller && seller.status === 'approved' ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-line/10 bg-surface">
              <CardContent className="p-5">
                <div className="text-sm font-semibold text-fg">Rating</div>
                <div className="mt-2 font-display text-[26px] font-black tracking-[-0.03em] text-fg">
                  ★ {seller.ratingAvg.toFixed(1)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-line/10 bg-surface">
              <CardContent className="p-5">
                <div className="text-sm font-semibold text-fg">Ventas</div>
                <div className="mt-2 font-display text-[26px] font-black tracking-[-0.03em] text-fg">
                  {seller.salesCount}
                </div>
              </CardContent>
            </Card>
            <Card className="border-line/10 bg-surface">
              <CardContent className="p-5">
                <div className="text-sm font-semibold text-fg">Categorías</div>
                <div className="mt-2 text-sm text-fg-muted">{seller.categories.join(', ')}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              items={[
                { value: 'offerings', label: 'Mis ofertas' },
                { value: 'orders', label: 'Pedidos' },
                { value: 'requests', label: 'Solicitudes' },
                { value: 'payouts', label: 'Cobros' },
                { value: 'profile', label: 'Perfil' },
              ]}
              value={tab}
              onValueChange={setTab}
              className="w-full md:w-auto"
            />
            {tab === 'offerings' ? <OfferingFormDialog mode="create" /> : null}
          </div>

          {tab === 'profile' ? (
            <Card className="border-line/10 bg-bg-2/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-line/10 bg-[linear-gradient(120deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))]">
                    {seller.avatarUrl ? (
                      <Image src={seller.avatarUrl} alt="" width={48} height={48} className="h-12 w-12 object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-fg">{seller.displayName}</div>
                    <div className="mt-1 text-sm text-fg-muted">{seller.bio ?? 'Sin bio todavía.'}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {seller.categories.map((c) => (
                        <Badge key={c} variant="neutral">
                          {c}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 text-sm text-fg-dim">
                      La edición del perfil se habilitará cuando exista el endpoint de update del SellerProfile.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {tab === 'offerings' ? (
            myOfferingsQuery.isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-[96px] w-full rounded-[16px]" />
                ))}
              </div>
            ) : offeringsError ? (
              <ErrorState
                title="No se pudieron cargar tus ofertas"
                description={offeringsError}
                action={
                  <Button variant="secondary" onClick={() => myOfferingsQuery.refetch()}>
                    Reintentar
                  </Button>
                }
              />
            ) : (myOfferingsQuery.data?.items?.length ?? 0) === 0 ? (
              <EmptyState
                title="Aún no tienes ofertas"
                description="Crea tu primera oferta para aparecer en el catálogo."
                action={<OfferingFormDialog mode="create" />}
              />
            ) : (
              <div className="grid gap-3">
                {(myOfferingsQuery.data?.items ?? []).map((o) => {
                  const canSubmit = o.status === 'draft' || o.status === 'rejected';
                  const canPause = o.status === 'published';
                  const canUnpause = o.status === 'paused';
                  const submitting = submitOffering.isPending;
                  const pausing = pauseOffering.isPending;
                  const unpausing = unpauseOffering.isPending;

                  return (
                    <Card key={o.id} className="border-line/10 bg-surface">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-[12px] border border-line/10 bg-bg-2/50">
                              {o.coverImageUrl ? (
                                <Image src={o.coverImageUrl} alt="" width={48} height={48} className="h-12 w-12 object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-fg">{o.title}</div>
                                <Badge variant="neutral">{offeringTypeLabel(o.type)}</Badge>
                                <Badge variant={statusBadgeVariant(o.status)}>{statusLabel(o.status)}</Badge>
                              </div>
                              <div className="mt-1 text-sm text-fg-muted">
                                <span className="font-semibold text-fg">{priceLabel(o)}</span>
                                <span className="px-2 text-line/60">/</span>
                                <span className="text-fg-dim">{o.category}</span>
                              </div>
                              {o.status === 'rejected' && o.rejectionReason ? (
                                <div className="mt-2 text-xs text-danger-fg">
                                  {`Motivo: ${o.rejectionReason}`}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <OfferingFormDialog mode="edit" initial={o} />

                            {canSubmit ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={submitting}
                                onClick={() => void submitOffering.mutateAsync({ offeringId: o.id })}
                              >
                                {submitting ? 'Enviando…' : 'Enviar a revisión'}
                              </Button>
                            ) : null}

                            {canPause ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={pausing}
                                onClick={() => void pauseOffering.mutateAsync({ offeringId: o.id })}
                              >
                                {pausing ? 'Pausando…' : 'Pausar'}
                              </Button>
                            ) : null}

                            {canUnpause ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={unpausing}
                                onClick={() => void unpauseOffering.mutateAsync({ offeringId: o.id })}
                              >
                                {unpausing ? 'Reanudando…' : 'Reanudar'}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          ) : null}

          {tab === 'orders' || tab === 'requests' || tab === 'payouts' ? (
            <Card className="border-line/10 bg-bg-2/30">
              <CardContent className="p-5">
                <div className="text-sm font-semibold text-fg">Próximamente</div>
                <div className="mt-1 text-sm text-fg-muted">
                  Esta pestaña se conectará cuando esté listo el Prompt 3 (pagos y pedidos).
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
