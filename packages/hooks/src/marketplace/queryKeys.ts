export function publicOfferingsKey(parts: {
  q?: string;
  type?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  return [
    'marketplace',
    'publicOfferings',
    parts.q ?? '',
    parts.type ?? '',
    parts.category ?? '',
    parts.minPrice ?? null,
    parts.maxPrice ?? null,
    parts.sort ?? '',
    parts.page ?? 1,
    parts.limit ?? 24,
  ] as const;
}

export function publicOfferingBySlugKey(slug: string) {
  return ['marketplace', 'publicOffering', slug] as const;
}

export function publicSellerByIdKey(id: string) {
  return ['marketplace', 'publicSeller', id] as const;
}

export function mySellerProfileKey() {
  return ['marketplace', 'mySellerProfile'] as const;
}

export function mySellerOfferingsKey(parts: { page?: number; limit?: number }) {
  return ['marketplace', 'mySellerOfferings', parts.page ?? 1, parts.limit ?? 20] as const;
}
