import { useQuery } from '@tanstack/react-query';
import type { Availability } from './merchant-listings';

export interface CatalogueProduct {
  sizes?: string;
  fabric?: string;
  id: number;
  storeId: number;
  name: string;
  brand: string;
  aliases: string[];
  category: string;
  unit?: string;
  imageUrl?: string;
  pricePence: number;
  availabilityStatus: Availability;
  confirmedAt: string | null;
  merchantReviewedDemo: boolean;
  isDemo: true;
}
export interface CatalogueShop {
  kind?: 'grocery' | 'clothing';
  id: number;
  name: string;
  cityName?: string;
  communityName?: string;
}
export interface CataloguePage {
  items: CatalogueProduct[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  categories: string[];
  q: string;
  category: string;
}
export class CatalogueError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
async function request<T>(path: string): Promise<T> {
  const response = await fetch(
    `${import.meta.env.BASE_URL}api/catalogue${path}`,
    {
      credentials: 'same-origin',
    },
  ).catch(() => {
    throw new CatalogueError(
      0,
      'Couldn’t reach the catalogue. Please try again.',
    );
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new CatalogueError(
      response.status,
      data?.error || 'The catalogue could not load. Please try again.',
    );
  if (!data || typeof data !== 'object')
    throw new CatalogueError(
      502,
      'The catalogue received an unexpected response.',
    );
  return data as T;
}
export function useCatalogue(
  storeId: number,
  q: string,
  category: string,
  page: number,
) {
  const params = new URLSearchParams({ q, category, page: String(page) });
  return useQuery({
    queryKey: ['catalogue', storeId, 'page', q, category, page],
    queryFn: () =>
      request<CataloguePage>(`/shops/${storeId}/products?${params}`),
    enabled: Number.isSafeInteger(storeId) && storeId > 0,
    retry: false,
  });
}
export function useCatalogueProduct(storeId: number, id: number) {
  return useQuery({
    queryKey: ['catalogue', storeId, 'product', id],
    queryFn: () =>
      request<{ shop: CatalogueShop; product: CatalogueProduct }>(
        `/shops/${storeId}/products/${id}`,
      ),
    enabled:
      Number.isSafeInteger(storeId) &&
      storeId > 0 &&
      Number.isSafeInteger(id) &&
      id > 0,
    retry: false,
  });
}
export function catalogueImage(url: string) {
  return url.startsWith('/')
    ? `${import.meta.env.BASE_URL}${url.slice(1)}`
    : url;
}
export function catalogueUrl(storeId: number, q = '', category = '', page = 1) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (page > 1) params.set('page', String(page));
  return `/store/${storeId}${params.size ? '?' + params : ''}`;
}
export function confirmationAge(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value)))
    return 'No shopkeeper review recorded';
  const age = Date.now() - Date.parse(value);
  return age >= 7 * 86400000
    ? 'Needs checking · last reviewed over a week ago'
    : 'Shopkeeper reviewed · sample data';
}
