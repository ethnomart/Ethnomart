import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLocation } from 'wouter';
import {
  getListCitiesQueryKey,
  getListCommunitiesQueryKey,
  getListStoresQueryKey,
  useListCities,
  useListCommunities,
  useListStores,
} from '@workspace/api-client-react';
import {
  ArrowUpRight,
  ChevronDown,
  Globe2,
  LoaderCircle,
  MapPin,
  Search,
  Store,
  X,
} from 'lucide-react';
import '@/styles/hero-search.css';
import { shopDirectoryHref } from '@/lib/shop-discovery';

const popularSearches = ['Pakistani', 'Indian', 'Halal', 'African'];
const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

interface SearchSuggestion {
  key: string;
  label: string;
  detail: string;
  href: string;
  kind: 'shop' | 'community';
}

export function HeroSearch() {
  const [term, setTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [cityId, setCityId] = useState<number | undefined>();
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [, navigate] = useLocation();
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const resultsList = useRef<HTMLUListElement>(null);
  const id = useId();
  const normalizedTerm = normalize(term);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedTerm(normalizedTerm),
      220,
    );
    return () => window.clearTimeout(timer);
  }, [normalizedTerm]);

  useEffect(() => {
    if (!expanded) return;
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target)
      ) {
        setExpanded(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [expanded]);

  const { data: cities, isError: citiesError } = useListCities({
    query: { queryKey: getListCitiesQueryKey(), staleTime: 300_000 },
  });
  const { data: communities } = useListCommunities({
    query: { queryKey: getListCommunitiesQueryKey(), staleTime: 300_000 },
  });
  const communityMatch = communities?.find(
    (community) =>
      normalize(community.name) === debouncedTerm ||
      normalize(community.slug) === debouncedTerm,
  );
  const params = {
    approved: true,
    cityId,
    communityId: communityMatch?.id,
    search: communityMatch ? undefined : debouncedTerm || undefined,
  };
  const {
    data: stores,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useListStores(params, {
    query: {
      queryKey: getListStoresQueryKey(params),
      enabled: expanded,
      staleTime: 30_000,
    },
  });
  const pending =
    normalizedTerm !== debouncedTerm || isLoading || (isFetching && !stores);
  const communitySuggestions: SearchSuggestion[] =
    !cityId && debouncedTerm
      ? (communities ?? [])
          .filter(
            (community) =>
              normalize(community.name).includes(debouncedTerm) ||
              normalize(community.slug).includes(debouncedTerm),
          )
          .slice(0, 2)
          .map((community) => ({
            key: `community-${community.id}`,
            label: `${community.name} community`,
            detail: 'Browse shops in this community',
            href: shopDirectoryHref({ community: community.slug }),
            kind: 'community',
          }))
      : [];
  const shopSuggestions: SearchSuggestion[] = (stores ?? [])
    .filter((store) => store.isApproved)
    .slice(0, 6)
    .map((store) => ({
      key: `store-${store.id}`,
      label: store.name,
      detail: [
        store.category,
        store.cityName ||
          cities?.find((city) => city.id === store.cityId)?.name,
      ]
        .filter(Boolean)
        .join(' · '),
      href: `/store/${encodeURIComponent(String(store.id))}`,
      kind: 'shop',
    }));
  const suggestions =
    pending || isError ? [] : [...communitySuggestions, ...shopSuggestions];
  const selectedIndex = activeIndex < suggestions.length ? activeIndex : -1;
  const cityName = cities?.find((city) => city.id === cityId)?.name;

  useEffect(() => {
    if (!expanded || selectedIndex < 0 || !resultsList.current) return;
    const option = document.getElementById(`${id}-option-${selectedIndex}`);
    if (!option) return;
    const optionBounds = option.getBoundingClientRect();
    const listBounds = resultsList.current.getBoundingClientRect();
    if (optionBounds.bottom > listBounds.bottom)
      resultsList.current.scrollTop += optionBounds.bottom - listBounds.bottom;
    else if (optionBounds.top < listBounds.top)
      resultsList.current.scrollTop -= listBounds.top - optionBounds.top;
  }, [expanded, selectedIndex, id]);

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setExpanded(false);
    setActiveIndex(-1);
    navigate(suggestion.href);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setExpanded(true);
      if (!suggestions.length) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) =>
        index < 0
          ? direction === 1
            ? 0
            : suggestions.length - 1
          : (index + direction + suggestions.length) % suggestions.length,
      );
    } else if (event.key === 'Enter' && expanded && selectedIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      setExpanded(false);
      setActiveIndex(-1);
    }
  };

  const choosePopular = (value: string) => {
    setTerm(value);
    setActiveIndex(-1);
    setExpanded(true);
    input.current?.focus();
  };

  return (
    <div
      ref={root}
      className="em-hero-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setExpanded(false);
          setActiveIndex(-1);
        }
      }}
    >
      <form
        className="em-hero-search-bar"
        role="search"
        aria-label="Find local shops"
        onSubmit={(event) => {
          event.preventDefault();
          const selectedCommunity = communities?.find(
            (community) =>
              normalize(community.name) === normalize(term) ||
              normalize(community.slug) === normalize(term),
          );
          setExpanded(false);
          navigate(
            shopDirectoryHref({
              q: selectedCommunity ? undefined : term,
              community: selectedCommunity?.slug,
              city: cityId ? String(cityId) : undefined,
            }),
          );
        }}
      >
        <div className="em-hero-search-query">
          <Search
            className="em-hero-search-icon"
            size={23}
            strokeWidth={1.7}
            aria-hidden="true"
          />
          <div className="em-hero-search-input-wrap">
            <label htmlFor={`${id}-query`}>What are you looking for?</label>
            <input
              ref={input}
              id={`${id}-query`}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={expanded}
              aria-controls={expanded ? `${id}-results` : undefined}
              aria-activedescendant={
                expanded && selectedIndex >= 0
                  ? `${id}-option-${selectedIndex}`
                  : undefined
              }
              aria-describedby={`${id}-hint`}
              placeholder="Search shops or cuisines"
              autoComplete="off"
              spellCheck={false}
              maxLength={80}
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setActiveIndex(-1);
                setExpanded(true);
              }}
              onFocus={() => setExpanded(true)}
              onClick={() => setExpanded(true)}
              onKeyDown={handleKeyDown}
            />
          </div>
          {term && (
            <button
              type="button"
              className="em-hero-search-clear"
              aria-label="Clear search"
              onClick={() => choosePopular('')}
            >
              <X size={17} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="em-hero-search-city">
          <MapPin size={18} strokeWidth={1.6} aria-hidden="true" />
          <div>
            <label htmlFor={`${id}-city`}>Where?</label>
            <select
              id={`${id}-city`}
              value={cityId ?? ''}
              disabled={citiesError}
              onChange={(event) => {
                setCityId(
                  event.target.value ? Number(event.target.value) : undefined,
                );
                setActiveIndex(-1);
                setExpanded(true);
              }}
            >
              <option value="">All UK cities</option>
              {(cities ?? []).map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown
            className="em-hero-search-city-chevron"
            size={15}
            aria-hidden="true"
          />
        </div>

        <button type="submit" className="em-hero-search-submit">
          Find shops{' '}
          <ArrowUpRight size={19} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </form>

      <div className="em-hero-search-popular" id={`${id}-hint`}>
        <span>Try a sample:</span>
        {popularSearches.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => choosePopular(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div
        className="em-search-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {expanded
          ? pending
            ? 'Looking for shops.'
            : isError
              ? 'Shop search is temporarily unavailable.'
              : `${suggestions.length} search suggestions available.`
          : ''}
      </div>

      {expanded && (
        <div className="em-hero-search-panel">
          <div className="em-hero-search-panel-heading">
            <span>
              {debouncedTerm ? 'Search suggestions' : 'Explore sample shops'}
            </span>
            <span>{cityName || 'Across the UK'}</span>
          </div>
          <ul
            ref={resultsList}
            id={`${id}-results`}
            role="listbox"
            aria-label="Shop and community suggestions"
            aria-busy={pending}
            className="em-hero-search-results"
          >
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.key} role="presentation">
                <button
                  type="button"
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  tabIndex={-1}
                  className="em-hero-search-option"
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <span
                    className={`em-hero-search-result-icon ${suggestion.kind === 'community' ? 'is-community' : ''}`}
                    aria-hidden="true"
                  >
                    {suggestion.kind === 'community' ? (
                      <Globe2 size={21} strokeWidth={1.5} />
                    ) : (
                      <Store size={21} strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="em-hero-search-result-copy">
                    <span>{suggestion.label}</span>
                    <small>{suggestion.detail}</small>
                  </span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {pending ? (
            <p className="em-hero-search-message">
              <LoaderCircle
                className="em-search-loading"
                size={19}
                aria-hidden="true"
              />{' '}
              Looking for shops…
            </p>
          ) : isError ? (
            <div className="em-hero-search-message em-hero-search-empty">
              <p>We couldn’t load the shops. Please try again.</p>
              <button
                type="button"
                onClick={() => {
                  void refetch();
                }}
              >
                Try again
              </button>
            </div>
          ) : !suggestions.length ? (
            <div className="em-hero-search-message em-hero-search-empty">
              <p>
                No shops found{term.trim() ? ` for “${term.trim()}”` : ''}
                {cityName ? ` in ${cityName}` : ''}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCityId(undefined);
                  choosePopular('');
                }}
              >
                Clear filters
              </button>
            </div>
          ) : null}
          {citiesError && (
            <p className="em-hero-search-city-error">
              City filters are unavailable. You can still search all shops.
            </p>
          )}
          <p className="em-hero-search-keyboard-hint">
            Use ↑ ↓ to browse · Enter to open · Esc to close
          </p>
        </div>
      )}
    </div>
  );
}
