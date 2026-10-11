import { useEffect, useId, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import {
  getListCitiesQueryKey,
  getListCommunitiesQueryKey,
  getListStoresQueryKey,
  useListCities,
  useListCommunities,
  useListStores,
} from '@workspace/api-client-react';
import { ArrowUpRight, MapPin, Search, Store } from 'lucide-react';
import {
  readShopFilters,
  shopDirectoryHref,
  type ShopFilters,
} from '@/lib/shop-discovery';
import '@/styles/shop-discovery.css';

const emptyFilters: ShopFilters = { q: '', city: '', community: '' };

export function ShopDirectory({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const [draft, setDraft] = useState<ShopFilters>(() =>
    compact ? emptyFilters : readShopFilters(searchString),
  );
  const [homeFilters, setHomeFilters] = useState<ShopFilters>(emptyFilters);
  const [limit, setLimit] = useState(24);
  const applied = compact ? homeFilters : readShopFilters(searchString);

  useEffect(() => {
    if (!compact) {
      setDraft(readShopFilters(searchString));
      setLimit(24);
    }
  }, [compact, searchString]);

  const citiesQuery = useListCities({
    query: { queryKey: getListCitiesQueryKey(), staleTime: 300_000 },
  });
  const communitiesQuery = useListCommunities({
    query: { queryKey: getListCommunitiesQueryKey(), staleTime: 300_000 },
  });
  const cities = Array.isArray(citiesQuery.data) ? citiesQuery.data : [];
  const communities = Array.isArray(communitiesQuery.data)
    ? communitiesQuery.data
    : [];
  const community = communities.find((item) => item.slug === applied.community);
  const waitingForCommunity = !!applied.community && communitiesQuery.isLoading;
  const unknownCommunity =
    !!applied.community &&
    !community &&
    !communitiesQuery.isLoading &&
    !communitiesQuery.isError;
  const unknownCity =
    !!applied.city &&
    !!citiesQuery.data &&
    !cities.some((item) => String(item.id) === applied.city);
  const invalidFilter = unknownCommunity || unknownCity;
  const params = {
    approved: true,
    search: applied.q || undefined,
    cityId: applied.city ? Number(applied.city) : undefined,
    communityId: community?.id,
  };
  const shopsQuery = useListStores(params, {
    query: {
      queryKey: getListStoresQueryKey(params),
      enabled: !invalidFilter && (!applied.community || !!community),
      staleTime: 30_000,
    },
  });
  const loading = waitingForCommunity || shopsQuery.isLoading;
  const failed =
    shopsQuery.isError || (!!applied.community && communitiesQuery.isError);
  const shops = Array.isArray(shopsQuery.data)
    ? shopsQuery.data.filter((shop) => shop.isApproved)
    : [];
  const shownShops = shops.slice(0, compact ? 3 : limit);
  const filtered = !!(applied.q || applied.city || applied.community);
  const clearFilters = () => {
    setDraft(emptyFilters);
    if (compact) setHomeFilters(emptyFilters);
    else navigate('/shops');
  };
  const retry = () => {
    if (communitiesQuery.isError) void communitiesQuery.refetch();
    if (citiesQuery.isError) void citiesQuery.refetch();
    if (!applied.community || community) void shopsQuery.refetch();
  };

  return (
    <div
      className={`em-shop-directory${compact ? ' em-shop-directory--compact' : ''}`}
    >
      <form
        className="em-shop-filters"
        role="search"
        aria-label="Find sample shops"
        action={`${import.meta.env.BASE_URL}shops`}
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          const next = readShopFilters(
            new URLSearchParams({
              q: draft.q,
              city: draft.city,
              community: draft.community,
            }).toString(),
          );
          if (compact) {
            setDraft(next);
            setHomeFilters(next);
          } else navigate(shopDirectoryHref(next));
        }}
      >
        <div className="em-shop-filter em-shop-filter--query">
          <label htmlFor={`${id}-query`}>Shop or category</label>
          <div>
            <Search size={19} strokeWidth={1.6} aria-hidden="true" />
            <input
              id={`${id}-query`}
              name="q"
              type="search"
              placeholder="Try Bombay or spices"
              autoComplete="off"
              maxLength={80}
              value={draft.q}
              onChange={(event) =>
                setDraft({ ...draft, q: event.target.value })
              }
            />
          </div>
        </div>
        <div className="em-shop-filter">
          <label htmlFor={`${id}-city`}>City</label>
          <select
            id={`${id}-city`}
            name="city"
            disabled={citiesQuery.isLoading || citiesQuery.isError}
            value={draft.city}
            onChange={(event) =>
              setDraft({ ...draft, city: event.target.value })
            }
          >
            <option value="">All sample cities</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
            {draft.city &&
              !cities.some((city) => String(city.id) === draft.city) && (
                <option value={draft.city}>Unknown city</option>
              )}
          </select>
        </div>
        <div className="em-shop-filter">
          <label htmlFor={`${id}-community`}>Community</label>
          <select
            id={`${id}-community`}
            name="community"
            disabled={communitiesQuery.isLoading || communitiesQuery.isError}
            value={draft.community}
            onChange={(event) =>
              setDraft({ ...draft, community: event.target.value })
            }
          >
            <option value="">All communities</option>
            {communities.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
            {draft.community &&
              !communities.some((item) => item.slug === draft.community) && (
                <option value={draft.community}>Unknown community</option>
              )}
          </select>
        </div>
        <button type="submit" className="em-shop-search-button">
          Find shops <ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </form>

      {(citiesQuery.isError || communitiesQuery.isError) && !failed && (
        <p className="em-shop-filter-note">
          Some filters couldn’t load. Shop-name search is still available.{' '}
          <button type="button" onClick={retry}>
            Retry filters
          </button>
        </p>
      )}
      <div className="em-shop-results-bar">
        <p role="status" aria-live="polite" aria-atomic="true">
          {invalidFilter
            ? 'Unrecognised filter'
            : failed
              ? 'Directory unavailable'
              : loading
                ? 'Looking for sample shops…'
                : `${shops.length} sample ${shops.length === 1 ? 'shop' : 'shops'}${community ? ` · ${community.name}` : ''}${applied.q ? ` matching “${applied.q}”` : ''}`}
        </p>
        {filtered && (
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {invalidFilter ? (
        <div className="em-shop-state">
          <h3>This filter isn’t in the sample directory</h3>
          <p>Choose a listed city or community to continue.</p>
          <button type="button" onClick={clearFilters}>
            Reset directory
          </button>
        </div>
      ) : failed ? (
        <div className="em-shop-state" role="alert">
          <h3>The directory couldn’t load</h3>
          <p>Your search hasn’t been lost. Try loading these results again.</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="em-shop-state" aria-busy="true">
          <p>Loading sample catalogues…</p>
        </div>
      ) : shops.length ? (
        <>
          <div className="em-shop-grid">
            {shownShops.map((shop, index) => (
              <article
                key={shop.id}
                className={`em-shop-card em-shop-card--${index % 3}`}
              >
                <div className="em-shop-card-top">
                  <span className="em-shop-card-mark" aria-hidden="true">
                    <Store size={35} strokeWidth={1.2} />
                  </span>
                  <span className="em-shop-sample-label">Sample shop</span>
                </div>
                <div className="em-shop-card-body">
                  <p className="em-shop-card-community">
                    {shop.communityName ||
                      communities.find((item) => item.id === shop.communityId)
                        ?.name ||
                      'Sample community'}
                  </p>
                  <h3>{shop.name}</h3>
                  <p className="em-shop-card-area">
                    <MapPin size={15} aria-hidden="true" />
                    {shop.cityName ||
                      cities.find((city) => city.id === shop.cityId)?.name ||
                      'Area not supplied'}
                  </p>
                  <p className="em-shop-card-description">
                    Explore the example products in this catalogue. Names,
                    prices and availability are demonstration data.
                  </p>
                  <Link
                    className="em-shop-catalogue-link"
                    href={`/store/${shop.id}`}
                    aria-label={`View ${shop.name} sample catalogue`}
                  >
                    View catalogue{' '}
                    <span aria-hidden="true">
                      <ArrowUpRight size={19} strokeWidth={1.5} />
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {compact && (
            <div className="em-shop-more">
              <p>
                Showing {shownShops.length} of {shops.length} sample shops
              </p>
              <Link href={shopDirectoryHref(applied)}>
                Open full directory{' '}
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
          )}
          {!compact && shownShops.length < shops.length && (
            <div className="em-shop-more">
              <button
                type="button"
                onClick={() => setLimit((value) => value + 24)}
              >
                Show more sample shops
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="em-shop-state">
          <h3>
            {filtered ? 'No matching sample shops' : 'No sample catalogues yet'}
          </h3>
          <p>
            {filtered
              ? 'Try another shop name, category, city or community.'
              : 'There are no sample shops to browse at the moment.'}
          </p>
          {filtered && (
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
