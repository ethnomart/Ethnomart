import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowUpRight, Search } from 'lucide-react';
import { useMeta, usePlatform, type PlatformPage } from '@/lib/platform-api';
export function GlobalSearch() {
  const [term, setTerm] = useState(''),
    [debounced, setDebounced] = useState(''),
    [city, setCity] = useState(''),
    [, navigate] = useLocation(),
    meta = useMeta();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(timer);
  }, [term]);
  const suggestions = usePlatform<PlatformPage>(
    `/search?q=${encodeURIComponent(debounced)}&pageSize=5${city ? '&city=' + city : ''}`,
    debounced.length >= 2,
  );
  return (
    <div className="em-m-hero-search">
      <form
        role="search"
        aria-label="Search EthnoMart"
        onSubmit={(e) => {
          e.preventDefault();
          const p = new URLSearchParams();
          if (term.trim()) p.set('q', term.trim());
          if (city) p.set('city', city);
          navigate(`/explore${p.size ? '?' + p : ''}`);
        }}
      >
        <label className="em-m-search-term">
          <span>Search EthnoMart</span>
          <div>
            <Search size={20} aria-hidden="true" />
            <input
              name="q"
              type="search"
              list="ethnomart-search-suggestions"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Shops, clothing, events or jobs…"
              maxLength={100}
              autoComplete="off"
            />
            <datalist id="ethnomart-search-suggestions">
              {suggestions.data?.items.map((i) => (
                <option key={`${i.kind}:${i.id}`} value={i.title}>
                  {i.kind} · {i.cityName || 'Community'}
                </option>
              ))}
            </datalist>
          </div>
        </label>
        <label className="em-m-search-city">
          <span>City</span>
          <select
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Search city"
          >
            <option value="">All cities</option>
            {meta.data?.cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" aria-label="Search EthnoMart">
          Search <ArrowUpRight size={20} aria-hidden="true" />
        </button>
      </form>
      {meta.isError && (
        <p className="em-m-search-status" role="status">
          City options could not load. You can still search all cities.{' '}
          <button type="button" onClick={() => void meta.refetch()}>
            Retry cities
          </button>
        </p>
      )}
      <span className="sr-only" role="status">
        {suggestions.isFetching && debounced.length >= 2
          ? 'Finding search suggestions.'
          : ''}
      </span>
      <div className="em-m-search-hints">
        <span>Try:</span>
        {['Clothing', 'Workshop', 'Retail'].map((s) => (
          <button
            key={s}
            onClick={() => {
              navigate(
                s === 'Clothing'
                  ? '/clothing'
                  : `/explore?q=${encodeURIComponent(s)}`,
              );
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
