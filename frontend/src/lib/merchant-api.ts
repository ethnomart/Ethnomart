import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getListProductsQueryKey } from '@workspace/api-client-react';
import { useAuthStore } from '@/store/auth';
import type { MerchantListing, MerchantShop } from './merchant-listings';

export class MerchantApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(
    status: number,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export async function merchantRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/pilot${path}`, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new MerchantApiError(
      0,
      'Couldn’t reach the workspace. Your entered details are still here. Please try again.',
    );
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new MerchantApiError(
      response.status,
      data?.error ||
        'The workspace could not complete this request. Please try again.',
      data?.fields,
    );
  if (!data)
    throw new MerchantApiError(
      502,
      'The workspace received an unexpected response. Please try again.',
    );
  return data as T;
}
export function useMerchantShops() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['merchant', 'shops', user?.id],
    queryFn: () => merchantRequest<MerchantShop[]>('/merchant/shops'),
    retry: false,
  });
}
export function useMerchantListings(storeId: number, enabled: boolean) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['merchant', 'listings', user?.id, storeId],
    queryFn: () =>
      merchantRequest<MerchantListing[]>(`/merchant/shops/${storeId}/listings`),
    enabled,
    retry: false,
  });
}
export function useMerchantListing(id: number, enabled: boolean) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['merchant', 'listing', user?.id, id],
    queryFn: () => merchantRequest<MerchantListing>(`/merchant/listings/${id}`),
    enabled,
    retry: false,
  });
}
export function useRefreshMerchantCatalogue() {
  const client = useQueryClient();
  return (storeId: number) => {
    void client.invalidateQueries({ queryKey: ['merchant'] });
    void client.invalidateQueries({ queryKey: ['catalogue', storeId] });
    void client.invalidateQueries({ queryKey: ['platform'] });
    void client.invalidateQueries({
      queryKey: getListProductsQueryKey(storeId),
    });
  };
}
