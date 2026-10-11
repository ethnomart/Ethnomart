import { useReveal } from '@/lib/use-reveal';
import { Link } from 'wouter';
import { ArrowUpRight } from 'lucide-react';
import { ReferenceHero } from '@/components/home/reference-hero';
import { ReferenceIntro } from '@/components/home/reference-intro';
import {
  ConceptPhoto,
  ItemGrid,
  QueryState,
  SectionHeading,
} from '@/components/platform';
import {
  useMeta,
  usePlatform,
  usePageMeta,
  type PlatformPage,
} from '@/lib/platform-api';
export default function Home() {
  const reveal = useReveal<HTMLDivElement>();
  usePageMeta(
    'Your culture. Your neighbourhood.',
    'Discover groceries, cultural clothing, communities, events and local opportunities in the EthnoMart sample preview.',
  );
  const meta = useMeta(),
    events = usePlatform<PlatformPage>('/search?kind=event&pageSize=3'),
    jobs = usePlatform<PlatformPage>('/search?kind=job&pageSize=3');
  const destinations = [
    {
      title: 'Groceries',
      image: 'destination-groceries',
      href: '/shops?businessKind=grocery',
      copy: 'Familiar ingredients and independent shops. Start with the shelves you know.',
    },
    {
      title: 'Clothing & textiles',
      image: 'clothing',
      href: '/clothing',
      copy: 'Everyday pieces, cultural dress and fabrics that carry a little history.',
    },
    {
      title: 'Communities',
      image: 'community',
      href: '/communities',
      copy: 'Shared interests, local stories and a place to feel connected.',
    },
    {
      title: 'Events',
      image: 'events',
      href: '/events',
      copy: 'Craft tables, cultural markets and reasons to meet your neighbours.',
    },
    {
      title: 'Jobs & opportunities',
      image: 'work',
      href: '/jobs',
      copy: 'Explore local roles and possibilities. Every background is welcome.',
    },
  ];
  return (
    <div ref={reveal}>
      <ReferenceHero />
      <ReferenceIntro />
      <section
        data-em-reveal
        id="explore-ethnomart"
        className="em-m-home-section"
      >
        <SectionHeading
          eyebrow="One neighbourhood. Many possibilities."
          title="Find what brings you closer."
          copy="From a familiar ingredient to a new connection. Choose a starting point and make it your own."
        />
        <div className="em-m-destinations">
          {destinations.map((d) => (
            <Link
              data-em-reveal
              className="em-m-destination"
              href={d.href}
              key={d.title}
            >
              <ConceptPhoto name={d.image} />
              <div>
                <h3>
                  {d.title}
                  <ArrowUpRight size={23} aria-hidden="true" />
                </h3>
                <p>{d.copy}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section
        data-em-reveal
        id="communities"
        tabIndex={-1}
        className="em-m-home-section em-m-home-section--soft"
      >
        <SectionHeading
          eyebrow="Everyone belongs somewhere."
          title="A culture to explore. A community to discover."
          copy="Browse any hub, wherever you come from. Community labels describe shared interests; they never limit who can join."
          href="/communities"
          label="All communities"
        />
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
                <small>Shops · Activities · Stories</small>
              </div>
              <ArrowUpRight size={21} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <section data-em-reveal className="em-m-home-section">
        <SectionHeading
          eyebrow="Make room for something new."
          title="Good things happen together."
          copy="Try the sample event journey, from finding an activity to adding it to your calendar."
          href="/events"
          label="Explore events"
        />
        <QueryState
          loading={events.isLoading}
          error={events.error}
          retry={() => void events.refetch()}
        />
        {events.data && <ItemGrid items={events.data.items} />}
      </section>
      <section data-em-reveal className="em-m-home-section">
        <div className="em-m-home-banner">
          <ConceptPhoto
            name="opportunities"
            sizes="(max-width: 700px) 100vw, 50vw"
          />
          <div>
            <p className="em-m-eyebrow">A next step, close to home.</p>
            <h2>
              Local work.
              <br />
              New possibilities.
            </h2>
            <p>
              Discover opportunities with neighbourhood businesses and community
              teams. Try the sample roles and application journey while we
              prepare real employer onboarding.
            </p>
            <Link className="em-m-button" href="/jobs">
              Explore opportunities
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div style={{ marginTop: 30 }}>
          <QueryState
            loading={jobs.isLoading}
            error={jobs.error}
            retry={() => void jobs.refetch()}
          />
          {jobs.data && !jobs.isError && <ItemGrid items={jobs.data.items} />}
        </div>
      </section>
      <section
        data-em-reveal
        id="how-it-works"
        className="em-m-home-section em-m-home-section--soft"
      >
        <SectionHeading
          eyebrow="Built around people."
          title="Your shop. Your story. Your community."
          copy="Have a grocery or clothing business? Try the existing merchant review process. Organisers and employers can also submit sample content for review."
        />
        <div className="em-m-actions">
          <Link className="em-m-button" href="/for-businesses">
            For businesses
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Link className="em-m-button em-m-button--outline" href="/contribute">
            Share an activity or opportunity
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Link className="em-m-link" href="/how-it-works">
            How EthnoMart works
          </Link>
        </div>
      </section>
    </div>
  );
}
