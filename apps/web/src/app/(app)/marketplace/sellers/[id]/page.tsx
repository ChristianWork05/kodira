'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePublicSellerByIdQuery } from '@kodira/hooks';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ErrorState, Reveal, RevealItem, Skeleton } from '@kodira/ui';
import { getApiErrorResponse, getApiStatus } from '../../../../../lib/apiError';

export default function MarketplaceSellerPage() {
  const params = useParams<{ id: string }>();
  const sellerId = params.id ?? '';

  const sellerQuery = usePublicSellerByIdQuery(sellerId);

  const errorMessage = React.useMemo(() => {
    if (!sellerQuery.isError) return null;
    const status = getApiStatus(sellerQuery.error);
    const apiError = getApiErrorResponse(sellerQuery.error);
    if (status === 404) return 'Este vendedor no existe o no está aprobado.';
    return apiError?.message ?? 'No se pudo cargar el vendedor. Intenta de nuevo.';
  }, [sellerQuery.error, sellerQuery.isError]);

  return (
    <div className="space-y-6 pb-24">
      {sellerQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-[40%]" />
          <Skeleton className="h-5 w-[55%]" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[220px] rounded-[16px]" />
            ))}
          </div>
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="No se pudo cargar el vendedor"
          description={errorMessage}
          action={
            <Button variant="secondary" onClick={() => sellerQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : sellerQuery.data ? (
        <Reveal>
          <RevealItem>
            <Card className="border-line/10 bg-bg-2/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="h-11 w-11 overflow-hidden rounded-full border border-line/10 bg-[linear-gradient(120deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))]">
                    {sellerQuery.data.seller.avatarUrl ? (
                      <Image src={sellerQuery.data.seller.avatarUrl} alt="" width={44} height={44} className="h-11 w-11 object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 truncate">{sellerQuery.data.seller.displayName}</span>
                </CardTitle>
                <CardDescription>
                  ★ {sellerQuery.data.seller.ratingAvg.toFixed(1)} · {sellerQuery.data.seller.salesCount} ventas
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-fg-muted">
                  {sellerQuery.data.seller.bio ? sellerQuery.data.seller.bio : 'Sin bio todavía.'}
                </div>
                <Button asChild variant="ghost">
                  <Link href="/marketplace">Volver al marketplace</Link>
                </Button>
              </CardContent>
            </Card>
          </RevealItem>
        </Reveal>
      ) : null}

      {sellerQuery.data ? (
        <>
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="font-display text-[18px] font-black tracking-[-0.02em] text-fg">Ofertas</div>
              <div className="mt-1 text-sm text-fg-muted">Publicadas por este vendedor.</div>
            </div>
            <div className="text-sm text-fg-muted">{sellerQuery.data.offerings.length} ofertas</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sellerQuery.data.offerings.map((o) => (
              <Card key={o.id} className="border-line/10 bg-surface">
                <CardContent className="p-5">
                  <div className="text-sm font-semibold text-fg">{o.title}</div>
                  <div className="mt-1 text-sm text-fg-muted">{o.description}</div>
                  <div className="mt-4">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/marketplace/${o.slug}`}>Ver oferta</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

