import { useEffect, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { ItemGrid, PreviewNote, QueryState } from '@/components/platform';
import {
  useMeta,
  usePageMeta,
  usePlatform,
  type PlatformPage,
} from '@/lib/platform-api';
export default function ExplorePage() {
  const [path, navigate] = useLocation(),
    search = useSearch(),
    p = new URLSearchParams(search),
    fixed =
      path === '/shops'
        ? 'shop'
        : path === '/clothing'
          ? 'clothing'
          : path === '/events'
            ? 'event'
            : path === '/jobs'
              ? 'job'
              : '',
    kind = fixed || p.get('kind') || '',
    q = p.get('q') || '',
    city = p.get('city') || '',
    community = p.get('community') || '',
    category = p.get('category') || '',
    employmentType = p.get('employmentType') || '',
    when = p.get('when') || 'upcoming',
    page = p.get('page') || '1';
  const [term, setTerm] = useState(q);
  const hasFilters = !!(
    q ||
    city ||
    community ||
    category ||
    employmentType ||
    p.get('businessKind') ||
    (!fixed && kind) ||
    (when !== 'upcoming' && ['event', 'job'].includes(kind))
  );
  useEffect(() => setTerm(q), [q]);
  const api = new URLSearchParams({
    kind,
    q,
    city,
    community,
    category,
    page,
    pageSize: '12',
  });
  if (kind === 'event' || kind === 'job') api.set('when', when);
  if (kind === 'job' && employmentType)
    api.set('employmentType', employmentType);
  if (path === '/shops' && p.get('businessKind'))
    api.set('businessKind', p.get('businessKind')!);
  const result = usePlatform<PlatformPage>(`/search?${api}`),
    meta = useMeta();
  const title =
    path === '/shops'
      ? 'Independent shops. Familiar finds.'
      : path === '/clothing'
        ? 'A little culture. Worn your way.'
        : path === '/events'
          ? 'Meet. Make. Belong.'
          : path === '/jobs'
            ? 'Your next possibility.'
            : 'What will you discover?';
  const copy =
    path === '/shops'
      ? 'Explore grocery and clothing businesses across our sample cities.'
      : path === '/clothing'
        ? 'Browse illustrative garments, sizing and fabric information from sample clothing shops.'
        : path === '/events'
          ? 'Discover sample workshops, cultural markets and community meet-ups.'
          : path === '/jobs'
            ? 'Explore sample local roles. Opportunities are open to all backgrounds; community filters describe listings, not applicant eligibility.'
            : 'Search shops, cultural clothing, communities, events and local opportunities in one place.';
  usePageMeta(path.slice(1) || 'Explore', copy);
  const update = (name: string, value: string) => {
    const next = new URLSearchParams(search);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== 'page') next.delete('page');
    if (name === 'kind') {
      next.delete('category');
      next.delete('employmentType');
      next.delete('when');
    }
    navigate(`${path}${next.size ? '?' + next : ''}`);
  };
  const select = (
    name: string,
    label: string,
    value: string,
    options: { value: string; label: string }[],
  ) => (
    <label className="em-m-field">
      {label}
      <select value={value} onChange={(e) => update(name, e.target.value)}>
        <option value="">All {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="em-m-page">
      <PreviewNote />
      <p className="em-m-eyebrow">
        {path === '/jobs' ? 'Local opportunities' : 'Explore EthnoMart'}
      </p>
      <h1>{title}</h1>
      <p className="em-m-lead">{copy}</p>
      {path === '/clothing' && (
        <div className="em-m-clothing-links">
          <Link className="em-m-link" href="/shops?businessKind=clothing">
            Explore clothing businesses
          </Link>
        </div>
      )}
      <div className="em-m-filterbar">
        <form
          className="em-m-searchfield"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update('q', term.trim());
          }}
        >
          <label className="em-m-field">
            Search
            <input
              type="search"
              value={term}
              maxLength={100}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search this view…"
            />
          </label>
          <button className="em-m-button" type="submit">
            Search
          </button>
        </form>
        {select(
          'city',
          'Cities',
          city,
          meta.data?.cities.map((c) => ({
            value: String(c.id),
            label: c.name,
          })) || [],
        )}
        {select(
          'community',
          'Communities',
          community,
          meta.data?.communities.map((c) => ({
            value: String(c.id),
            label: c.name,
          })) || [],
        )}
        {!fixed &&
          select(
            'kind',
            'Types',
            kind,
            [
              ['shop', 'Shops'],
              ['grocery', 'Groceries'],
              ['clothing', 'Clothing'],
              ['community', 'Communities'],
              ['event', 'Events'],
              ['job', 'Jobs'],
            ].map(([value, label]) => ({ value, label })),
          )}
      </div>
      <div className="em-m-filter-extra">
        {path === '/shops' && (
          <label className="em-m-field">
            Business type
            <select
              value={p.get('businessKind') || ''}
              onChange={(e) => update('businessKind', e.target.value)}
            >
              <option value="">All shops</option>
              <option value="grocery">Groceries</option>
              <option value="clothing">Clothing & textiles</option>
            </select>
          </label>
        )}
        {['event', 'job', 'clothing'].includes(kind) &&
          select(
            'category',
            'Categories',
            category,
            meta.data?.categories[kind as 'event' | 'job' | 'clothing'].map(
              (c) => ({
                value: c,
                label: c,
              }),
            ) || [],
          )}
        {['event', 'job'].includes(kind) && (
          <label className="em-m-field">
            Date range
            <select
              value={when}
              onChange={(e) => update('when', e.target.value)}
            >
              <option value="upcoming">
                {kind === 'job' ? 'Open sample roles' : 'Upcoming'}
              </option>
              <option value="past">
                {kind === 'job' ? 'Closed sample roles' : 'Past'}
              </option>
              <option value="all">All dates</option>
            </select>
          </label>
        )}
        {kind === 'job' &&
          select(
            'employmentType',
            'Employment types',
            employmentType,
            ['Full-time', 'Part-time', 'Contract'].map((c) => ({
              value: c,
              label: c,
            })),
          )}
        <button
          type="button"
          className="em-m-link"
          disabled={!hasFilters && !term}
          onClick={() => {
            setTerm('');
            navigate(path);
          }}
        >
          Clear filters
        </button>
        <Link className="em-m-link" href="/saved">
          Your saved discoveries
        </Link>
      </div>
      {meta.isError && (
        <p role="alert">
          Filter options could not load.{' '}
          <button onClick={() => void meta.refetch()}>Retry options</button>
        </p>
      )}
      <QueryState
        loading={result.isLoading}
        error={result.error}
        retry={() => void result.refetch()}
      />
      {result.data && !result.isError && (
        <>
          <div
            className="em-m-results-meta"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>
              {result.data.total} sample{' '}
              {result.data.total === 1 ? 'result' : 'results'}
            </span>
            <span>All listings are fictional</span>
          </div>
          {result.data.items.length ? (
            <ItemGrid items={result.data.items} />
          ) : (
            <div className="em-m-state">
              <h2>No discoveries in this view yet.</h2>
              <p>
                Try another city, community or search. Empty sample results do
                not mean there are no real businesses or activities.
              </p>
              <button className="em-m-button" onClick={() => navigate(path)}>
                Reset this view
              </button>
            </div>
          )}
          {result.data.totalPages > 1 && (
            <nav className="em-m-pagination" aria-label="Results pages">
              <button
                className="em-m-button em-m-button--outline"
                disabled={result.data.page <= 1}
                onClick={() => update('page', String(result.data!.page - 1))}
              >
                Previous
              </button>
              <span>
                Page {result.data.page} of {result.data.totalPages}
              </span>
              <button
                className="em-m-button em-m-button--outline"
                disabled={result.data.page >= result.data.totalPages}
                onClick={() => update('page', String(result.data!.page + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
      {['event', 'job'].includes(kind) && (
        <div className="em-m-state">
          <h2>Have something to share?</h2>
          <p>
            Try submitting a fictional{' '}
            {kind === 'job' ? 'opportunity' : 'activity'} to the review queue.
          </p>
          <Link className="em-m-button" href={`/contribute?kind=${kind}`}>
            Contribute a sample listing
          </Link>
        </div>
      )}
    </div>
  );
}
