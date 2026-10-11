import { Link } from 'wouter';
import { ItemGrid, PreviewNote, QueryState } from '@/components/platform';
import {
  usePageMeta,
  usePlatform,
  usePreferences,
  type PlatformItem,
} from '@/lib/platform-api';
export default function Saved() {
  const saved = usePreferences(),
    query = usePlatform<{ items: PlatformItem[]; unavailable: string[] }>(
      `/saved?keys=${encodeURIComponent(saved.ids.join(','))}`,
    ),
    follow = usePreferences(true);
  usePageMeta(
    'Saved discoveries',
    'Manage saved public listings and followed communities on this device.',
  );
  return (
    <div className="em-m-page">
      <PreviewNote />
      <p className="em-m-eyebrow">A few things to come back to.</p>
      <h1>Your discoveries, saved.</h1>
      <p className="em-m-lead">
        Bookmarks and community follows stay in this browser. They are not
        shared with your account or other devices.
      </p>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {query.data && !query.isError && (
        <>
          <div className="em-m-actions">
            <button
              disabled={!saved.ids.length}
              className="em-m-button em-m-button--outline"
              onClick={() => saved.clear()}
            >
              Clear saved items
            </button>
            <Link className="em-m-link" href="/explore">
              Find something new
            </Link>
          </div>
          {query.data.items.length ? (
            <ItemGrid items={query.data.items} />
          ) : (
            <div className="em-m-state">
              <h2>Room for a new discovery.</h2>
              <p>Save a shop, garment, event or job to find it here.</p>
            </div>
          )}
          {query.data.unavailable.map((id) => (
            <div className="em-m-state" key={id}>
              <p>A saved item is no longer public or available.</p>
              <button className="em-m-link" onClick={() => saved.toggle(id)}>
                Remove unavailable item
              </button>
            </div>
          ))}
        </>
      )}
      <div className="em-m-state">
        <h2>Community follows</h2>
        <p>{follow.ids.length} followed on this device.</p>
        <div className="em-m-actions">
          <Link className="em-m-link" href="/communities">
            Manage follows
          </Link>
          <button
            className="em-m-link"
            disabled={!follow.ids.length}
            onClick={() => follow.clear()}
          >
            Clear follows
          </button>
        </div>
      </div>
    </div>
  );
}
