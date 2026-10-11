export interface ShopFilters {
  q: string;
  city: string;
  community: string;
}

export function readShopFilters(search: string): ShopFilters {
  const params = new URLSearchParams(search);
  const city = params.get('city') || '';
  return {
    q: (params.get('q') || '').trim().replace(/\s+/g, ' ').slice(0, 80),
    city: /^[1-9]\d{0,6}$/.test(city) ? city : '',
    community: (params.get('community') || '')
      .trim()
      .toLowerCase()
      .slice(0, 80),
  };
}

export function shopDirectoryHref(filters: Partial<ShopFilters> = {}) {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim().slice(0, 80));
  if (filters.city) params.set('city', filters.city);
  if (filters.community) params.set('community', filters.community);
  const query = params.toString();
  return `/shops${query ? `?${query}` : ''}`;
}
