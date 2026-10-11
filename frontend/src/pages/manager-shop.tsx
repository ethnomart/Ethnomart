import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, Package } from 'lucide-react';
import { ManagerUnavailable, ReasonAction } from '@/components/pilot-manager';
import { CataloguePhoto } from '@/components/catalogue-photo';
import {
  onboardingRequest,
  useManagerShop,
  usePilotRefresh,
  type ModeratedListing,
} from '@/lib/onboarding-api';
import {
  formatConfirmation,
  formatGBP,
  priceInPence,
} from '@/lib/merchant-listings';
import '@/styles/pilot-onboarding.css';

function ManagedListingCard({ listing }: { listing: ModeratedListing }) {
  const refresh = usePilotRefresh(),
    [editing, setEditing] = useState(false);
  const blocked = listing.moderation.blocked;
  const mutation = useMutation({
    mutationFn: (reason: string) =>
      onboardingRequest(
        `/onboarding/listings/${listing.id}/moderation`,
        'POST',
        {
          blocked: !blocked,
          expectedRevision: listing.revision,
          expectedBlockRevision: listing.moderation.revision,
          reason,
        },
      ),
    onSuccess: () => {
      setEditing(false);
      refresh();
    },
  });
  const pence = priceInPence(listing.price);
  return (
    <article className="em-pilot-managed-listing">
      <div className="em-pilot-managed-listing-main">
        <div className="em-pilot-managed-photo">
          {listing.hasPhoto ? (
            <CataloguePhoto
              url={`/api/onboarding/listings/${listing.id}/photo`}
              alt={listing.name}
            />
          ) : (
            <Package size={27} aria-hidden="true" />
          )}
        </div>
        <div className="em-pilot-managed-listing-copy">
          <h3>{listing.name}</h3>
          <p>
            {listing.brand && `${listing.brand} · `}
            {listing.pack} · {pence ? formatGBP(pence) : 'Price to add'}
          </p>
          <small>
            Saved {listing.state} · Version {listing.revision}
          </small>
        </div>
        <span
          className={`em-pilot-state em-pilot-state--${blocked ? 'blocked' : listing.state}`}
        >
          {blocked ? 'blocked' : listing.state}
        </span>
        <button
          className="em-pilot-text-link"
          onClick={() => {
            mutation.reset();
            setEditing(true);
          }}
          disabled={mutation.isPending}
        >
          {blocked ? 'Review block' : 'Block product'}
        </button>
      </div>
      {blocked && (
        <p className="em-pilot-moderation-note">
          Manager block: {listing.moderation.reason}
        </p>
      )}
      {mutation.isError && (
        <p className="em-pilot-error" role="alert">
          {mutation.error.message}
        </p>
      )}
      {editing && (
        <ReasonAction
          label={
            blocked
              ? `Reason for releasing ${listing.name}`
              : `Reason for blocking ${listing.name}`
          }
          button={blocked ? 'Release manager block' : 'Block product'}
          busy={mutation.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(reason) => mutation.mutate(reason)}
        />
      )}
    </article>
  );
}
export default function ManagerShopPage() {
  const [, params] = useRoute('/admin/merchant-pilot/shops/:id');
  const id = Number(params?.id),
    query = useManagerShop(id),
    refresh = usePilotRefresh();
  const [action, setAction] = useState(false);
  const mutation = useMutation({
    mutationFn: (reason: string) =>
      onboardingRequest(`/onboarding/shops/${id}/state`, 'POST', {
        state: query.data?.shop.state === 'active' ? 'suspended' : 'active',
        expectedRevision: query.data?.shop.revision,
        reason,
      }),
    onSuccess: () => {
      setAction(false);
      refresh();
    },
  });
  useEffect(() => {
    document.title = `${query.data?.shop.name || 'Shop'} · Trial manager | EthnoMart`;
  }, [query.data?.shop.name]);
  if (query.isLoading)
    return (
      <div className="em-pilot-page" role="status">
        Loading the shop’s trial record…
      </div>
    );
  if (!query.data)
    return (
      <div className="em-pilot-page">
        <ManagerUnavailable
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      </div>
    );
  const { shop, listings, events } = query.data;
  const active = shop.state === 'active';
  return (
    <div className="em-pilot-page em-pilot-manager-shop">
      <Link className="em-pilot-back" href="/admin/merchant-pilot">
        <ArrowLeft size={17} aria-hidden="true" />
        Back to merchant trial
      </Link>
      <div className="em-pilot-demo">
        Local manager · Catalogue visibility and recorded decisions
      </div>
      <header className="em-pilot-manager-heading">
        <div>
          <p className="em-pilot-eyebrow">Sample shop {shop.id}</p>
          <h1>{shop.name}</h1>
          <p>
            A manager block stays in place when the merchant edits a product.
          </p>
        </div>
        <span className={`em-pilot-state em-pilot-state--${shop.state}`}>
          {shop.state}
        </span>
      </header>
      {query.isError && (
        <p className="em-pilot-error" role="alert">
          {query.error.message} Refresh the saved version to try again.
        </p>
      )}
      <section className="em-pilot-shop-control">
        <div>
          <h2>
            {active
              ? 'An active sample catalogue.'
              : shop.state === 'pending'
                ? 'Waiting for activation.'
                : 'This shop is suspended.'}
          </h2>
          <p>
            {active
              ? 'Reviewed products can appear to visitors, unless individually blocked.'
              : 'The shop, its product details and its public photos are unavailable. Draft work can continue.'}
          </p>
          {shop.reason && (
            <p className="em-pilot-moderation-note">
              Latest decision: {shop.reason}
            </p>
          )}
        </div>
        <div className="em-pilot-actions">
          {active && (
            <Link className="em-pilot-text-link" href={`/store/${id}`}>
              View sample catalogue{' '}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          )}
          <button
            className="em-pilot-button em-pilot-button--outline"
            onClick={() => {
              mutation.reset();
              setAction(true);
            }}
            disabled={mutation.isPending}
          >
            {active
              ? 'Suspend shop'
              : shop.state === 'pending'
                ? 'Activate shop'
                : 'Reactivate shop'}
          </button>
        </div>
        {mutation.isError && (
          <p className="em-pilot-error" role="alert">
            {mutation.error.message}
          </p>
        )}
        {action && (
          <ReasonAction
            label={
              active
                ? 'Reason for suspending this shop'
                : 'Reason for activating this shop'
            }
            button={active ? 'Suspend sample shop' : 'Activate sample shop'}
            busy={mutation.isPending}
            onCancel={() => setAction(false)}
            onSubmit={(reason) => mutation.mutate(reason)}
          />
        )}
      </section>
      <section
        className="em-pilot-managed-products"
        aria-labelledby="managed-products-heading"
      >
        <div className="em-pilot-manager-list-heading">
          <h2 id="managed-products-heading">Workspace products</h2>
          <button
            className="em-pilot-text-link"
            onClick={() => {
              void query.refetch();
            }}
          >
            Refresh saved versions
          </button>
        </div>
        <p className="em-pilot-small">
          Only merchant workspace products are listed here. Starter fixtures are
          separate. Releasing a block does not publish a draft.
        </p>
        {listings.length ? (
          <div>
            {listings.map((listing) => (
              <ManagedListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="em-pilot-empty">
            <Package size={32} aria-hidden="true" />
            <h3>No workspace products yet.</h3>
            <p>
              The invited operator can add the first sample draft from their
              workspace.
            </p>
          </div>
        )}
      </section>
      <section className="em-pilot-audit" aria-labelledby="pilot-audit-heading">
        <h2 id="pilot-audit-heading">A record of the decisions.</h2>
        <p className="em-pilot-small">
          Latest 40 shop and product moderation actions. Product review history
          remains in the merchant workflow.
        </p>
        {events.length ? (
          <ol>
            {events.map((event) => (
              <li key={event.id}>
                <div>
                  <strong>
                    {event.kind} ·{' '}
                    {event.entity === 'listing'
                      ? `Product ${event.entityId}`
                      : 'Shop'}
                  </strong>
                  <p>{event.reason}</p>
                </div>
                <small>
                  {event.actor} · {formatConfirmation(event.at)} (UK)
                </small>
              </li>
            ))}
          </ol>
        ) : (
          <p>No manager changes recorded for this shop.</p>
        )}
      </section>
    </div>
  );
}
