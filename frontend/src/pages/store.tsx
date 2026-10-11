import '@/styles/multicultural.css';
import { useEffect, useState } from 'react';
import { Link, useRoute, useSearch, useLocation } from 'wouter';
import { useGetStore, getGetStoreQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, MapPin, Search } from 'lucide-react';
import { catalogueUrl, useCatalogue } from '@/lib/catalogue-api';
import { availabilityLabels, formatGBP } from '@/lib/merchant-listings';
import '@/styles/catalogue.css';
import { CataloguePhoto } from '@/components/catalogue-photo';
import { useReveal } from '@/lib/use-reveal';

export default function StorePage() {
  const reveal = useReveal<HTMLDivElement>();
  const [, params] = useRoute('/store/:id');
  const storeId = Number(params?.id);
  const searchParams = new URLSearchParams(useSearch());
  const q = searchParams.get('q') || '',
    category = searchParams.get('category') || '';
  const rawPage = searchParams.get('page') || '1';
  const page = /^[1-9]\d{0,3}$/.test(rawPage) ? Number(rawPage) : 1;
  const [term, setTerm] = useState(q),
    [, navigate] = useLocation();
  useEffect(() => setTerm(q), [q]);
  const shop = useGetStore(storeId, {
    query: {
      queryKey: getGetStoreQueryKey(storeId),
      enabled: Number.isSafeInteger(storeId) && storeId > 0,
      retry: false,
    },
  });
  const catalogue = useCatalogue(storeId, q, category, page);
  useEffect(() => {
    document.title = `${shop.data?.name || 'Sample shop'} | EthnoMart`;
  }, [shop.data?.name]);
  const filters = (nextQ = q, nextCategory = category, nextPage = 1) =>
    navigate(catalogueUrl(storeId, nextQ, nextCategory, nextPage));
  if (shop.isLoading)
    return (
      <div className="em-catalogue em-catalogue-message" role="status">
        Loading sample shop…
      </div>
    );
  if (!shop.data)
    return (
      <div className="em-catalogue em-catalogue-message">
        <h1>The shop couldn’t load.</h1>
        <p>
          This sample shop may be unavailable, or the backend may be offline.
        </p>
        <button
          className="em-catalogue-button"
          onClick={() => {
            void shop.refetch();
            void catalogue.refetch();
          }}
        >
          Try again
        </button>
        <Link className="em-catalogue-back" href="/shops">
          Back to sample shops
        </Link>
      </div>
    );
  return (
    <div ref={reveal} className="em-catalogue em-shop-page">
      <Link className="em-catalogue-back" href="/shops">
        <ArrowLeft size={17} aria-hidden="true" />
        Back to sample shops
      </Link>
      <header className="em-catalogue-heading">
        <div>
          <p className="em-catalogue-eyebrow">
            Sample catalogue · Demonstration data
          </p>
          <h1>{shop.data.name}</h1>
          <p>
            Browse the sample catalogue and check product details, sizing or
            reported availability.
          </p>
        </div>
        <p className="em-catalogue-location">
          <MapPin size={17} aria-hidden="true" />
          {shop.data.cityName} · {shop.data.communityName}
        </p>
      </header>
      <div data-em-reveal className="em-shop-cover">
        <CataloguePhoto
          url={shop.data.imageUrl || undefined}
          alt="Illustrative sample shop interior"
          sizes="(max-width: 1280px) 100vw, 1200px"
          eager
        />
        <p className="em-m-small">
          AI concept photo · not a photograph of this sample business.
        </p>
      </div>
      <div className="em-catalogue-layout">
        <aside className="em-catalogue-sidebar">
          <div className="em-catalogue-filters">
            <h2>Find your favourites.</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                filters(term.trim());
              }}
            >
              <label htmlFor="catalogue-search">
                Name, brand or product detail
              </label>
              <div className="em-catalogue-search">
                <input
                  id="catalogue-search"
                  placeholder="Try rice, a tunic or a brand"
                  maxLength={100}
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                />
                <button type="submit" aria-label="Search catalogue">
                  <Search size={19} aria-hidden="true" />
                </button>
              </div>
            </form>
            <h3>Categories</h3>
            <div className="em-catalogue-categories">
              {['', ...(catalogue.data?.categories || [])].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={category === value}
                  onClick={() => filters(q, value)}
                >
                  {value || 'All products'}
                </button>
              ))}
            </div>
            {(q || category) && (
              <button
                className="em-catalogue-clear"
                onClick={() => filters('', '')}
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="em-catalogue-sidebar-note">
            <h2>About this catalogue</h2>
            <p>
              A fictional shop used to test discovery. Prices and availability
              are sample data. Contact and purchasing are unavailable.
            </p>
          </div>
        </aside>
        <section
          className="em-catalogue-results"
          aria-labelledby="catalogue-products"
        >
          <div className="em-catalogue-result-heading">
            <h2 id="catalogue-products">{category || 'All products'}</h2>
            {catalogue.data && (
              <p role="status">
                {catalogue.data.total} sample products{q ? ` for “${q}”` : ''}
              </p>
            )}
          </div>
          {catalogue.isLoading ? (
            <p className="em-catalogue-empty" role="status">
              Loading products…
            </p>
          ) : catalogue.isError ? (
            <div className="em-catalogue-empty" role="alert">
              <h3>The catalogue couldn’t load.</h3>
              <p>{catalogue.error.message}</p>
              <button
                className="em-catalogue-button"
                onClick={() => {
                  void catalogue.refetch();
                }}
              >
                Try again
              </button>
            </div>
          ) : catalogue.data?.items.length ? (
            <>
              <div className="em-catalogue-grid">
                {catalogue.data.items.map((product) => {
                  const suffix = catalogueUrl(
                    storeId,
                    q,
                    category,
                    catalogue.data.page,
                  ).split('?')[1];
                  return (
                    <article
                      data-em-reveal
                      className="em-catalogue-card"
                      key={product.id}
                    >
                      <Link
                        href={`/store/${storeId}/product/${product.id}${suffix ? '?' + suffix : ''}`}
                      >
                        <div className="em-catalogue-card-photo">
                          <CataloguePhoto
                            url={product.imageUrl}
                            alt={product.name}
                            sizes="(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 25vw"
                          />
                        </div>
                        <div className="em-catalogue-card-copy">
                          <p>
                            {product.unit || 'Pack size not specified'}
                            {product.brand ? ` · ${product.brand}` : ''}
                          </p>
                          <h3>
                            {product.name}
                            <ArrowRight size={16} aria-hidden="true" />
                          </h3>
                          <p className="em-catalogue-card-price">
                            {formatGBP(product.pricePence)}{' '}
                            <span>sample price</span>
                          </p>
                          <p>
                            {availabilityLabels[product.availabilityStatus]} ·
                            sample status
                          </p>
                          <p className="em-catalogue-card-review">
                            {product.merchantReviewedDemo
                              ? 'Shopkeeper review recorded'
                              : 'No shopkeeper review recorded'}
                          </p>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
              <nav
                className="em-catalogue-pagination"
                aria-label="Catalogue pages"
              >
                <button
                  type="button"
                  disabled={catalogue.data.page <= 1}
                  onClick={() => filters(q, category, catalogue.data.page - 1)}
                >
                  <ArrowLeft size={17} aria-hidden="true" />
                  Previous
                </button>
                <span aria-live="polite">
                  Page {catalogue.data.page} of {catalogue.data.pages}
                </span>
                <button
                  type="button"
                  disabled={catalogue.data.page >= catalogue.data.pages}
                  onClick={() => filters(q, category, catalogue.data.page + 1)}
                >
                  Next
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </nav>
            </>
          ) : (
            <div className="em-catalogue-empty">
              <h3>No sample products found.</h3>
              <p>Try another name, alias or category.</p>
              <button
                className="em-catalogue-button"
                onClick={() => filters('', '')}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
