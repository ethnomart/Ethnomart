import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, RefreshCw, Copy, ArrowRight } from 'lucide-react';
import { ManagerUnavailable, ReasonAction } from '@/components/pilot-manager';
import {
  onboardingRequest,
  useManagerOverview,
  usePilotRefresh,
  localInvitationUrl,
  type PilotApplication,
} from '@/lib/onboarding-api';
import { formatConfirmation } from '@/lib/merchant-listings';
import '@/styles/pilot-onboarding.css';

function RequestCard({
  application,
  onChanged,
}: {
  application: PilotApplication;
  onChanged: (
    id: number,
    invitation?: { path: string; expiresAt: string },
  ) => void;
}) {
  const refresh = usePilotRefresh();
  const [action, setAction] = useState<'reject' | 'revoke' | null>(null);
  const decision = useMutation({
    mutationFn: ({ kind, reason }: { kind: string; reason?: string }) =>
      onboardingRequest<{ invitation?: { path: string; expiresAt: string } }>(
        `/onboarding/requests/${application.id}/${kind}`,
        'POST',
        {
          expectedRevision: application.revision,
          ...(reason ? { reason } : {}),
        },
      ),
    onSuccess: (result) => {
      setAction(null);
      onChanged(application.id, result.invitation);
      refresh();
    },
  });
  return (
    <article className="em-pilot-request-card">
      <div className="em-pilot-request-top">
        <div>
          <p className="em-pilot-eyebrow">Request EM-{application.id}</p>
          <h3>{application.shopName}</h3>
          <p>
            {application.cityName} · {application.communityName} ·{' '}
            {application.kind === 'clothing'
              ? 'Clothing & textiles'
              : 'Groceries'}
          </p>
        </div>
        <span className={`em-pilot-state em-pilot-state--${application.state}`}>
          {application.state === 'approved' ? 'Invited' : application.state}
        </span>
      </div>
      <div className="em-pilot-request-contact">
        <span>{application.ownerName}</span>
        <span>{application.email}</span>
        <span>Received {formatConfirmation(application.createdAt)} (UK)</span>
      </div>
      {application.reason && (
        <p className="em-pilot-decision-reason">{application.reason}</p>
      )}
      {application.invitation && application.state === 'approved' && (
        <p className="em-pilot-small">
          {application.invitation.revoked
            ? 'Invitation cancelled.'
            : application.invitation.expired
              ? 'Invitation expired.'
              : `Invitation expires ${formatConfirmation(application.invitation.expiresAt)} (UK).`}{' '}
          No email has been sent.
        </p>
      )}
      {decision.isError && (
        <p className="em-pilot-error" role="alert">
          {decision.error.message}
        </p>
      )}
      {action ? (
        <ReasonAction
          label={
            action === 'reject'
              ? 'Reason for declining this request'
              : 'Reason for cancelling this invitation'
          }
          button={action === 'reject' ? 'Decline request' : 'Cancel invitation'}
          busy={decision.isPending}
          onCancel={() => setAction(null)}
          onSubmit={(reason) => decision.mutate({ kind: action, reason })}
        />
      ) : (
        <div className="em-pilot-actions">
          {application.state === 'pending' && (
            <>
              <button
                className="em-pilot-button"
                disabled={decision.isPending}
                onClick={() => decision.mutate({ kind: 'approve' })}
              >
                {decision.isPending
                  ? 'Creating invitation…'
                  : 'Approve & invite'}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                className="em-pilot-text-link"
                disabled={decision.isPending}
                onClick={() => {
                  decision.reset();
                  setAction('reject');
                }}
              >
                Decline
              </button>
            </>
          )}
          {application.state === 'approved' && (
            <>
              <button
                className="em-pilot-button em-pilot-button--outline"
                disabled={decision.isPending}
                onClick={() => decision.mutate({ kind: 'reissue' })}
              >
                {decision.isPending ? 'Creating link…' : 'Reissue invitation'}
              </button>
              {!application.invitation?.revoked && (
                <button
                  className="em-pilot-text-link"
                  disabled={decision.isPending}
                  onClick={() => {
                    decision.reset();
                    setAction('revoke');
                  }}
                >
                  Cancel invitation
                </button>
              )}
            </>
          )}
          {application.shopId && (
            <Link
              className="em-pilot-text-link"
              href={`/admin/merchant-pilot/shops/${application.shopId}`}
            >
              Manage assigned shop <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
export default function ManagerPilotPage() {
  const query = useManagerOverview(),
    [tab, setTab] = useState<'requests' | 'shops'>('requests'),
    [filter, setFilter] = useState('pending'),
    [issued, setIssued] = useState<{
      id: number;
      path: string;
      expiresAt: string;
    } | null>(null),
    [copyMessage, setCopyMessage] = useState(''),
    [showLink, setShowLink] = useState(false);
  useEffect(() => {
    document.title = 'Merchant trial manager | EthnoMart';
  }, []);
  if (query.isLoading)
    return (
      <div className="em-pilot-page" role="status">
        Loading the local merchant trial…
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
  const { applications, shops } = query.data;
  const shown = applications.filter(
    (item) => filter === 'all' || item.state === filter,
  );
  return (
    <div className="em-pilot-page em-pilot-manager-page">
      <Link className="em-pilot-text-link" href="/admin/community">
        Community content review <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
      <div className="em-pilot-demo">
        Local manager · Fictional shops and requests · Changes saved on this
        computer
      </div>
      <header className="em-pilot-manager-heading">
        <div>
          <p className="em-pilot-eyebrow">Merchant trial</p>
          <h1>
            Good shops.
            <br />A clear start.
          </h1>
          <p>
            Review a request, invite its operator and keep its catalogue in good
            order.
          </p>
        </div>
        <div className="em-pilot-actions">
          <button
            className="em-pilot-button em-pilot-button--outline"
            disabled={query.isFetching}
            onClick={() => {
              void query.refetch();
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
          <Link className="em-pilot-text-link" href="/pilot/apply">
            New sample request <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <div className="em-pilot-manager-counts">
        <div>
          <span>Waiting for review</span>
          <strong>
            {applications.filter((item) => item.state === 'pending').length}
          </strong>
          <small>Sample shop requests</small>
        </div>
        <div>
          <span>Open invitations</span>
          <strong>
            {
              applications.filter(
                (item) =>
                  item.state === 'approved' &&
                  item.invitation &&
                  !item.invitation.revoked &&
                  !item.invitation.expired,
              ).length
            }
          </strong>
          <small>Approved, not yet accepted</small>
        </div>
        <div>
          <span>Active shops</span>
          <strong>
            {shops.filter((item) => item.state === 'active').length}
          </strong>
          <small>Fictional catalogue shops</small>
        </div>
      </div>
      {issued &&
        !applications.find((item) => item.id === issued.id)?.invitation
          ?.revoked &&
        !applications.find((item) => item.id === issued.id)?.invitation
          ?.used && (
          <div className="em-pilot-link-ready">
            <h4>Invitation ready.</h4>
            <p>
              Open or copy it for this fictional local trial. The full link is
              shown only when created.
            </p>
            <div className="em-pilot-actions">
              <button
                className="em-pilot-button em-pilot-button--outline"
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      localInvitationUrl(issued.path),
                    );
                    setCopyMessage('Invitation link copied.');
                  } catch {
                    setShowLink(true);
                    setCopyMessage('Select and copy the link below.');
                  }
                }}
              >
                <Copy size={16} aria-hidden="true" />
                Copy invitation link
              </button>
              <Link className="em-pilot-text-link" href={issued.path}>
                Open invitation <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {copyMessage && <p role="status">{copyMessage}</p>}
            {showLink && (
              <input
                aria-label="Invitation link"
                readOnly
                value={localInvitationUrl(issued.path)}
                onFocus={(event) => event.currentTarget.select()}
              />
            )}
          </div>
        )}
      <div
        className="em-pilot-manager-tabs"
        role="navigation"
        aria-label="Merchant trial views"
      >
        <button
          aria-pressed={tab === 'requests'}
          aria-controls="manager-requests"
          id="requests-tab"
          onClick={() => setTab('requests')}
        >
          Shop requests <span>{applications.length}</span>
        </button>
        <button
          aria-pressed={tab === 'shops'}
          aria-controls="manager-shops"
          id="shops-tab"
          onClick={() => setTab('shops')}
        >
          Manage shops <span>{shops.length}</span>
        </button>
      </div>
      {query.isError && (
        <p className="em-pilot-error" role="alert">
          {query.error.message}
        </p>
      )}
      {tab === 'requests' ? (
        <section aria-labelledby="requests-tab" id="manager-requests">
          <div className="em-pilot-manager-list-heading">
            <h2>
              {filter === 'all'
                ? 'All requests'
                : filter === 'pending'
                  ? 'Ready for your review.'
                  : filter === 'approved'
                    ? 'Invited shops.'
                    : 'Completed requests.'}
            </h2>
            <label>
              Request state
              <select
                aria-label="Filter requests"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="pending">Waiting for review</option>
                <option value="approved">Invited</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Declined</option>
                <option value="all">All requests</option>
              </select>
            </label>
          </div>
          {shown.length ? (
            <div className="em-pilot-request-grid">
              {shown.map((item) => (
                <RequestCard
                  key={item.id}
                  application={item}
                  onChanged={(id, invitation) => {
                    setCopyMessage('');
                    setShowLink(false);
                    if (invitation) {
                      setIssued({ id, ...invitation });
                      setFilter('approved');
                    } else
                      setIssued((current) =>
                        current?.id === id ? null : current,
                      );
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="em-pilot-empty">
              <h3>No requests in this view.</h3>
              <p>
                Submitted sample requests appear here for a manager’s decision.
              </p>
              <Link className="em-pilot-text-link" href="/pilot/apply">
                Try a sample shop request{' '}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      ) : (
        <section aria-labelledby="shops-tab" id="manager-shops">
          <div className="em-pilot-manager-list-heading">
            <h2>Keep the catalogue clear.</h2>
            <p>Shop status overrides its product listings.</p>
          </div>
          <div className="em-pilot-shop-list">
            {shops.map((shop) => (
              <article key={shop.id}>
                <div>
                  <h3>{shop.name}</h3>
                  <p>
                    {shop.cityName} · {shop.communityName}
                  </p>
                </div>
                <span
                  className={`em-pilot-state em-pilot-state--${shop.state}`}
                >
                  {shop.state}
                </span>
                <Link
                  className="em-pilot-text-link"
                  href={`/admin/merchant-pilot/shops/${shop.id}`}
                >
                  Manage shop <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
