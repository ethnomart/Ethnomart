import { PilotError } from './domain.ts';
import type { PublicProduct } from './store.ts';

export function normalizeSearch(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-GB')
    .replace(/\s+/gu, ' ')
    .trim();
}
export function queryText(value: unknown, max = 100): string {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > max)
    throw new PilotError(400, `Use a search of up to ${max} characters.`);
  return value.trim();
}
export function positiveId(value: unknown) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,9}$/.test(value))
    throw new PilotError(400, 'A valid positive ID is required.');
  return Number(value);
}
function pageNumber(value: unknown, fallback: number, maximum: number) {
  if (value === undefined) return fallback;
  const number = positiveId(value);
  if (number > maximum)
    throw new PilotError(400, 'The page value is too large.');
  return number;
}
export function productPage(
  products: PublicProduct[],
  query: Record<string, unknown>,
) {
  const q = queryText(query.q ?? query.search);
  const category = queryText(query.category, 60);
  const requestedPage = pageNumber(query.page, 1, 10000);
  const pageSize = pageNumber(query.pageSize, 6, 24);
  const normalized = normalizeSearch(q);
  const terms = normalized.split(' ').filter(Boolean);
  const filtered = products.filter((product) => {
    if (
      category &&
      normalizeSearch(product.category) !== normalizeSearch(category)
    )
      return false;
    const haystack = normalizeSearch(
      [
        product.name,
        product.brand,
        ...product.aliases,
        product.unit || '',
      ].join(' '),
    );
    const compactPack = normalizeSearch(
      `${product.name} ${product.unit || ''}`,
    ).replace(/\s/g, '');
    return terms.every(
      (term) => haystack.includes(term) || compactPack.includes(term),
    );
  });
  const rank = (product: PublicProduct) => {
    const names = [product.name, ...product.aliases].map(normalizeSearch);
    return names.some((name) => name === normalized)
      ? 0
      : names.some((name) => name.startsWith(normalized))
        ? 1
        : 2;
  };
  const collator = new Intl.Collator('en-GB', {
    numeric: true,
    sensitivity: 'base',
  });
  filtered.sort(
    (a, b) =>
      rank(a) - rank(b) || collator.compare(a.name, b.name) || a.id - b.id,
  );
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pages);
  const categories = [
    ...new Set(products.map((product) => product.category)),
  ].sort(collator.compare);
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pages,
    pageSize,
    categories,
    q,
    category,
  };
}
