import { useEffect, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, Plus, Package, Search } from 'lucide-react';
import { WorkspaceAccess } from '@/components/merchant/workspace-access';
import {
  merchantRequest,
  useMerchantShops,
  useMerchantListings,
  useRefreshMerchantCatalogue,
} from '@/lib/merchant-api';
import {
  formatGBP,
  priceInPence,
  formatConfirmation,
  type MerchantListing,
} from '@/lib/merchant-listings';
import '@/styles/merchant-workspace.css';
import '@/styles/pilot-onboarding.css';

export default function MerchantPage() {
  const search = useSearch();
  const shopsQuery = useMerchantShops();
  const requestedShop = Number(new URLSearchParams(search).get('shop'));
  const shop = requestedShop
    ? shopsQuery.data?.find((item) => item.id === requestedShop)
    : shopsQuery.data?.[0];
  const storeId = shop?.id || 0;
  const listingsQuery = useMerchantListings(storeId, !!shop);
  const refresh = useRefreshMerchantCatalogue();
  const [term, setTerm] = useState('');
  const [state, setState] = useState('all');
  const pause = useMutation({
    mutationFn: (listing: MerchantListing) =>
      merchantRequest(`/merchant/listings/${listing.id}/pause`, 'POST', {
        expectedRevision: listing.revision,
      }),
    onSuccess: () => refresh(storeId),
  });
  useEffect(() => {
    document.title = 'Merchant catalogue demo | EthnoMart';
  }, []);
  useEffect(() => {
    setTerm('');
    setState('all');
    pause.reset();
  }, [storeId]);

  if (shopsQuery.isLoading)
    return (
      <p className="em-merchant-loading" role="status">
        Opening the catalogue workspace…
      </p>
    );
  if (shopsQuery.isError)
    return (
      <WorkspaceAccess
        error={shopsQuery.error}
        retry={() => {
          void shopsQuery.refetch();
        }}
      />
    );
  if (!shop)
    return (
      <div className="em-merchant-access">
        <h1>No assigned sample shop</h1>
        <p>This account has no workspace for that shop.</p>
        <Link className="em-merchant-button" href="/merchant">
          Open assigned workspace
        </Link>
      </div>
    );
  const listings = listingsQuery.data || [];
  const filtered = listings.filter(
    (listing) =>
      (state === 'all' ||
        (state === 'blocked'
          ? listing.moderation?.blocked
          : listing.state === state &&
            !(state === 'published' && listing.moderation?.blocked))) &&
      [listing.fields.name, listing.fields.brand, listing.fields.aliases]
        .join(' ')
        .normalize('NFKC')
        .toLowerCase()
        .includes(term.trim().normalize('NFKC').toLowerCase()),
  );

  return (
    <div className="em-merchant-page">
      <div className="em-merchant-demo-note">
        Local demo · Sample shop · Use sample products only. Catalogue changes
        are saved on this computer.
      </div>
      <div className="em-merchant-title-row">
        <div>
          <p className="em-merchant-eyebrow">Shopkeeper workspace</p>
          <h1>Your catalogue.</h1>
          <p className="em-merchant-shop-name">{shop.name}</p>
        </div>
        <div className="em-merchant-title-actions">
          <Link className="em-merchant-text-link" href={`/store/${storeId}`}>
            View sample catalogue <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <Link
            className="em-merchant-button"
            href={`/merchant/products/new?shop=${storeId}`}
          >
            <Plus size={18} aria-hidden="true" />
            Add product
          </Link>
        </div>
      </div>
      {!shop.isApproved && (
        <p className="em-merchant-notice" role="status">
          This shop is {shop.status || 'paused'}. You can save drafts, but
          publication is unavailable.{' '}
          {shop.moderationReason &&
            `Manager reason: ${shop.moderationReason}`}{' '}
        </p>
      )}
      <div className="em-merchant-counts" aria-label="Workspace product counts">
        {(['draft', 'published', 'paused'] as const).map((value, index) => (
          <button
            className={`em-merchant-count em-merchant-count--${index}`}
            key={value}
            type="button"
            aria-pressed={state === value}
            onClick={() =>
              setState((current) => (current === value ? 'all' : value))
            }
          >
            <span>
              {value === 'draft'
                ? 'Drafts'
                : value === 'published'
                  ? 'Published'
                  : 'Paused'}
            </span>
            <strong>
              {listingsQuery.isLoading || listingsQuery.isError
                ? '—'
                : listings.filter(
                    (item) =>
                      item.state === value &&
                      !(value === 'published' && item.moderation?.blocked),
                  ).length}
            </strong>
            <small>
              {value === 'draft'
                ? 'Waiting for your review'
                : value === 'published'
                  ? 'Visible in the sample catalogue'
                  : 'Hidden from the catalogue'}
            </small>
          </button>
        ))}
      </div>
      <section aria-labelledby="em-workspace-products-heading">
        <div className="em-merchant-list-heading">
          <h2 id="em-workspace-products-heading">Workspace products</h2>
          <p className="em-merchant-small">
            Starter sample products in the public catalogue are separate from
            this workspace.
          </p>
        </div>
        <div className="em-merchant-list-filters">
          <div>
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Search workspace products"
              type="search"
              placeholder="Search name, brand or other names"
              value={term}
              maxLength={100}
              onChange={(event) => setTerm(event.target.value)}
            />
          </div>
          <select
            aria-label="Filter by publication state"
            value={state}
            onChange={(event) => setState(event.target.value)}
          >
            <option value="all">All states</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
            <option value="blocked">Blocked by manager</option>
          </select>
        </div>
        {pause.isError && (
          <p className="em-merchant-error" role="alert">
            {pause.error.message}
          </p>
        )}
        {pause.isSuccess && (
          <p className="em-merchant-feedback" role="status">
            Product paused. It is hidden from the sample catalogue.
          </p>
        )}
        {listingsQuery.isLoading ? (
          <p className="em-merchant-empty" role="status">
            Loading workspace products…
          </p>
        ) : listingsQuery.isError ? (
          <div className="em-merchant-empty" role="alert">
            <h3>The products couldn’t load</h3>
            <p>Please try again.</p>
            <button
              type="button"
              className="em-merchant-button"
              onClick={() => {
                void listingsQuery.refetch();
              }}
            >
              Try again
            </button>
          </div>
        ) : !listings.length ? (
          <div className="em-merchant-empty">
            <Package size={38} strokeWidth={1.3} aria-hidden="true" />
            <h3>Start with one product.</h3>
            <p>
              Add a photo or enter the details manually. Save a draft and review
              it before publishing.
            </p>
            <Link
              className="em-merchant-button"
              href={`/merchant/products/new?shop=${storeId}`}
            >
              Add your first sample product{' '}
              <Plus size={17} aria-hidden="true" />
            </Link>
          </div>
        ) : !filtered.length ? (
          <div className="em-merchant-empty">
            <h3>No products match these filters</h3>
            <button
              type="button"
              className="em-merchant-text-link"
              onClick={() => {
                setTerm('');
                setState('all');
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="em-merchant-product-list">
            {filtered.map((listing) => (
              <li key={listing.id}>
                <div className="em-merchant-product-photo">
                  {listing.fields.imageDataUrl ? (
                    <img
                      src={listing.fields.imageDataUrl}
                      width={64}
                      height={64}
                      alt=""
                    />
                  ) : (
                    <Package size={25} strokeWidth={1.3} aria-hidden="true" />
                  )}
                </div>
                <div className="em-merchant-product-identity">
                  <h3>{listing.fields.name || 'Untitled draft'}</h3>
                  <p>
                    {listing.fields.brand && `${listing.fields.brand} · `}
                    {listing.fields.packAmount
                      ? `${listing.fields.packAmount} ${listing.fields.packUnit}`
                      : 'Pack size to add'}
                  </p>
                  {listing.moderation?.blocked && (
                    <p className="em-pilot-merchant-block">
                      {listing.moderation.reason} · Editing does not clear this
                      block.
                    </p>
                  )}
                </div>
                <span
                  className={`em-merchant-status em-merchant-status--${listing.state}${listing.moderation?.blocked ? ' em-pilot-merchant-block-badge' : ''}`}
                >
                  {listing.moderation?.blocked
                    ? 'Manager block'
                    : listing.state[0].toUpperCase() + listing.state.slice(1)}
                </span>
                <div className="em-merchant-product-price">
                  <strong>
                    {priceInPence(listing.fields.price)
                      ? formatGBP(priceInPence(listing.fields.price)!)
                      : 'Price to add'}
                  </strong>
                  <small>
                    Confirmed: {formatConfirmation(listing.confirmedAt)}
                  </small>
                </div>
                <div className="em-merchant-product-actions">
                  <Link
                    href={`/merchant/products/${listing.id}/edit?shop=${storeId}`}
                  >
                    Edit / review
                  </Link>
                  {listing.state === 'published' && (
                    <button
                      type="button"
                      disabled={pause.isPending}
                      onClick={() => pause.mutate(listing)}
                    >
                      Pause
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
