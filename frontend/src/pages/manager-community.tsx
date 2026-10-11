import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import {
  platformRequest,
  usePageMeta,
  type PlatformItem,
} from '@/lib/platform-api';
import { PreviewNote, QueryState } from '@/components/platform';
type ReviewItem = PlatformItem & {
  submitter?: { name: string; email: string } | null;
};
type Report = {
  id: number;
  content_id: number;
  reason: string;
  state: string;
  revision: number;
  created_at: string;
};
type Overview = {
  content: ReviewItem[];
  responses: {
    id: number;
    kind: string;
    contentId: number | null;
    name: string;
    email: string;
    message: string;
    receivedAt: string;
  }[];
  reports: Report[];
  history: {
    id: number;
    entity: string;
    entity_id: number;
    actor_id: number;
    decision: string;
    reason: string;
    at: string;
  }[];
};
function Decision({
  entity,
  id,
  revision,
  state,
  onDone,
}: {
  entity: 'content' | 'report';
  id: number;
  revision: number;
  state: string;
  onDone: () => void;
}) {
  const [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <div className="em-m-decision">
      <label className="em-m-field">
        Decision reason
        <textarea
          minLength={5}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
        />
      </label>
      <div className="em-m-actions">
        {(entity === 'report'
          ? ['resolved']
          : state === 'published'
            ? ['hidden']
            : ['published', 'hidden']
        )
          .filter((s) => s !== state)
          .map((s) => (
            <button
              className="em-m-button em-m-button--outline"
              key={s}
              disabled={busy || reason.trim().length < 5}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await platformRequest(
                    `/manager/${entity === 'report' ? 'reports' : 'content'}/${id}`,
                    'POST',
                    { state: s, reason, expectedRevision: revision },
                  );
                  setReason('');
                  onDone();
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : 'Decision could not be saved.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy
                ? 'Saving…'
                : s === 'published'
                  ? 'Publish sample'
                  : s === 'hidden'
                    ? 'Hide sample'
                    : 'Resolve report'}
            </button>
          ))}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export default function ManagerCommunity() {
  const user = useAuthStore((s) => s.user),
    client = useQueryClient(),
    query = useQuery({
      queryKey: ['platform-manager', user?.id],
      queryFn: ({ signal }) =>
        platformRequest<Overview>('/manager', 'GET', undefined, signal),
      retry: false,
    }),
    [tab, setTab] = useState('content'),
    [filter, setFilter] = useState('pending');
  usePageMeta(
    'Community manager',
    'Review local sample content, responses and reports.',
  );
  const refresh = () => {
    void query.refetch();
    void client.invalidateQueries({ queryKey: ['platform'] });
  };
  return (
    <div className="em-m-page">
      <PreviewNote />
      <p className="em-m-eyebrow">Authorised local manager</p>
      <h1>Keep the neighbourhood clear.</h1>
      <p className="em-m-lead">
        Review complete sample listings before publication. Private contact
        details and responses stay in this workspace.
      </p>
      <div className="em-m-actions">
        <Link className="em-m-link" href="/admin/merchant-pilot">
          Merchant review
        </Link>
        <button className="em-m-button em-m-button--outline" onClick={refresh}>
          Refresh
        </button>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={refresh}
      />
      {query.isError && (
        <p>
          <Link className="em-m-link" href="/login">
            Sign in
          </Link>{' '}
          · Manager access requires the existing local access procedure.
        </p>
      )}
      {query.data && !query.isError && (
        <>
          <nav className="em-m-manager-tabs" aria-label="Manager views">
            {['content', 'responses', 'reports', 'history'].map((t) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)} (
                {query.data![t as keyof Overview].length})
              </button>
            ))}
          </nav>
          {tab === 'content' && (
            <>
              <label className="em-m-field" style={{ maxWidth: 250 }}>
                Content state
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {['pending', 'published', 'hidden', 'all'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              {query.data.content.filter(
                (i) => filter === 'all' || i.state === filter,
              ).length ? (
                query.data.content
                  .filter((i) => filter === 'all' || i.state === filter)
                  .map((i) => (
                    <article className="em-m-manager-row" key={i.id}>
                      <div>
                        <p className="em-m-eyebrow">
                          {i.kind} · {i.state} · Revision {i.revision} · #{i.id}
                        </p>
                        <h3>{i.title}</h3>
                        <p>{i.summary}</p>
                        <p style={{ whiteSpace: 'pre-line' }}>
                          {i.description}
                        </p>
                        <p className="em-m-small">
                          {i.cityName} · {i.communityName} · {i.category}
                        </p>
                        {Object.entries(i)
                          .filter(([k]) =>
                            [
                              'startsAt',
                              'endsAt',
                              'closesAt',
                              'venue',
                              'organiser',
                              'accessibility',
                              'organisation',
                              'employmentType',
                              'requirements',
                            ].includes(k),
                          )
                          .map(([k, v]) => (
                            <p className="em-m-small" key={k}>
                              {k}: {String(v)}
                            </p>
                          ))}
                        {i.submitter && (
                          <p className="em-m-small">
                            Private sample contact: {i.submitter.name} ·{' '}
                            {i.submitter.email}
                          </p>
                        )}
                        {i.state === 'published' && (
                          <Link className="em-m-link" href={i.href}>
                            Open public sample
                          </Link>
                        )}
                      </div>
                      <Decision
                        entity="content"
                        id={i.id}
                        revision={i.revision}
                        state={i.state!}
                        onDone={refresh}
                      />
                    </article>
                  ))
              ) : (
                <div className="em-m-state">
                  No sample content in this state.
                </div>
              )}
            </>
          )}
          {tab === 'responses' && (
            <>
              {query.data.responses.length ? (
                query.data.responses.map((r) => (
                  <article className="em-m-state" key={r.id}>
                    <p className="em-m-eyebrow">
                      ER-{r.id} · {r.kind} · Listing {r.contentId || 'Contact'}
                    </p>
                    <h3>{r.name}</h3>
                    <p>{r.email}</p>
                    <p style={{ whiteSpace: 'pre-line' }}>{r.message}</p>
                    <p className="em-m-small">
                      {r.receivedAt} · private fictional response
                    </p>
                  </article>
                ))
              ) : (
                <p className="em-m-state">No sample responses yet.</p>
              )}
            </>
          )}
          {tab === 'reports' && (
            <>
              {query.data.reports.length ? (
                query.data.reports.map((r) => (
                  <article className="em-m-manager-row" key={r.id}>
                    <div>
                      <p className="em-m-eyebrow">
                        EP-{r.id} · Listing {r.content_id} · {r.state}
                      </p>
                      <p>{r.reason}</p>
                    </div>
                    {r.state === 'open' && (
                      <Decision
                        entity="report"
                        id={r.id}
                        revision={r.revision}
                        state={r.state}
                        onDone={refresh}
                      />
                    )}
                  </article>
                ))
              ) : (
                <p className="em-m-state">No sample reports yet.</p>
              )}
            </>
          )}
          {tab === 'history' && (
            <>
              {query.data.history.length ? (
                query.data.history.map((h) => (
                  <article className="em-m-state" key={h.id}>
                    <p>
                      {h.entity} #{h.entity_id} · {h.decision} · actor #
                      {h.actor_id}
                    </p>
                    <p>{h.reason}</p>
                    <p className="em-m-small">{h.at}</p>
                  </article>
                ))
              ) : (
                <p className="em-m-state">No manager decisions recorded yet.</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
