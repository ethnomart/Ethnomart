import { Link, useLocation } from 'wouter';
import { ConceptPhoto, PreviewNote } from '@/components/platform';
import { SampleResponse } from '@/components/participation';
import { usePageMeta } from '@/lib/platform-api';
const pages: Record<
  string,
  {
    title: string;
    intro: string;
    sections: { heading: string; copy: string }[];
  }
> = {
  '/about': {
    title: 'Culture, close to home.',
    intro:
      'EthnoMart is being built to connect multicultural neighbourhoods through familiar businesses, cultural clothing, community activity and local opportunities.',
    sections: [
      {
        heading: 'One place to start.',
        copy: 'Discover grocery and clothing shops, browse community hubs, find activities and explore local roles. Anyone can explore any community. The platform is intended to make useful local information easier to find.',
      },
      {
        heading: 'Built in a small team.',
        copy: 'The project has a UK team member and a four-person team in Pakistan. The current site is a sample demonstration; its sample businesses, jobs and events are fictional. It does not demonstrate existing partners or achieved traction.',
      },
      {
        heading: 'Start small. Learn from real use.',
        copy: 'The next real pilot needs an agreed UK city, permitted business and organiser information, accurate operating policies and supported production services. Merchant publication and manager review can already be tried in this preview.',
      },
    ],
  },
  '/how-it-works': {
    title: 'Find. Connect. Contribute.',
    intro:
      'A clear route from discovering something familiar to adding something useful to your neighbourhood.',
    sections: [
      {
        heading: '01 · Choose your starting point.',
        copy: 'Search across shops, clothing, communities, events and jobs. Filter by city and shared interests. Those filters describe listings; they do not determine your identity or eligibility.',
      },
      {
        heading: '02 · Look a little closer.',
        copy: 'Open a catalogue, garment, hub, event or role. Save items or follow communities on this device. Sample calendar downloads and response forms let you try the journey without a booking or real application.',
      },
      {
        heading: '03 · Share something useful.',
        copy: 'Submit fictional activities, opportunities or notices to the manager queue. Content stays private until reviewed. Clothing and grocery merchants use invitation-only shop workspaces and review their products before publication.',
      },
      {
        heading: '04 · Keep information clear.',
        copy: 'Current managers can hide content and review reports with recorded reasons. Paused shops and blocked products disappear from public catalogue results. Real launch requires verified content, production hosting and an agreed operator.',
      },
    ],
  },
  '/privacy': {
    title: 'Privacy in this sample preview.',
    intro:
      'Provisional information for the current demonstration, updated 11 October 2026. A real operator and production policy must be agreed before public launch.',
    sections: [
      {
        heading: 'What stays in your browser.',
        copy: 'Saved item identifiers and followed community identifiers are stored in localStorage. Clear them from Saved discoveries. Sign-in uses an HttpOnly session cookie with a maximum 24-hour lifetime. Logging out destroys the session.',
      },
      {
        heading: 'What is saved for review.',
        copy: 'Fictional contact names, .invalid email addresses, messages, content submissions, reports and merchant requests are stored in a private database on the hosting server. Authorised managers can see the private queues. No email delivery, payment processing, CV collection or marketing signup is configured.',
      },
      {
        heading: 'Use sample information only.',
        copy: 'Do not submit actual personal information, passport or visa details, home addresses, payment data or CVs. Browsing a community is not treated as a declaration of ethnicity. AI concept photos do not identify actual participants or partners.',
      },
      {
        heading: 'Review and removal.',
        copy: 'This preview has no verified external privacy contact or automated retention schedule. Ask the project owner to review or remove sample records. Backups may retain earlier copies. Before any real launch the operator must define contact, retention, deletion, service providers and applicable notices.',
      },
    ],
  },
  '/terms': {
    title: 'A clear sample preview.',
    intro:
      'Provisional preview-use information, updated 11 October 2026. This is not a final agreement for a public marketplace.',
    sections: [
      {
        heading: 'What you can try.',
        copy: 'Browse sample catalogues, cultural clothing, communities, events and jobs. Test fictional responses and contributions. Sample forms create sample receipts and do not email a real business, organiser or employer.',
      },
      {
        heading: 'Sample content and imagery.',
        copy: 'Listings and prices are fictional demonstration records. AI concept photos are illustrative and are not evidence of actual shops, products, attendance or partnerships. No real purchase, delivery, ticket, employment offer, sponsorship or visa outcome is promised.',
      },
      {
        heading: 'Contribution and moderation.',
        copy: 'Use fictional details and .invalid contact addresses only. Submit appropriate plain-text sample content without personal information or unsupported claims. Contributions require manager review. Managers may hide content and record moderation reasons; draft and blocked catalogue products are not public.',
      },
      {
        heading: 'Before real launch.',
        copy: 'The team must confirm the legal operator, domain, customer and merchant terms, permitted real content, privacy responsibilities and production services. Those decisions are not inferred from this working sample website.',
      },
    ],
  },
  '/contact': {
    title: 'Help shape EthnoMart.',
    intro:
      'Try the sample contact journey with a fictional message. Your sample is stored for the manager; it is not emailed externally.',
    sections: [
      {
        heading: 'Have a business or activity?',
        copy: 'Use the merchant trial for a sample grocery or clothing shop. Use Contribute for a sample event, job or community notice. No real enrollment or employer onboarding is open through this preview.',
      },
    ],
  },
};
export default function Information() {
  const [path] = useLocation(),
    page = pages[path] || pages['/about'];
  usePageMeta(page.title, page.intro);
  return (
    <div className="em-m-page">
      <PreviewNote />
      <p className="em-m-eyebrow">
        {path === '/privacy' || path === '/terms'
          ? 'Preview information'
          : 'About the neighbourhood'}
      </p>
      <h1>{page.title}</h1>
      <p className="em-m-lead">{page.intro}</p>
      {path === '/about' && (
        <div style={{ marginTop: 30 }}>
          <ConceptPhoto
            className="em-m-detail-photo"
            name="our-story"
            eager
            sizes="(max-width: 1280px) 100vw, 1200px"
          />
          <p className="em-m-small">
            AI concept image · fictional neighbourhood businesses.
          </p>
        </div>
      )}
      <div className={path === '/contact' ? 'em-m-detail-grid' : 'em-m-prose'}>
        <div className="em-m-prose">
          {page.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              <p>{s.copy}</p>
            </section>
          ))}
          <div className="em-m-actions">
            <Link className="em-m-button" href="/explore">
              Explore EthnoMart
            </Link>
            <Link className="em-m-link" href="/contribute">
              Contribute
            </Link>
            <Link className="em-m-link" href="/for-businesses">
              For businesses
            </Link>
          </div>
        </div>
        {path === '/contact' && <SampleResponse kind="contact" />}
      </div>
    </div>
  );
}
