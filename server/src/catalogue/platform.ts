import {
  sampleShopPhoto,
  samplePhotoUrl,
  sampleContentPhoto,
  sampleCommunityPhoto,
} from './visual-assets.ts';
import { normalizeSearch } from './search.ts';
import { randomUUID } from 'node:crypto';
import { PilotError, type PilotActor } from './domain.ts';
import { cities, communities } from './fixtures.ts';
import type { LocalCatalogueStore } from './store.ts';
import { OnboardingService } from './onboarding.ts';

type Row = Record<string, string | number | null>;
type Payload = {
  title: string;
  summary: string;
  description: string;
  category: string;
  cityId: number;
  communityId: number;
  image: string;
  startsAt?: string;
  endsAt?: string;
  closesAt?: string;
  venue?: string;
  organiser?: string;
  accessibility?: string;
  organisation?: string;
  employmentType?: string;
  requirements?: string;
};
const aliases: Record<string, string> = {
  pakistan: 'pakistani',
  india: 'indian',
  bangladesh: 'bangladeshi',
  nepal: 'nepali',
};
export const communitySlug = (slug: string) => aliases[slug] || slug;
function body(input: unknown, allowed: string[]) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new PilotError(400, 'Request details are required.');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some((k) => !allowed.includes(k)))
    throw new PilotError(400, 'Unsupported request field.');
  return value;
}
function text(value: unknown, name: string, min: number, max: number) {
  if (
    typeof value !== 'string' ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new PilotError(422, `Check ${name}: use ${min}–${max} characters.`);
  return value.trim();
}
function key(value: unknown) {
  const result = text(value, 'request reference', 8, 80);
  if (!/^[A-Za-z0-9-]+$/.test(result))
    throw new PilotError(400, 'Invalid request reference.');
  return result;
}
function fictional(value: Record<string, unknown>) {
  const name = text(value.name, 'sample name', 2, 100),
    email = text(value.email, 'sample email', 5, 254).toLowerCase();
  if (
    value.sampleOnly !== true ||
    !/^[a-z0-9._+-]+@(?:[a-z0-9-]+\.)+invalid$/.test(email)
  )
    throw new PilotError(
      422,
      'Use fictional details and a sample .invalid email address.',
    );
  return { name, email };
}
function date(value: unknown, name: string) {
  const raw = text(value, name, 20, 30);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(raw) ||
    !Number.isFinite(Date.parse(raw)) ||
    new Date(raw).toISOString().slice(0, 19) !== raw.slice(0, 19)
  )
    throw new PilotError(422, `Choose a valid ${name}.`);
  return new Date(raw).toISOString();
}
export class PlatformService {
  private store: LocalCatalogueStore;
  constructor(store: LocalCatalogueStore) {
    this.store = store;
  }
  private transaction<T>(operation: () => T) {
    this.store.db.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      this.store.db.exec('COMMIT');
      return result;
    } catch (e) {
      this.store.db.exec('ROLLBACK');
      throw e;
    }
  }
  private row(id: number) {
    const row = this.store.db
      .prepare('SELECT * FROM local_content WHERE id=?')
      .get(id) as Row | undefined;
    if (!row) throw new PilotError(404, 'This sample listing is unavailable.');
    return row;
  }
  private dto(row: Row) {
    const p = JSON.parse(String(row.payload)) as Payload;
    return {
      ...p,
      image: sampleContentPhoto(String(row.kind), String(row.slug)),
      id: Number(row.id),
      kind: String(row.kind),
      slug: String(row.slug),
      state: String(row.state),
      revision: Number(row.revision),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      cityName: cities.find((c) => c.id === p.cityId)?.name,
      communityName: communities.find((c) => c.id === p.communityId)?.name,
      isDemo: true as const,
      href: `/${row.kind === 'notice' ? 'community' : row.kind === 'job' ? 'jobs' : 'events'}/${row.kind === 'notice' ? communitySlug(communities.find((c) => c.id === p.communityId)?.slug || '') : row.slug}`,
    };
  }
  meta() {
    return {
      cities,
      communities: communities.map((c) => ({
        ...c,
        slug: communitySlug(c.slug),
        image: sampleCommunityPhoto(communitySlug(c.slug)),
        imageUrl: samplePhotoUrl(sampleCommunityPhoto(communitySlug(c.slug))),
        description: `Explore ${c.name} culture, businesses and local activities.`,
        isDemo: true,
      })),
      categories: {
        event: ['Workshop', 'Market', 'Meet-up'],
        job: ['Retail', 'Community support'],
        clothing: [
          'Traditional wear',
          'Everyday clothing',
          'Scarves & accessories',
        ],
      },
      isDemo: true,
    };
  }
  contents() {
    return this.store.db
      .prepare(
        "SELECT * FROM local_content WHERE state='published' ORDER BY id",
      )
      .all()
      .map((row) => this.dto(row as Row));
  }
  detail(kind: string, slug: string) {
    const row = this.store.db
      .prepare(
        "SELECT * FROM local_content WHERE kind=? AND slug=? AND state='published'",
      )
      .get(kind, slug) as Row | undefined;
    if (!row) throw new PilotError(404, 'This sample listing is unavailable.');
    return this.dto(row);
  }
  search(input: Record<string, unknown>, all = false) {
    const get = (name: string) =>
      input[name] === undefined ? '' : text(input[name], name, 0, 100);
    const businessKind = get('businessKind');
    if (businessKind && !['grocery', 'clothing'].includes(businessKind))
      throw new PilotError(400, 'Choose a valid business type.');
    const q = normalizeSearch(get('q')),
      kind = get('kind'),
      city = get('city'),
      community = get('community'),
      category = get('category'),
      when = get('when'),
      employmentType = get('employmentType');
    if (
      kind &&
      ![
        'shop',
        'grocery',
        'clothing',
        'community',
        'event',
        'job',
        'notice',
      ].includes(kind)
    )
      throw new PilotError(400, 'Choose a valid type.');
    if (city && !cities.some((c) => String(c.id) === city))
      throw new PilotError(400, 'Choose a valid city.');
    if (
      community &&
      !communities.some(
        (c) =>
          String(c.id) === community ||
          communitySlug(c.slug) === community ||
          c.slug === community,
      )
    )
      throw new PilotError(400, 'Choose a valid community.');
    if (when && !['upcoming', 'past', 'all'].includes(when))
      throw new PilotError(400, 'Choose a valid date range.');
    const communityId = communities.find(
      (c) =>
        String(c.id) === community ||
        communitySlug(c.slug) === community ||
        c.slug === community,
    )?.id;
    let items: Array<Record<string, unknown>> = [];
    if (!kind || ['shop', 'grocery', 'clothing'].includes(kind))
      for (const shop of this.store.shops().filter((s) => s.isApproved)) {
        const clothing = shop.kind === 'clothing';
        if (
          businessKind &&
          (clothing ? 'clothing' : 'grocery') !== businessKind
        )
          continue;
        if (kind === 'grocery' && clothing) continue;
        if (kind !== 'clothing' && kind !== 'grocery')
          items.push({
            ...this.store.publicShop(shop.id),
            key: `shop:${shop.id}`,
            kind: 'shop',
            businessKind: clothing ? 'clothing' : 'grocery',
            title: shop.name,
            summary: clothing
              ? 'Cultural clothing and textiles · sample shop'
              : 'Packaged groceries · sample shop',
            image: sampleShopPhoto(shop.name) || '',
            href: `/store/${shop.id}`,
          });
        if (!kind || (clothing ? kind === 'clothing' : kind === 'grocery'))
          for (const p of this.store.publicProducts(shop.id))
            items.push({
              ...p,
              key: `${clothing ? 'clothing' : 'grocery'}:${p.id}`,
              kind: clothing ? 'clothing' : 'grocery',
              title: p.name,
              summary: clothing
                ? `${p.sizes || 'Sizing not supplied'} · ${p.fabric || 'Fabric not supplied'} · sample garment`
                : `${p.unit || 'Pack size not supplied'} · ${shop.name} · sample product`,
              cityId: shop.cityId,
              communityId: shop.communityId,
              cityName: cities.find((c) => c.id === shop.cityId)?.name,
              communityName: communities.find((c) => c.id === shop.communityId)
                ?.name,
              image: '',
              href: `/store/${shop.id}/product/${p.id}`,
            });
      }
    if (!kind || kind === 'community')
      for (const c of this.meta().communities)
        items.push({
          ...c,
          key: `community:${c.id}`,
          kind: 'community',
          communityId: c.id,
          title: `${c.name} community`,
          summary: c.description,
          image: c.image,
          href: `/community/${c.slug}`,
        });
    for (const c of this.contents())
      if ((!kind && c.kind !== 'notice') || kind === c.kind)
        items.push({ ...c, key: `${c.kind}:${c.id}` });
    items = items.filter(
      (i) =>
        (!city || String(i.cityId) === city) &&
        (!community || i.communityId === communityId) &&
        (!category || i.category === category) &&
        (!employmentType || i.employmentType === employmentType) &&
        (!q ||
          normalizeSearch(
            [
              i.title,
              i.summary,
              i.category,
              i.cityName,
              i.communityName,
              i.brand,
              ...(Array.isArray(i.aliases) ? i.aliases : []),
            ].join(' '),
          ).includes(q)),
    );
    if (kind === 'event') {
      items = items
        .filter(
          (i) =>
            when === 'all' ||
            (when === 'past'
              ? Date.parse(String(i.endsAt)) < Date.now()
              : Date.parse(String(i.endsAt)) >= Date.now()),
        )
        .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
    }
    if (kind === 'job')
      items = items.filter((i) =>
        when === 'past'
          ? Date.parse(String(i.closesAt)) < Date.now()
          : when === 'all' || Date.parse(String(i.closesAt)) >= Date.now(),
      );
    const page = input.page === undefined ? 1 : Number(get('page')),
      pageSize = input.pageSize === undefined ? 12 : Number(get('pageSize'));
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 10000 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 24
    )
      throw new PilotError(400, 'Choose a valid page.');
    return {
      items: all ? items : items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize),
      isDemo: true,
    };
  }
  saved(raw: unknown) {
    const value =
        raw === undefined ? '' : text(raw, 'saved identifiers', 0, 5000),
      ids = value ? value.split(',') : [];
    if (
      ids.length > 200 ||
      ids.some(
        (id) => !/^(shop|grocery|clothing|event|job|community):\d+$/.test(id),
      )
    )
      throw new PilotError(400, 'Invalid saved identifiers.');
    const all = this.search({ when: 'all' }, true).items;
    return {
      items: ids.flatMap((id) =>
        all.find((i) => i.key === id) ? [all.find((i) => i.key === id)!] : [],
      ),
      unavailable: ids.filter((id) => !all.some((i) => i.key === id)),
    };
  }
  community(slug: string) {
    const c = this.meta().communities.find(
      (c) => c.slug === communitySlug(slug),
    );
    if (!c) throw new PilotError(404, 'Community not found.');
    return {
      community: c,
      shops: this.search({
        kind: 'shop',
        community: String(c.id),
        pageSize: '24',
      }).items,
      clothing: this.search({
        kind: 'clothing',
        community: String(c.id),
        pageSize: '24',
      }).items,
      events: this.search({ kind: 'event', community: String(c.id) }).items,
      jobs: this.search({ kind: 'job', community: String(c.id) }).items,
      notices: this.search({ kind: 'notice', community: String(c.id) }).items,
    };
  }
  respond(input: unknown) {
    const b = body(input, [
        'kind',
        'contentId',
        'name',
        'email',
        'message',
        'requestKey',
        'sampleOnly',
      ]),
      person = fictional(b),
      requestKey = key(b.requestKey);
    if (
      !['event_interest', 'job_application', 'contact'].includes(String(b.kind))
    )
      throw new PilotError(422, 'Choose a valid response.');
    const payload = { ...person, message: text(b.message, 'message', 2, 1000) };
    return this.transaction(() => {
      let id: number | null = null;
      if (b.kind !== 'contact') {
        if (!Number.isSafeInteger(b.contentId))
          throw new PilotError(422, 'Choose a listing.');
        id = Number(b.contentId);
        const c = this.row(id),
          p = JSON.parse(String(c.payload)) as Payload;
        if (
          c.state !== 'published' ||
          c.kind !== (b.kind === 'event_interest' ? 'event' : 'job')
        )
          throw new PilotError(404, 'This sample listing is unavailable.');
        if (
          Date.parse(
            String(b.kind === 'event_interest' ? p.endsAt : p.closesAt),
          ) < Date.now()
        )
          throw new PilotError(409, 'This sample listing has ended.');
      } else if (b.contentId !== undefined)
        throw new PilotError(
          400,
          'Contact messages do not belong to a listing.',
        );
      const json = JSON.stringify(payload),
        old = this.store.db
          .prepare('SELECT * FROM local_responses WHERE request_key=?')
          .get(requestKey) as Row | undefined;
      if (old) {
        if (
          old.payload !== json ||
          old.kind !== b.kind ||
          old.content_id !== id
        )
          throw new PilotError(
            409,
            'This reference was used for different details.',
          );
        return {
          reference: `ER-${old.id}`,
          receivedAt: old.created_at,
          isDemo: true,
        };
      }
      if (
        Number(
          this.store.db
            .prepare('SELECT COUNT(*) AS n FROM local_responses')
            .get()!.n,
        ) >= 1000
      )
        throw new PilotError(429, 'The sample response queue is full.');
      const at = new Date().toISOString(),
        r = this.store.db
          .prepare(
            'INSERT INTO local_responses(kind,content_id,request_key,payload,created_at) VALUES(?,?,?,?,?)',
          )
          .run(String(b.kind), id, requestKey, json, at);
      return {
        reference: `ER-${r.lastInsertRowid}`,
        receivedAt: at,
        isDemo: true,
      };
    });
  }
  contribute(input: unknown) {
    const b = body(input, [
        'kind',
        'title',
        'summary',
        'description',
        'category',
        'cityId',
        'communityId',
        'startsAt',
        'endsAt',
        'closesAt',
        'venue',
        'organiser',
        'accessibility',
        'organisation',
        'employmentType',
        'requirements',
        'name',
        'email',
        'requestKey',
        'sampleOnly',
      ]),
      person = fictional(b),
      requestKey = key(b.requestKey),
      kind = String(b.kind);
    if (!['event', 'job', 'notice'].includes(kind))
      throw new PilotError(422, 'Choose an event, job or notice.');
    if (
      !cities.some((c) => c.id === b.cityId) ||
      !communities.some((c) => c.id === b.communityId)
    )
      throw new PilotError(422, 'Choose a city and community.');
    const p: Payload = {
      title: text(b.title, 'title', 3, 100),
      summary: text(b.summary, 'summary', 10, 240),
      description: text(b.description, 'description', 20, 3000),
      category:
        kind === 'notice'
          ? 'Community notice'
          : text(b.category, 'category', 3, 50),
      cityId: Number(b.cityId),
      communityId: Number(b.communityId),
      image:
        kind === 'event' ? 'events' : kind === 'job' ? 'work' : 'community',
    };
    if (
      kind !== 'notice' &&
      !(this.meta().categories[kind as 'event' | 'job'] as string[]).includes(
        p.category,
      )
    )
      throw new PilotError(422, 'Choose a supported category.');
    if (kind === 'event') {
      p.startsAt = date(b.startsAt, 'start time');
      p.endsAt = date(b.endsAt, 'end time');
      if (
        Date.parse(p.startsAt) <= Date.now() ||
        Date.parse(p.endsAt) <= Date.parse(p.startsAt) ||
        Date.parse(p.endsAt) - Date.parse(p.startsAt) > 7 * 86400000
      )
        throw new PilotError(
          422,
          'Use a future event lasting up to seven days.',
        );
      p.venue = text(b.venue, 'sample venue', 3, 200);
      p.organiser = text(b.organiser, 'sample organiser', 3, 100);
      p.accessibility = text(b.accessibility, 'access information', 3, 500);
    }
    if (kind === 'job') {
      p.closesAt = date(b.closesAt, 'closing time');
      if (Date.parse(p.closesAt) <= Date.now())
        throw new PilotError(422, 'Use a future closing time.');
      p.organisation = text(b.organisation, 'sample employer', 3, 100);
      p.employmentType = text(b.employmentType, 'employment type', 3, 30);
      if (!['Full-time', 'Part-time', 'Contract'].includes(p.employmentType))
        throw new PilotError(422, 'Choose a supported employment type.');
      p.requirements = text(b.requirements, 'requirements', 10, 1000);
    }
    return this.transaction(() => {
      const json = JSON.stringify(p),
        submitter = JSON.stringify(person),
        old = this.store.db
          .prepare('SELECT * FROM local_content WHERE request_key=?')
          .get(requestKey) as Row | undefined;
      if (old) {
        if (
          old.payload !== json ||
          old.submitter !== submitter ||
          old.kind !== kind
        )
          throw new PilotError(
            409,
            'This reference was used for different details.',
          );
        return { reference: `EC-${old.id}`, state: old.state };
      }
      if (
        Number(
          this.store.db
            .prepare('SELECT COUNT(*) AS n FROM local_content')
            .get()!.n,
        ) >= 500
      )
        throw new PilotError(429, 'The sample content queue is full.');
      const at = new Date().toISOString(),
        r = this.store.db
          .prepare(
            "INSERT INTO local_content(kind,slug,payload,state,revision,request_key,submitter,created_at,updated_at) VALUES(?,?,?,'pending',1,?,?,?,?)",
          )
          .run(
            kind,
            `sample-${randomUUID()}`,
            json,
            requestKey,
            submitter,
            at,
            at,
          );
      return { reference: `EC-${r.lastInsertRowid}`, state: 'pending' };
    });
  }
  report(id: number, input: unknown) {
    const b = body(input, ['reason', 'requestKey', 'sampleOnly']);
    if (b.sampleOnly !== true)
      throw new PilotError(422, 'Confirm this is a sample report.');
    const reason = text(b.reason, 'reason', 5, 500),
      requestKey = key(b.requestKey);
    return this.transaction(() => {
      if (this.row(id).state !== 'published')
        throw new PilotError(404, 'This sample listing is unavailable.');
      const old = this.store.db
        .prepare('SELECT * FROM local_content_reports WHERE request_key=?')
        .get(requestKey) as Row | undefined;
      if (old) {
        if (old.content_id !== id || old.reason !== reason)
          throw new PilotError(
            409,
            'This reference was used for different details.',
          );
        return { reference: `EP-${old.id}` };
      }
      if (
        Number(
          this.store.db
            .prepare('SELECT COUNT(*) AS n FROM local_content_reports')
            .get()!.n,
        ) >= 1000
      )
        throw new PilotError(429, 'The sample report queue is full.');
      const r = this.store.db
        .prepare(
          "INSERT INTO local_content_reports(content_id,request_key,reason,state,revision,created_at) VALUES(?,?,?,'open',1,?)",
        )
        .run(id, requestKey, reason, new Date().toISOString());
      return { reference: `EP-${r.lastInsertRowid}` };
    });
  }
  overview(actor: PilotActor | null) {
    new OnboardingService(this.store).requireManager(actor);
    return {
      content: this.store.db
        .prepare('SELECT * FROM local_content ORDER BY id DESC LIMIT 500')
        .all()
        .map((row) => ({
          ...this.dto(row as Row),
          submitter: row.submitter ? JSON.parse(String(row.submitter)) : null,
        })),
      responses: this.store.db
        .prepare('SELECT * FROM local_responses ORDER BY id DESC LIMIT 1000')
        .all()
        .map((r) => ({
          id: r.id,
          kind: r.kind,
          contentId: r.content_id,
          ...JSON.parse(String(r.payload)),
          receivedAt: r.created_at,
        })),
      reports: this.store.db
        .prepare(
          'SELECT * FROM local_content_reports ORDER BY id DESC LIMIT 1000',
        )
        .all(),
      history: this.store.db
        .prepare(
          'SELECT * FROM local_content_history ORDER BY id DESC LIMIT 1000',
        )
        .all(),
    };
  }
  decide(
    actor: PilotActor | null,
    entity: 'content' | 'report',
    id: number,
    input: unknown,
  ) {
    const b = body(input, ['expectedRevision', 'state', 'reason']),
      reason = text(b.reason, 'decision reason', 5, 500);
    return this.transaction(() => {
      const user = new OnboardingService(this.store).requireManager(actor),
        table =
          entity === 'content' ? 'local_content' : 'local_content_reports',
        row = this.store.db
          .prepare(`SELECT * FROM ${table} WHERE id=?`)
          .get(id) as Row | undefined;
      if (!row) throw new PilotError(404, 'Record not found.');
      if (row.revision !== b.expectedRevision)
        throw new PilotError(
          409,
          'This record changed. Reload before deciding.',
        );
      if (
        !(
          entity === 'content' ? ['published', 'hidden'] : ['resolved']
        ).includes(String(b.state))
      )
        throw new PilotError(422, 'Choose a valid decision.');
      if (entity === 'content' && b.state === 'published') {
        const p = JSON.parse(String(row.payload)) as Payload;
        if (
          (row.kind === 'event' && Date.parse(String(p.endsAt)) < Date.now()) ||
          (row.kind === 'job' && Date.parse(String(p.closesAt)) < Date.now())
        )
          throw new PilotError(
            409,
            'Ended listings cannot be newly published.',
          );
      }
      const at = new Date().toISOString();
      this.store.db
        .prepare(
          `UPDATE ${table} SET state=?,revision=revision+1${entity === 'content' ? ',updated_at=?' : ''} WHERE id=?`,
        )
        .run(
          ...(entity === 'content'
            ? [String(b.state), at, id]
            : [String(b.state), id]),
        );
      this.store.db
        .prepare(
          'INSERT INTO local_content_history(entity,entity_id,actor_id,decision,reason,at) VALUES(?,?,?,?,?,?)',
        )
        .run(entity, id, user.id, String(b.state), reason, at);
      return { id, state: b.state, revision: Number(row.revision) + 1 };
    });
  }
  calendar(slug: string) {
    const c = this.detail('event', slug);
    const escape = (v: string) =>
        v
          .replace(/\\/g, '\\\\')
          .replace(/\r?\n/g, '\\n')
          .replace(/,/g, '\\,')
          .replace(/;/g, '\\;'),
      stamp = (v: string) => v.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EthnoMart//Local Sample Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:sample-${c.id}@ethnomart.invalid`,
      `DTSTAMP:${stamp(c.updatedAt)}`,
      `DTSTART:${stamp(c.startsAt!)}`,
      `DTEND:${stamp(c.endsAt!)}`,
      `SUMMARY:${escape('[SAMPLE] ' + c.title)}`,
      `DESCRIPTION:${escape('Fictional preview event. No booking or attendance is confirmed. ' + c.summary)}`,
      `LOCATION:${escape(c.venue || 'Sample venue')}`,
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ];
    return lines
      .map((line) => {
        let folded = '',
          chunk = '';
        for (const character of line) {
          if (Buffer.byteLength(chunk + character, 'utf8') > 75) {
            folded += chunk + '\r\n';
            chunk = ' ';
          }
          chunk += character;
        }
        return folded + chunk;
      })
      .join('\r\n');
  }
}
