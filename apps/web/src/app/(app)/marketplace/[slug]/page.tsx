'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { OfferingType } from '@kodira/types';
import { usePublicOfferingBySlugQuery, usePublicSellerByIdQuery } from '@kodira/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  Reveal,
  RevealItem,
  Separator,
  Skeleton,
  cn,
} from '@kodira/ui';
import { CheckIcon } from '@radix-ui/react-icons';
import { getApiErrorResponse, getApiStatus } from '../../../../lib/apiError';

function formatMoneyEUR(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function offeringTypeLabel(type: OfferingType) {
  if (type === 'digital_product') return 'Producto digital';
  if (type === 'fixed_package') return 'Paquete';
  return 'Servicio a medida';
}

function typeBadgeClass(type: OfferingType) {
  if (type === 'digital_product') return 'border-primary/25 bg-primary/10 text-primary';
  if (type === 'fixed_package') return 'border-violet-400/25 bg-violet-400/10 text-violet-200';
  return 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200';
}

function PriceBlock(params: { type: OfferingType; price: number | null | undefined; deliveryDays?: number | null }) {
  if (params.type === 'custom_service') {
    if (typeof params.price === 'number' && params.price > 0) {
      return (
        <div className="font-display text-[30px] font-black tracking-[-0.03em] text-fg">
          {formatMoneyEUR(params.price)}
          <div className="mt-1 text-[13px] font-semibold text-fg-dim">desde</div>
        </div>
      );
    }
    return (
      <div className="font-display text-[30px] font-black tracking-[-0.03em] text-fg">
        Presupuesto
        <div className="mt-1 text-[13px] font-semibold text-fg-dim">según alcance</div>
      </div>
    );
  }

  if (typeof params.price === 'number') {
    return (
      <div className="font-display text-[30px] font-black tracking-[-0.03em] text-fg">
        {formatMoneyEUR(params.price)}
        {params.type === 'fixed_package' && params.deliveryDays ? (
          <div className="mt-1 text-[13px] font-semibold text-fg-dim">{`precio fijo - entrega en ${params.deliveryDays} días`}</div>
        ) : (
          <div className="mt-1 text-[13px] font-semibold text-fg-dim">precio fijo</div>
        )}
      </div>
    );
  }

  return <div className="text-fg-dim">Sin precio</div>;
}

export default function MarketplaceOfferingDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';

  const offeringQuery = usePublicOfferingBySlugQuery(slug);
  const offering = offeringQuery.data?.offering ?? null;

  const sellerQuery = usePublicSellerByIdQuery(offering?.seller.id ?? '');
  const seller = sellerQuery.data?.seller ?? offering?.seller ?? null;

  const errorMessage = React.useMemo(() => {
    if (!offeringQuery.isError) return null;
    const status = getApiStatus(offeringQuery.error);
    const apiError = getApiErrorResponse(offeringQuery.error);
    if (status === 404) return 'Esta oferta no existe o ya no está publicada.';
    if (status === 401) return 'Necesitas iniciar sesión para ver esta oferta.';
    return apiError?.message ?? 'No se pudo cargar la oferta. Intenta de nuevo.';
  }, [offeringQuery.error, offeringQuery.isError]);

  return (
    <div className="space-y-6 pb-24">
      {offeringQuery.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-4">
            <Skeleton className="h-[260px] w-full rounded-[16px]" />
            <Skeleton className="h-9 w-[70%]" />
            <Skeleton className="h-5 w-[45%]" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-[360px] w-full rounded-[16px]" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="No se pudo cargar la oferta"
          description={errorMessage}
          action={
            <Button variant="secondary" onClick={() => offeringQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : !offering ? (
        <EmptyState title="Oferta no disponible" description="Vuelve al catálogo para seguir explorando." action={
          <Button asChild variant="secondary">
            <Link href="/marketplace">Ir al marketplace</Link>
          </Button>
        } />
      ) : (
        <Reveal>
          <RevealItem>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div className="min-w-0">
                <div className="text-sm text-fg-dim">
                  <Link href="/marketplace" className="text-fg-muted hover:text-fg">
                    Marketplace
                  </Link>
                  <span className="px-2 text-line/60">/</span>
                  <span className="text-fg-muted">{offeringTypeLabel(offering.type)}</span>
                </div>

                <div className="mt-4">
                  <div className="relative h-[240px] overflow-hidden rounded-[16px] border border-line/10 bg-surface">
                    {offering.coverImageUrl ? (
                      <Image
                        src={offering.coverImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 65vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[linear-gradient(120deg,#6366F1,#7C3AED)] opacity-90" />
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_40%_0%,rgba(255,255,255,0.18),transparent_60%)] opacity-60" />
                    <span
                      className={cn(
                        'absolute left-4 top-4 inline-flex items-center rounded-[10px] border px-2.5 py-1 text-[12px] font-semibold backdrop-blur',
                        typeBadgeClass(offering.type),
                      )}
                    >
                      {offeringTypeLabel(offering.type)}
                    </span>
                  </div>
                </div>

                <h1 className="mt-5 font-display text-[28px] font-black tracking-[-0.03em] text-fg">{offering.title}</h1>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-line/10 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-line/10 bg-[linear-gradient(120deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))]">
                      {seller?.avatarUrl ? (
                        <Image src={seller.avatarUrl} alt="" width={40} height={40} className="h-10 w-10 object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-fg">{seller?.displayName ?? offering.seller.displayName}</div>
                      <div className="text-xs text-fg-dim">
                        ★ {offering.seller.ratingAvg.toFixed(1)} · {offering.seller.salesCount} ventas
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="ml-auto">
                    <Link href={`/marketplace/sellers/${offering.seller.id}`}>Ver perfil</Link>
                  </Button>
                </div>

                <div className="mt-5 space-y-6">
                  <div>
                    <div className="text-[14px] font-semibold text-fg">Descripción</div>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted">{offering.description}</p>
                  </div>

                  {offering.gallery.length > 0 ? (
                    <div>
                      <div className="text-[14px] font-semibold text-fg">Galería</div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {offering.gallery.slice(0, 4).map((src, idx) => (
                          <div
                            key={`${src}-${idx}`}
                            className="relative aspect-[16/10] overflow-hidden rounded-[14px] border border-line/10 bg-surface"
                          >
                            <Image
                              src={src}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 60vw"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="text-[14px] font-semibold text-fg">Qué incluye</div>
                    {offering.deliverables.length === 0 ? (
                      <div className="mt-2 text-sm text-fg-dim">El vendedor aún no añadió deliverables.</div>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {offering.deliverables.map((d, idx) => (
                          <li key={`${d}-${idx}`} className="flex items-start gap-3 text-[14px] text-fg">
                            <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-400/10 text-emerald-200">
                              <CheckIcon className="h-4 w-4" />
                            </span>
                            <span className="text-fg-muted">{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <div className="text-[14px] font-semibold text-fg">Reseñas</div>
                    <Card className="mt-3 border-line/10 bg-bg-2/30">
                      <CardContent className="p-5">
                        <div className="text-sm font-semibold text-fg">Próximamente</div>
                        <div className="mt-1 text-sm text-fg-muted">
                          Las reseñas se conectarán cuando exista el endpoint público de reviews para ofertas.
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <aside className="lg:sticky lg:top-20">
                <Card className="border-line-strong/14 bg-surface">
                  <CardContent className="p-5">
                    <PriceBlock type={offering.type} price={offering.price} deliveryDays={offering.deliveryDays} />

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="primary"
                          className="mt-5 w-full"
                        >
                          {offering.type === 'custom_service' ? 'Solicitar presupuesto' : 'Comprar ahora'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="p-0">
                        <div className="p-6">
                          <DialogTitle>Pagos próximamente</DialogTitle>
                          <DialogDescription className="mt-2">
                            Esta acción se conectará cuando esté listo el Prompt 3 (pagos). Por ahora no se simula ninguna compra.
                          </DialogDescription>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-line/10 bg-bg-2/30 p-4">
                          <DialogClose asChild>
                            <Button variant="secondary">Entendido</Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="mt-3 text-center text-xs text-fg-dim">
                      Pago seguro y liberación al confirmar la entrega, disponible en Prompt 3.
                    </div>

                    <Separator className="my-5" />

                    <div className="space-y-3 text-sm text-fg-muted">
                      {offering.type === 'fixed_package' && offering.deliveryDays ? (
                        <div className="flex items-center justify-between gap-3">
                          <span>Entrega estimada</span>
                          <span className="font-semibold text-fg">{`${offering.deliveryDays} días`}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between gap-3">
                        <span>Tipo</span>
                        <Badge variant="neutral">{offeringTypeLabel(offering.type)}</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Categoría</span>
                        <span className="font-semibold text-fg">{offering.category}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </RevealItem>
        </Reveal>
      )}
    </div>
  );
}
