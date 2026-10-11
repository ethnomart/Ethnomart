import { useEffect, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
export interface PlatformItem {
  key?: string;
  id: number;
  kind: string;
  businessKind?: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
  category?: string;
  cityId?: number;
  communityId?: number;
  cityName?: string;
  communityName?: string;
  image: string;
  imageUrl?: string;
  href: string;
  startsAt?: string;
  endsAt?: string;
  closesAt?: string;
  venue?: string;
  organiser?: string;
  accessibility?: string;
  organisation?: string;
  employmentType?: string;
  requirements?: string;
  pricePence?: number;
  sizes?: string;
  fabric?: string;
  state?: string;
  revision: number;
  isDemo: true;
}
export interface PlatformMeta {
  cities: { id: number; name: string }[];
  communities: {
    id: number;
    name: string;
    slug: string;
    description: string;
    image: string;
  }[];
  categories: { event: string[]; job: string[]; clothing: string[] };
}
export interface PlatformPage {
  items: PlatformItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
export class PlatformError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function platformRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const r = await fetch(`${import.meta.env.BASE_URL}api/platform${path}`, {
    method,
    credentials: 'same-origin',
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).catch((e) => {
    if (e.name === 'AbortError') throw e;
    throw new PlatformError(
      0,
      'Could not reach EthnoMart. Your details are still here; try again.',
    );
  });
  const data = await r.json().catch(() => null);
  if (!r.ok)
    throw new PlatformError(
      r.status,
      data?.error || 'The request could not be completed.',
    );
  if (!data)
    throw new PlatformError(502, 'An unexpected response was received.');
  return data;
}
export function usePlatform<T>(path: string, enabled = true) {
  return useQuery({
    queryKey: ['platform', path],
    queryFn: ({ signal }) => platformRequest<T>(path, 'GET', undefined, signal),
    enabled,
    retry: false,
  });
}
export function useMeta() {
  return usePlatform<PlatformMeta>('/meta');
}
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} | EthnoMart`;
    let element = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!element) {
      element = document.createElement('meta');
      element.name = 'description';
      document.head.appendChild(element);
    }
    element.content = description;
  }, [title, description]);
}
const savedKey = 'ethnomart.saved.v1',
  followKey = 'ethnomart.followed.v1',
  changeEvent = 'ethnomart-preferences';
function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener('storage', callback);
  };
}
function read(key: string) {
  try {
    return localStorage.getItem(key) || '[]';
  } catch {
    return '[]';
  }
}
function parse(value: string) {
  try {
    const data = JSON.parse(value);
    return Array.isArray(data)
      ? data
          .filter(
            (v): v is string =>
              typeof v === 'string' &&
              /^(shop|grocery|clothing|event|job|community):\d+$/.test(v),
          )
          .slice(0, 200)
      : [];
  } catch {
    return [];
  }
}
export function usePreferences(follow = false) {
  const storageKey = follow ? followKey : savedKey,
    raw = useSyncExternalStore(
      subscribe,
      () => read(storageKey),
      () => '[]',
    ),
    ids = parse(raw);
  const write = (next: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event(changeEvent));
      return true;
    } catch {
      return false;
    }
  };
  return {
    ids,
    toggle: (id: string) =>
      write(
        ids.includes(id)
          ? ids.filter((v) => v !== id)
          : [...ids, id].slice(-200),
      ),
    clear: () => write([]),
  };
}
export const itemKey = (item: PlatformItem) =>
  item.key || `${item.kind}:${item.id}`;
export const londonTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(new Date(value));
