export function coursesKey(parts: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  level?: string;
  q?: string;
  isFree?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}) {
  return [
    'education',
    'courses',
    parts.page ?? 1,
    parts.limit ?? 20,
    parts.categorySlug ?? '',
    parts.level ?? '',
    parts.q ?? '',
    parts.isFree ?? null,
    parts.minPrice ?? null,
    parts.maxPrice ?? null,
    parts.sort ?? '',
  ] as const;
}

export function courseBySlugKey(slug: string) {
  return ['education', 'course', slug] as const;
}

export function courseCategoriesKey() {
  return ['education', 'categories'] as const;
}

export function myCoursesKey(parts: { page?: number; limit?: number }) {
  return ['education', 'myCourses', parts.page ?? 1, parts.limit ?? 20] as const;
}
