import type { DatabaseSync } from 'node:sqlite';
import { communities } from './fixtures.ts';

// Version 3 adds content and fictional clothing samples; no existing record is rewritten.
export function migratePlatform(db: DatabaseSync) {
  const version = String(
    db.prepare("SELECT value FROM local_meta WHERE key='schema_version'").get()
      ?.value,
  );
  if (version === '3') return;
  if (version !== '2')
    throw new Error('Unsupported multicultural schema version.');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`
      ALTER TABLE local_applications ADD COLUMN kind TEXT NOT NULL DEFAULT 'grocery' CHECK(kind IN ('grocery','clothing'));
      CREATE TABLE local_content (id INTEGER PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('event','job','notice')),slug TEXT NOT NULL UNIQUE,payload TEXT NOT NULL CHECK(json_valid(payload)),state TEXT NOT NULL CHECK(state IN ('pending','published','hidden')),revision INTEGER NOT NULL CHECK(revision>0),request_key TEXT UNIQUE,submitter TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL) STRICT;
      CREATE INDEX local_content_state_kind ON local_content(state,kind,id);
      CREATE TABLE local_responses (id INTEGER PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('event_interest','job_application','contact')),content_id INTEGER REFERENCES local_content(id),request_key TEXT NOT NULL UNIQUE,payload TEXT NOT NULL CHECK(json_valid(payload)),created_at TEXT NOT NULL) STRICT;
      CREATE TABLE local_content_reports (id INTEGER PRIMARY KEY,content_id INTEGER NOT NULL REFERENCES local_content(id),request_key TEXT NOT NULL UNIQUE,reason TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('open','resolved')),revision INTEGER NOT NULL CHECK(revision>0),created_at TEXT NOT NULL) STRICT;
      CREATE TABLE local_content_history (id INTEGER PRIMARY KEY,entity TEXT NOT NULL CHECK(entity IN ('content','report')),entity_id INTEGER NOT NULL,actor_id INTEGER NOT NULL REFERENCES local_users(id),decision TEXT NOT NULL,reason TEXT NOT NULL,at TEXT NOT NULL) STRICT;
    `);
    const at = new Date().toISOString();
    const owner = db
      .prepare("SELECT id FROM local_users WHERE id=3 AND role='store_owner'")
      .get();
    if (owner) {
      for (const [index, name, communityId, cityId] of [
        [0, 'Sample Threads & Traditions', 1, 1],
        [1, 'Sample Woven Stories', 2, 3],
        [2, 'Sample Heritage Studio', 6, 2],
      ] as const) {
        const id = Number(
          db
            .prepare('SELECT COALESCE(MAX(id),0)+1 AS id FROM local_shops')
            .get()!.id,
        );
        const profile = {
          id,
          ownerId: 3,
          name,
          slug: `sample-clothing-${id}`,
          kind: 'clothing',
          description: 'A fictional clothing business for the local preview.',
          communityId,
          cityId,
          category: 'Clothing',
          address: '',
          subscriptionTier: 'basic',
          isApproved: true,
          averageRating: null,
          reviewCount: 0,
          createdAt: at,
          imageUrl: '/images/multicultural/clothing-960.webp',
        };
        db.prepare('INSERT INTO local_shops VALUES(?,3,1,?)').run(
          id,
          JSON.stringify(profile),
        );
        db.prepare(
          "INSERT INTO local_shop_controls VALUES(?,'active',1,NULL,?)",
        ).run(id, at);
        for (const [offset, name, category, sizes, fabric, price] of [
          [
            0,
            'Sample embroidered tunic',
            'Traditional wear',
            'S, M, L',
            'Cotton blend',
            '38.00',
          ],
          [
            1,
            'Sample woven shawl',
            'Scarves & accessories',
            'One size',
            'Cotton',
            '24.00',
          ],
          [
            2,
            'Sample everyday kurta',
            'Everyday clothing',
            'M, L, XL',
            'Cotton',
            '32.00',
          ],
        ] as const) {
          const productId = Number(
            db
              .prepare('SELECT COALESCE(MAX(id),0)+1 AS id FROM local_fixtures')
              .get()!.id,
          );
          const product = {
            id: productId,
            storeId: id,
            name,
            description:
              'Illustrative garment information and price; this is not an item available to order.',
            category,
            sizes,
            fabric,
            priceGbp: price,
            unit: '1 pcs',
            inStock: false,
            availabilityStatus: 'unknown',
            imageUrl: '/images/multicultural/clothing-640.webp',
            createdAt: at,
            isDemo: true,
          };
          db.prepare('INSERT INTO local_fixtures VALUES(?,?,?)').run(
            productId,
            id,
            JSON.stringify(product),
          );
        }
      }
    }
    const items = [
      {
        kind: 'event',
        slug: 'neighbourhood-craft-table',
        title: 'Neighbourhood craft table',
        summary: 'A sample afternoon of pottery, weaving and conversation.',
        description:
          'Explore the kind of relaxed community workshop EthnoMart could help you discover. This fictional listing is for testing; there is no real organiser, venue booking or ticket.',
        communityId: 1,
        cityId: 1,
        category: 'Workshop',
        organiser: 'Sample community organiser',
        venue: 'Sample community space · no real address',
        startsAt: '2026-11-21T14:00:00.000Z',
        endsAt: '2026-11-21T16:00:00.000Z',
        accessibility:
          'Example: step-free access to be checked with the organiser before any real publication.',
        image: 'community',
      },
      {
        kind: 'event',
        slug: 'woven-stories-market',
        title: 'Woven stories market',
        summary:
          'A sample gathering around cultural textiles and handmade craft.',
        description:
          'A fictional market concept featuring clothing, craft and local conversation. All cultures are welcome. Details illustrate the browsing and calendar journey; no actual event is being advertised.',
        communityId: 2,
        cityId: 3,
        category: 'Market',
        organiser: 'Sample market team',
        venue: 'Sample courtyard · no real address',
        startsAt: '2026-11-28T11:00:00.000Z',
        endsAt: '2026-11-28T15:00:00.000Z',
        accessibility: 'Access information has not been verified.',
        image: 'events',
      },
      {
        kind: 'event',
        slug: 'tea-and-local-stories',
        title: 'Tea & local stories',
        summary:
          'A sample evening for meeting neighbours and exchanging ideas.',
        description:
          'Try a community meet-up listing. This is fictional and creates no reservation. In a real pilot the organiser would confirm the location, access and contact arrangements first.',
        communityId: 6,
        cityId: 2,
        category: 'Meet-up',
        organiser: 'Sample neighbourhood group',
        venue: 'Sample meeting room · no real address',
        startsAt: '2026-12-05T17:00:00.000Z',
        endsAt: '2026-12-05T19:00:00.000Z',
        accessibility: 'Access information has not been verified.',
        image: 'community',
      },
      {
        kind: 'job',
        slug: 'sample-shop-assistant',
        title: 'Shop assistant',
        summary:
          'A fictional role supporting customers and an independent shop.',
        description:
          'Example responsibilities: welcome customers, organise shelves and keep simple product records. This is a sample vacancy for testing the application journey, not a real employer or employment offer. Pay, hours and eligibility would require an actual employer before publication.',
        communityId: 1,
        cityId: 1,
        category: 'Retail',
        organisation: 'Sample neighbourhood shop',
        employmentType: 'Part-time',
        requirements:
          'Example: clear communication and attention to detail. Open to applicants from any background.',
        closesAt: '2026-12-31T23:59:00.000Z',
        image: 'work',
      },
      {
        kind: 'job',
        slug: 'sample-community-coordinator',
        title: 'Community coordinator',
        summary:
          'A fictional role helping a small team organise local activities.',
        description:
          'Example responsibilities: coordinate enquiries, prepare activity information and support organisers. No real vacancy, salary, visa sponsorship or hiring commitment is represented here.',
        communityId: 6,
        cityId: 2,
        category: 'Community support',
        organisation: 'Sample community team',
        employmentType: 'Full-time',
        requirements:
          'Example: organisation, written communication and inclusive customer service.',
        closesAt: '2026-12-31T23:59:00.000Z',
        image: 'work',
      },
      ...communities.map((c) => ({
        kind: 'notice',
        slug: `welcome-${c.slug}`,
        title: `Welcome to the ${c.name} hub`,
        summary: 'A shared place for shops, stories and local possibilities.',
        description:
          'This sample noticeboard shows how reviewed community information can sit beside local businesses, events and jobs. Anyone can explore any hub. Contribute a fictional notice to try the manager review process.',
        communityId: c.id,
        cityId: 1,
        category: 'Community notice',
        image: 'community',
      })),
    ];
    for (const item of items)
      db.prepare(
        "INSERT INTO local_content(kind,slug,payload,state,revision,created_at,updated_at) VALUES(?,?,?,'published',1,?,?)",
      ).run(item.kind, item.slug, JSON.stringify(item), at, at);
    db.prepare(
      "UPDATE local_meta SET value='3' WHERE key='schema_version'",
    ).run();
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
