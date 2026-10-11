import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGetMeQueryKey, type User } from '@workspace/api-client-react';
import { useAuthStore } from '@/store/auth';

export class OnboardingError extends Error {
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
export async function onboardingRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new OnboardingError(
      0,
      'Couldn’t reach the local trial. Your entered details are still here. Please try again.',
    );
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new OnboardingError(
      response.status,
      data?.error || 'The trial could not complete this request.',
      data?.fields,
    );
  if (!data || typeof data !== 'object')
    throw new OnboardingError(
      502,
      'The trial received an unexpected response.',
    );
  return data as T;
}
export interface PilotApplication {
  kind?: 'grocery' | 'clothing';
  id: number;
  shopName: string;
  ownerName: string;
  email: string;
  cityName?: string;
  communityName?: string;
  state: string;
  revision: number;
  reason: string | null;
  shopId: number | null;
  createdAt: string;
  invitation: {
    expiresAt: string;
    used: boolean;
    revoked: boolean;
    expired: boolean;
  } | null;
}
export interface ManagedShop {
  id: number;
  name: string;
  state: string;
  revision: number;
  reason: string | null;
  cityName?: string;
  communityName?: string;
}
export interface ModeratedListing {
  id: number;
  name: string;
  brand: string;
  pack: string;
  price: string;
  state: string;
  revision: number;
  hasPhoto: boolean;
  moderation: {
    blocked: boolean;
    reason: string | null;
    revision: number;
    changedAt: string | null;
  };
}
export interface ManagerShopDetail {
  shop: ManagedShop;
  listings: ModeratedListing[];
  events: {
    id: number;
    entity: string;
    entityId: number;
    kind: string;
    reason: string | null;
    at: string;
    actor: string;
  }[];
}
export interface ManagerOverview {
  applications: PilotApplication[];
  shops: ManagedShop[];
}
export function useManagerOverview() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['manager', user?.id, 'overview'],
    queryFn: () => onboardingRequest<ManagerOverview>('/onboarding/overview'),
    retry: false,
  });
}
export function useManagerShop(id: number) {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['manager', user?.id, 'shop', id],
    queryFn: () =>
      onboardingRequest<ManagerShopDetail>(`/onboarding/shops/${id}`),
    enabled: Number.isSafeInteger(id) && id > 0,
    retry: false,
  });
}
export function usePilotRefresh() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ['manager'] });
    void client.invalidateQueries({ queryKey: ['platform'] });
    void client.invalidateQueries({ queryKey: ['merchant'] });
    void client.invalidateQueries({ queryKey: ['catalogue'] });
    void client.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' &&
        query.queryKey[0].startsWith('/api/stores'),
    });
    void client.invalidateQueries({ queryKey: ['/api/communities'] });
  };
}
export function usePilotSignIn() {
  const client = useQueryClient(),
    setUser = useAuthStore((state) => state.setUser);
  return (user: User) => {
    client.removeQueries({ queryKey: ['manager'] });
    client.removeQueries({ queryKey: ['platform-manager'] });
    client.removeQueries({ queryKey: ['merchant'] });
    client.setQueryData(getGetMeQueryKey(), user);
    setUser(user);
  };
}
export function tokenFromFragment() {
  return new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
}
export function localInvitationUrl(path: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;
}
