import { Link, useRoute } from 'wouter';
import {
  ConceptPhoto,
  PreviewNote,
  QueryState,
  SaveButton,
} from '@/components/platform';
import { ReportForm, SampleResponse } from '@/components/participation';
import {
  londonTime,
  usePageMeta,
  usePlatform,
  type PlatformItem,
} from '@/lib/platform-api';
export default function ContentDetail() {
  const [event, e] = useRoute('/events/:slug'),
    [, j] = useRoute('/jobs/:slug'),
    kind = event ? 'event' : 'job',
    slug = e?.slug || j?.slug || '',
    query = usePlatform<PlatformItem>(
      `/${event ? 'events' : 'jobs'}/${encodeURIComponent(slug)}`,
    ),
    item = query.data;
  usePageMeta(
    item?.title || 'Listing',
    item?.summary || 'Explore a sample EthnoMart listing.',
  );
  const ended =
    item && Date.parse(event ? item.endsAt! : item.closesAt!) < Date.now();
  return (
    <div className="em-m-page">
      <PreviewNote />
      <Link className="em-m-link" href={event ? '/events' : '/jobs'}>
        Back to {event ? 'events' : 'opportunities'}
      </Link>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {item && !query.isError && (
        <>
          <p className="em-m-eyebrow" style={{ marginTop: 30 }}>
            {item.category} · {item.cityName} · Sample {kind}
          </p>
          <h1>{item.title}</h1>
          <p className="em-m-lead">{item.summary}</p>
          <div className="em-m-actions">
            <SaveButton item={item} />
            {event && (
              <a
                className="em-m-button em-m-button--outline"
                href={`${import.meta.env.BASE_URL}api/platform/events/${encodeURIComponent(slug)}/calendar`}
                download
              >
                Download sample calendar entry
              </a>
            )}
          </div>
          <div className="em-m-detail-grid">
            <div>
              <ConceptPhoto
                className="em-m-detail-photo"
                name={item.image}
                alt={'Illustrative sample ' + kind}
                eager
                sizes="(max-width: 850px) 100vw, 66vw"
              />
              <p className="em-m-small">
                AI concept image · this does not depict the listed sample {kind}
                .
              </p>
              <dl className="em-m-facts">
                {(event
                  ? [
                      [
                        'When',
                        `${londonTime(item.startsAt!)} – ${londonTime(item.endsAt!)} (UK time)`,
                      ],
                      ['Where', item.venue],
                      ['Sample organiser', item.organiser],
                      ['Community interest', item.communityName],
                    ]
                  : [
                      ['Sample employer', item.organisation],
                      ['Employment type', item.employmentType],
                      [
                        'Closing date',
                        `${londonTime(item.closesAt!)} (UK time)`,
                      ],
                      [
                        'Pay & sponsorship',
                        'Not provided. No real employment or sponsorship offer.',
                      ],
                    ]
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <h2>{event ? 'About this activity' : 'About this role'}</h2>
              <p className="em-m-detail-copy">{item.description}</p>
              <h2>{event ? 'Access information' : 'Example requirements'}</h2>
              <p>{event ? item.accessibility : item.requirements}</p>
              <p className="em-m-small">
                Open to all backgrounds. A community label is an interest
                filter.
              </p>
              <ReportForm key={item.id} id={item.id} />
            </div>
            {ended ? (
              <div className="em-m-state">
                <h2>This sample listing has ended.</h2>
                <p>
                  New responses are closed. Browse current sample listings
                  instead.
                </p>
                <Link
                  href={event ? '/events' : '/jobs'}
                  className="em-m-button"
                >
                  Explore current listings
                </Link>
              </div>
            ) : (
              <SampleResponse
                key={`${kind}:${item.id}`}
                kind={event ? 'event_interest' : 'job_application'}
                contentId={item.id}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
