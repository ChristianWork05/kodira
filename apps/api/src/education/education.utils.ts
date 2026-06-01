import * as crypto from 'node:crypto';

export function slugifyTitle(value: string) {
  const base = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (base.length > 0) return base.slice(0, 80);
  return crypto.randomUUID().slice(0, 8);
}

