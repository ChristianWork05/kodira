'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ListPublicOfferingsQuery, OfferingType, PublicOfferingCard } from '@kodira/types';
import { OFFERING_TYPES } from '@kodira/types';
import { usePublicOfferingsQuery } from '@kodira/hooks';
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
  Select,
  Skeleton,
  cn,
} from '@kodira/ui';
import { getApiErrorResponse, getApiStatus } from '../../../lib/apiError';

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

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

function PriceLabel({ item }: { item: PublicOfferingCard }) {
  if (item.type === 'custom_service') {
    if (typeof item.price === 'number' && item.price > 0) return <>{`Desde ${formatMoneyEUR(item.price)}`}</>;
    return (
      <>
        Presupuesto
        <span className="mt-1 block text-[11px] font-medium text-fg-dim">según proyecto</span>
      </>
    );
  }

  if (typeof item.price === 'number') return <>{formatMoneyEUR(item.price)}</>;
  return <span className="text-fg-dim">Sin precio</span>;
}

function FilterChip(params: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={params.onClick}
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-[10px] border px-3.5 py-2 text-[13px] font-semibold',
        'transition-[transform,background-color,border-color,color] duration-200 ease-brand active:translate-y-px motion-reduce:transition-none',
        params.active
          ? 'border-line-strong/18 bg-[linear-gradient(120deg,rgba(59,130,246,0.16),rgba(99,102,241,0.16))] text-fg'
          : 'border-line/10 bg-surface text-fg-muted hover:bg-white/5 hover:text-fg',
      )}
    >
      {params.children}
    </button>
  );
}

function OfferingCard({ item }: { item: PublicOfferingCard }) {
  const cover = item.coverImageUrl;

  return (
    <Card className="group overflow-hidden border-line/10 bg-surface transition-[transform,box-shadow,border-color] duration-300 ease-brand hover:-translate-y-1 hover:border-line-strong/18 hover:shadow-[0_24px_52px_-28px_rgba(0,0,0,0.75)] motion-reduce:transform-none">
      <div className="relative h-[132px]">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#3B82F6,#6366F1)] opacity-90" />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_40%_0%,rgba(255,255,255,0.18),transparent_60%)] opacity-60" />

        <span className={cn('absolute left-3 top-3 inline-flex items-center rounded-[10px] border px-2.5 py-1 text-[12px] font-semibold backdrop-blur', typeBadgeClass(item.type))}>
          {offeringTypeLabel(item.type)}
        </span>
      </div>

      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="min-w-0">
          <div className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-fg">{item.title}</div>
          <div className="mt-2 flex items-center gap-2 text-[12.5px] text-fg-muted">
            <div className="h-6 w-6 overflow-hidden rounded-full border border-line/10 bg-[linear-gradient(120deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))]">
              {item.seller.avatarUrl ? (
                <Image src={item.seller.avatarUrl} alt="" width={24} height={24} className="h-6 w-6 object-cover" />
              ) : null}
            </div>
            <span className="truncate">{item.seller.displayName}</span>
            <span className="text-fg-dim">★ {item.seller.ratingAvg.toFixed(1)}</span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/10 pt-3">
          <div className="min-w-0">
            <div className="font-display text-[16px] font-black tracking-[-0.02em] text-fg">
              <PriceLabel item={item} />
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href={`/marketplace/${item.slug}`}>Ver</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OfferingCardSkeleton() {
  return (
    <Card className="overflow-hidden border-line/10 bg-surface">
      <div className="relative h-[132px]">
        <Skeleton className="h-full w-full" />
        <div className="absolute left-3 top-3">
          <Skeleton className="h-7 w-32 rounded-[10px]" />
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-4 w-12" />
          </div>
          <div className="flex items-end justify-between border-t border-line/10 pt-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-14 rounded-[12px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketplaceCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const type = (searchParams.get('type') as OfferingType | null) ?? null;
  const category = searchParams.get('category') ?? '';
  const sort = (searchParams.get('sort') as ListPublicOfferingsQuery['sort'] | null) ?? 'relevance';
  const minPrice = parseNumber(searchParams.get('minPrice'));
  const maxPrice = parseNumber(searchParams.get('maxPrice'));
  const page = Math.max(1, parseNumber(searchParams.get('page')) ?? 1);

  const [draftQ, setDraftQ] = React.useState(q);
  const [draftCategory, setDraftCategory] = React.useState(category);
  const [draftMinPrice, setDraftMinPrice] = React.useState(typeof minPrice === 'number' ? String(minPrice) : '');
  const [draftMaxPrice, setDraftMaxPrice] = React.useState(typeof maxPrice === 'number' ? String(maxPrice) : '');

  React.useEffect(() => {
    setDraftQ(q);
  }, [q]);

  React.useEffect(() => {
    setDraftCategory(category);
  }, [category]);

  React.useEffect(() => {
    setDraftMinPrice(typeof minPrice === 'number' ? String(minPrice) : '');
  }, [minPrice]);

  React.useEffect(() => {
    setDraftMaxPrice(typeof maxPrice === 'number' ? String(maxPrice) : '');
  }, [maxPrice]);

  const query: ListPublicOfferingsQuery = React.useMemo(
    () => ({
      q: q.trim() ? q.trim() : undefined,
      type: type && OFFERING_TYPES.includes(type) ? type : undefined,
      category: category.trim() ? category.trim() : undefined,
      minPrice,
      maxPrice,
      sort,
      page,
      limit: 24,
    }),
    [category, maxPrice, minPrice, page, q, sort, type],
  );

  const offeringsQuery = usePublicOfferingsQuery(query);
  const items = offeringsQuery.data?.items ?? [];
  const totalPages = offeringsQuery.data?.totalPages ?? 1;

  const setParams = (next: Record<string, string | null | undefined>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    }
    if (!sp.get('sort')) sp.set('sort', 'relevance');
    router.push(`/marketplace?${sp.toString()}`);
  };

  const applyDraftFilters = () => {
    setParams({
      category: draftCategory.trim() || null,
      minPrice: draftMinPrice.trim() || null,
      maxPrice: draftMaxPrice.trim() || null,
      page: '1',
    });
  };

  const errorMessage = React.useMemo(() => {
    if (!offeringsQuery.isError) return null;
    const status = getApiStatus(offeringsQuery.error);
    const apiError = getApiErrorResponse(offeringsQuery.error);
    if (status === 401) return 'Necesitas iniciar sesión para ver el marketplace.';
    return apiError?.message ?? 'No se pudieron cargar las ofertas. Intenta de nuevo.';
  }, [offeringsQuery.error, offeringsQuery.isError]);

  return (
    <div className="space-y-6 pb-24">
      <Reveal>
        <RevealItem>
          <Card className="border-line/10 bg-bg-2/40">
            <CardHeader className="space-y-2">
              <CardTitle className="text-[22px]">Marketplace</CardTitle>
              <CardDescription>
                Servicios y productos de desarrollo, de KODIRA y de vendedores externos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-dim"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4-4" />
                  </svg>
                  <Input
                    value={draftQ}
                    onChange={(e) => setDraftQ(e.target.value)}
                    placeholder="Buscar servicios, productos…"
                    className="h-11 rounded-[12px] border-line/10 bg-surface pl-9 pr-3"
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      setParams({ q: draftQ.trim() || null, page: '1' });
                    }}
                    aria-label="Buscar ofertas"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <div className="text-sm text-fg-muted">
                    {offeringsQuery.isLoading ? 'Cargando…' : `${offeringsQuery.data?.total ?? 0} resultados`}
                  </div>
                  <div className="flex items-center gap-2 rounded-[10px] border border-line/10 bg-surface px-3 py-2 text-[13px] text-fg-muted">
                    <span>Ordenar</span>
                    <Select
                      value={sort ?? 'relevance'}
                      onChange={(e) => setParams({ sort: e.target.value, page: '1' })}
                      className="h-auto border-0 bg-transparent px-0 py-0 text-[13px] text-fg focus-visible:ring-0"
                      aria-label="Ordenar"
                    >
                      <option value="relevance">Relevancia</option>
                      <option value="popular">Popular</option>
                      <option value="new">Nuevas</option>
                      <option value="rating">Mejor valoradas</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap">
                  <FilterChip active={!type} onClick={() => setParams({ type: null, page: '1' })}>
                    Todo
                  </FilterChip>
                  <FilterChip active={type === 'digital_product'} onClick={() => setParams({ type: 'digital_product', page: '1' })}>
                    Productos digitales
                  </FilterChip>
                  <FilterChip active={type === 'fixed_package'} onClick={() => setParams({ type: 'fixed_package', page: '1' })}>
                    Paquetes
                  </FilterChip>
                  <FilterChip active={type === 'custom_service'} onClick={() => setParams({ type: 'custom_service', page: '1' })}>
                    Servicios a medida
                  </FilterChip>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <Input
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      applyDraftFilters();
                    }}
                    onBlur={() => applyDraftFilters()}
                    placeholder="Categoría (ej. web)"
                    className="h-11 rounded-[12px] border-line/10 bg-surface"
                    aria-label="Categoría"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draftMinPrice}
                    onChange={(e) => setDraftMinPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      applyDraftFilters();
                    }}
                    onBlur={() => applyDraftFilters()}
                    placeholder="Precio mín."
                    className="h-11 rounded-[12px] border-line/10 bg-surface"
                    aria-label="Precio mínimo"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draftMaxPrice}
                    onChange={(e) => setDraftMaxPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      applyDraftFilters();
                    }}
                    onBlur={() => applyDraftFilters()}
                    placeholder="Precio máx."
                    className="h-11 rounded-[12px] border-line/10 bg-surface"
                    aria-label="Precio máximo"
                  />
                  <Button
                    variant="ghost"
                    className="h-11 rounded-[12px]"
                    onClick={() => router.push('/marketplace')}
                    disabled={!q && !type && !category && minPrice == null && maxPrice == null && (sort ?? 'relevance') === 'relevance'}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </RevealItem>
      </Reveal>

      {offeringsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, idx) => (
            <OfferingCardSkeleton key={idx} />
          ))}
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="No se pudo cargar el marketplace"
          description={errorMessage}
          action={
            <Button variant="secondary" onClick={() => offeringsQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Prueba cambiando los filtros o buscando por otra palabra."
          action={
            <Button variant="secondary" onClick={() => router.push('/marketplace')}>
              Ver todo
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <OfferingCard key={item.id} item={item} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-fg-muted">
              Página {page} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setParams({ page: String(Math.max(1, page - 1)) })}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                onClick={() => setParams({ page: String(Math.min(totalPages, page + 1)) })}
                disabled={page >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
