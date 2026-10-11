import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ArrowUpRight } from 'lucide-react';
import { ReportForm } from '@/components/participation';
import {
  ConceptPhoto,
  ItemGrid,
  PreviewNote,
  QueryState,
  SectionHeading,
} from '@/components/platform';
import {
  useMeta,
  usePlatform,
  usePageMeta,
  usePreferences,
  type PlatformItem,
} from '@/lib/platform-api';
type Hub = {
  community: { id: number; name: string; description: string; image: string };
  shops: PlatformItem[];
  clothing: PlatformItem[];
  events: PlatformItem[];
  jobs: PlatformItem[];
  notices: PlatformItem[];
};
export default function CommunityPage({
  legacySlug,
}: { legacySlug?: string } = {}) {
  const [, matchedRoute] = useRoute('/community/:slug'),
    route = legacySlug ? { slug: legacySlug } : matchedRoute,
    meta = useMeta(),
    hub = usePlatform<Hub>(
      `/communities/${encodeURIComponent(route?.slug || '')}`,
      !!route?.slug,
    ),
    follow = usePreferences(true),
    [message, setMessage] = useState('');
  usePageMeta(
    route?.slug
      ? `${hub.data?.community.name || 'Community'} hub`
      : 'Communities',
    'Explore multicultural community hubs with shops, cultural clothing, activities and local opportunities.',
  );
  if (!route?.slug)
    return (
      <div className="em-m-page">
        <PreviewNote />
        <p className="em-m-eyebrow">Many cultures. Shared neighbourhoods.</p>
        <h1>Find a little connection.</h1>
        <p className="em-m-lead">
          Explore any community. Follow your interests, discover familiar places
          and make space for new stories.
        </p>
        <ConceptPhoto
          className="em-m-detail-photo"
          name="community-directory"
          eager
          sizes="(max-width: 1280px) 100vw, 1200px"
        />
        <p className="em-m-small">
          AI concept image · not a photograph of a real community group.
        </p>
        <QueryState
          loading={meta.isLoading}
          error={meta.error}
          retry={() => void meta.refetch()}
        />
        <div className="em-m-community-grid">
          {meta.data?.communities.map((c) => (
            <Link
              className="em-m-community-tile"
              href={`/community/${c.slug}`}
              key={c.id}
            >
              <ConceptPhoto
                name={c.image}
                className="em-m-community-thumb"
                sizes="80px"
              />
              <div>
                <h3>{c.name}</h3>
                <small>
                  {follow.ids.includes(`community:${c.id}`)
                    ? 'Following on this device'
                    : 'Open to everyone'}
                </small>
              </div>
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    );
  const c = hub.data?.community;
  return (
    <div className="em-m-page">
      <PreviewNote />
      <Link className="em-m-link" href="/communities">
        All communities
      </Link>
      <QueryState
        loading={hub.isLoading}
        error={hub.error}
        retry={() => void hub.refetch()}
      />
      {c && !hub.isError && (
        <>
          <p className="em-m-eyebrow">A shared place to start.</p>
          <h1>
            {c.name} culture.
            <br />
            Local connections.
          </h1>
          <p className="em-m-lead">
            {c.description} Everyone is welcome to explore this hub.
          </p>
          <ConceptPhoto
            name={c.image}
            className="em-m-hub-cover"
            eager
            sizes="(max-width: 1280px) 100vw, 1200px"
          />
          <p className="em-m-small">
            AI concept photo · not a real community group.
          </p>
          <div className="em-m-follow">
            <button
              className="em-m-button em-m-button--outline"
              aria-pressed={follow.ids.includes(`community:${c.id}`)}
              onClick={() =>
                setMessage(
                  follow.toggle(`community:${c.id}`)
                    ? 'Preference updated on this device.'
                    : 'Your browser could not save this preference.',
                )
              }
            >
              {follow.ids.includes(`community:${c.id}`)
                ? 'Following on this device'
                : 'Follow on this device'}
            </button>
            {message && (
              <p className="em-m-small" role="status">
                {message}
              </p>
            )}
          </div>
          {(['shops', 'clothing', 'events', 'jobs', 'notices'] as const).map(
            (type) => (
              <section id={type} key={type} style={{ marginTop: 55 }}>
                <SectionHeading
                  eyebrow={
                    type === 'notices'
                      ? 'Shared stories'
                      : 'Discover the neighbourhood'
                  }
                  title={
                    type === 'shops'
                      ? 'Familiar shops.'
                      : type === 'clothing'
                        ? 'Clothing with a story.'
                        : type === 'events'
                          ? 'Come together.'
                          : type === 'jobs'
                            ? 'A next possibility.'
                            : 'Community noticeboard.'
                  }
                  href={
                    type === 'notices'
                      ? '/contribute?kind=notice'
                      : `/${type}?community=${c.id}`
                  }
                  label={
                    type === 'notices'
                      ? 'Share a sample notice'
                      : 'Explore this view'
                  }
                />
                {hub.data![type].length ? (
                  type === 'notices' ? (
                    hub.data!.notices.map((n) => (
                      <article className="em-m-state" key={n.id}>
                        <p className="em-m-eyebrow">Reviewed sample notice</p>
                        <h3>{n.title}</h3>
                        <p>{n.description}</p>
                        <ReportForm id={n.id} />
                      </article>
                    ))
                  ) : (
                    <ItemGrid items={hub.data![type]} />
                  )
                ) : (
                  <p className="em-m-state">
                    No published sample {type} in this hub yet.
                  </p>
                )}
              </section>
            ),
          )}
        </>
      )}
    </div>
  );
}
