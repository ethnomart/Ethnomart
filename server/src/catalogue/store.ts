import {
  sampleShopPhoto,
  sampleProductPhoto,
  samplePhotoUrl,
} from './visual-assets.ts';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import session, { type SessionData } from 'express-session';
import bcrypt from 'bcryptjs';
import { migratePlatform } from './platform-schema.ts';
import { migrateOnboarding } from './onboarding-schema.ts';
import { PilotCatalogue, PilotError, type PilotActor } from './domain.ts';
import {
  priceInPence,
  type MerchantListing,
  type Availability,
} from './fields.ts';
import {
  cities,
  communities,
  stores,
  products,
  type Store,
  type Product,
} from './fixtures.ts';

type Row = Record<string, string | number | null>;
export type LocalUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
};
export type PublicProduct = Product & {
  brand: string;
  aliases: string[];
  pricePence: number;
  availabilityStatus: Availability;
  confirmedAt: string | null;
  merchantReviewedDemo: boolean;
  isDemo: true;
};
const categoryMap: Record<string, string> = {
  'Rice & Grains': 'Rice & grains',
  'Flour & Grains': 'Flour & pulses',
  'Lentils & Pulses': 'Flour & pulses',
  'Spices & Masalas': 'Spices & seasonings',
  'Oils & Fats': 'Oils & pantry',
  'Pickles & Sauces': 'Oils & pantry',
  'Snacks & Sweets': 'Snacks & drinks',
  Beverages: 'Snacks & drinks',
};

export class LocalCatalogueStore {
  readonly db: DatabaseSync;
  constructor(
    file: string,
    importFile?: string,
    options: { disableSeedPasswords?: boolean } = {},
  ) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file, {
      timeout: 5000,
      enableForeignKeyConstraints: true,
    });
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS local_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS local_users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('customer','store_owner'))) STRICT;
      CREATE TABLE IF NOT EXISTS local_shops (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES local_users(id), approved INTEGER NOT NULL CHECK(approved IN (0,1)), profile TEXT NOT NULL CHECK(json_valid(profile))) STRICT;
      CREATE TABLE IF NOT EXISTS local_fixtures (id INTEGER PRIMARY KEY, store_id INTEGER NOT NULL REFERENCES local_shops(id), product TEXT NOT NULL CHECK(json_valid(product))) STRICT;
      CREATE TABLE IF NOT EXISTS local_listings (id INTEGER PRIMARY KEY, store_id INTEGER NOT NULL REFERENCES local_shops(id), state TEXT NOT NULL CHECK(state IN ('draft','published','paused')), revision INTEGER NOT NULL CHECK(revision>0), record TEXT NOT NULL CHECK(json_valid(record)), CHECK(state<>'published' OR (json_extract(record,'$.reviewedRevision') IS NOT NULL AND json_extract(record,'$.reviewedRevision')=revision))) STRICT;
      CREATE INDEX IF NOT EXISTS local_listing_shop_state ON local_listings(store_id,state);
      CREATE TABLE IF NOT EXISTS local_draft_keys (key TEXT PRIMARY KEY, store_id INTEGER NOT NULL REFERENCES local_shops(id), listing_id INTEGER NOT NULL REFERENCES local_listings(id)) STRICT;
      CREATE TABLE IF NOT EXISTS local_events (listing_id INTEGER NOT NULL REFERENCES local_listings(id), revision INTEGER NOT NULL, type TEXT NOT NULL CHECK(type IN ('created','edited','published','paused')), actor_id INTEGER NOT NULL REFERENCES local_users(id), at TEXT NOT NULL, PRIMARY KEY(listing_id,revision,type)) STRICT;
      CREATE TABLE IF NOT EXISTS local_sessions (sid TEXT PRIMARY KEY, expires INTEGER NOT NULL, data TEXT NOT NULL CHECK(json_valid(data))) STRICT;
    `);
    const version = this.meta('schema_version');
    if (version && !['1', '2', '3'].includes(version))
      throw new Error('Unsupported local catalogue schema version.');
    if (!version) this.seed(importFile, options.disableSeedPasswords);
    migrateOnboarding(this.db);
    migratePlatform(this.db);
  }
  private seed(importFile?: string, disableSeedPasswords = false) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const passwordHash = bcrypt.hashSync(
        disableSeedPasswords
          ? randomBytes(32).toString('base64url')
          : 'password123',
        10,
      ); // Starter passwords are unavailable in hosted mode.
      for (const user of [
        {
          id: 2,
          name: 'Sample shopper',
          email: 'shopper@example.invalid',
          role: 'customer',
        },
        {
          id: 3,
          name: 'Sample shopkeeper',
          email: 'owner@ethnomart.co.uk',
          role: 'store_owner',
        },
        {
          id: 5,
          name: 'Other sample shopkeeper',
          email: 'other.owner@example.invalid',
          role: 'store_owner',
        },
      ]) {
        this.db
          .prepare('INSERT INTO local_users VALUES(?,?,?,?,?)')
          .run(user.id, user.name, user.email, passwordHash, user.role);
      }
      for (const shop of stores)
        this.db
          .prepare('INSERT INTO local_shops VALUES(?,?,?,?)')
          .run(
            shop.id,
            shop.id === 10 ? 5 : 3,
            shop.isApproved ? 1 : 0,
            JSON.stringify(shop),
          );
      for (const product of products) {
        // The first manual pilot concerns packaged groceries. Starter samples
        // never acquire a fabricated merchant-confirmation timestamp.
        if (/meat|fresh produce|vegetables|fish/i.test(product.category))
          continue;
        const value = {
          ...product,
          category: categoryMap[product.category] || 'Other packaged groceries',
        };
        this.db
          .prepare('INSERT INTO local_fixtures VALUES(?,?,?)')
          .run(value.id, value.storeId, JSON.stringify(value));
      }
      let sequence = 100000;
      if (importFile && existsSync(importFile)) {
        const imported = JSON.parse(readFileSync(importFile, 'utf8')) as {
          records: MerchantListing[];
        };
        for (const record of imported.records) {
          if (
            !this.db
              .prepare('SELECT id FROM local_shops WHERE id=?')
              .get(record.storeId) ||
            !Number.isSafeInteger(record.id) ||
            record.id <= 100000 ||
            !Number.isSafeInteger(record.revision) ||
            record.revision < 1
          )
            throw new Error('Invalid local demo import.');
          this.persistRecord(record);
          sequence = Math.max(sequence, record.id);
        }
      }
      this.setMeta('catalogue_sequence', String(sequence));
      this.setMeta('session_secret', randomBytes(48).toString('hex'));
      this.setMeta('schema_version', '1');
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  meta(key: string) {
    return (
      this.db.prepare('SELECT value FROM local_meta WHERE key=?').get(key) as
        Row | undefined
    )?.value as string | undefined;
  }
  private setMeta(key: string, value: string) {
    this.db
      .prepare(
        'INSERT INTO local_meta VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      )
      .run(key, value);
  }
  user(id: number): LocalUser | null {
    const row = this.db
      .prepare(
        "SELECT u.id,u.name,u.email,CASE WHEN a.active=1 THEN 'admin' ELSE u.role END AS role,u.password_hash AS passwordHash FROM local_users u LEFT JOIN local_admin_memberships a ON a.user_id=u.id WHERE u.id=?",
      )
      .get(id);
    return row ? (row as unknown as LocalUser) : null;
  }
  userByEmail(email: string): LocalUser | null {
    const row = this.db
      .prepare(
        'SELECT id,name,email,role,password_hash AS passwordHash FROM local_users WHERE email=? COLLATE NOCASE',
      )
      .get(email);
    return row ? this.user(Number(row.id)) : null;
  }
  shop(id: number):
    | (Store & {
        status: string;
        controlRevision: number;
        moderationReason: string | null;
      })
    | null {
    const row = this.db
      .prepare(
        'SELECT s.profile,s.owner_id,s.approved,c.state,c.revision AS control_revision,c.reason AS control_reason FROM local_shops s LEFT JOIN local_shop_controls c ON c.shop_id=s.id WHERE s.id=?',
      )
      .get(id) as Row | undefined;
    return row
      ? {
          ...JSON.parse(String(row.profile)),
          ownerId: Number(row.owner_id),
          isApproved: row.approved === 1,
          status: String(
            row.state || (row.approved === 1 ? 'active' : 'pending'),
          ),
          controlRevision: Number(row.control_revision || 1),
          moderationReason:
            row.control_reason === null ? null : String(row.control_reason),
        }
      : null;
  }
  shops() {
    return this.db
      .prepare('SELECT id FROM local_shops ORDER BY id')
      .all()
      .map((row) => this.shop(Number(row.id))!);
  }
  publicShop(id: number) {
    const shop = this.shop(id);
    if (!shop?.isApproved)
      throw new PilotError(404, 'This sample shop is unavailable.');
    return {
      kind: shop.kind || 'grocery',
      imageUrl: samplePhotoUrl(sampleShopPhoto(shop.name)),
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      description: 'A fictional shop used to test the EthnoMart catalogue.',
      communityId: shop.communityId,
      cityId: shop.cityId,
      category: shop.category,
      isApproved: true,
      communityName: communities.find((item) => item.id === shop.communityId)
        ?.name,
      cityName: cities.find((item) => item.id === shop.cityId)?.name,
      averageRating: null,
      reviewCount: 0,
      createdAt: shop.createdAt,
      isDemo: true,
    };
  }
  private load(storeId?: number) {
    const catalogue = new PilotCatalogue(this.shops());
    const records = storeId
      ? this.db
          .prepare(
            'SELECT l.record,b.active AS blocked,b.reason AS block_reason,b.revision AS block_revision,b.changed_at FROM local_listings l LEFT JOIN local_listing_blocks b ON b.listing_id=l.id WHERE l.store_id=?',
          )
          .all(storeId)
      : [];
    const keys = storeId
      ? this.db
          .prepare(
            'SELECT key,listing_id FROM local_draft_keys WHERE store_id=?',
          )
          .all(storeId)
      : [];
    catalogue.restore({
      records: records.map((row) => ({
        ...JSON.parse(String(row.record)),
        moderation: {
          blocked: row.blocked === 1,
          reason: row.block_reason == null ? null : String(row.block_reason),
          revision: Number(row.block_revision || 0),
          changedAt: row.changed_at == null ? null : String(row.changed_at),
        },
      })),
      keys: keys.map((row) => [String(row.key), Number(row.listing_id)]),
      sequence: Number(this.meta('catalogue_sequence')),
    });
    return catalogue;
  }
  private persistRecord(record: MerchantListing) {
    const stored = { ...record };
    delete stored.moderation;
    this.db
      .prepare(
        'INSERT INTO local_listings VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,revision=excluded.revision,record=excluded.record',
      )
      .run(
        record.id,
        record.storeId,
        record.state,
        record.revision,
        JSON.stringify(stored),
      );
    const addEvent = this.db.prepare(
      'INSERT OR IGNORE INTO local_events VALUES(?,?,?,?,?)',
    );
    for (const event of record.events)
      addEvent.run(
        record.id,
        event.revision,
        event.type,
        event.actorId,
        event.at,
      );
  }
  read<T>(
    storeId: number | undefined,
    operation: (catalogue: PilotCatalogue) => T,
  ): T {
    this.db.exec('BEGIN');
    try {
      const result = operation(this.load(storeId));
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  mutate<T>(
    actor: PilotActor | null,
    storeId: number,
    operation: (catalogue: PilotCatalogue, current: PilotActor | null) => T,
  ): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const catalogue = this.load(storeId);
      const current = actor ? this.user(actor.id) : null;
      const result = operation(catalogue, current);
      const snapshot = catalogue.snapshot();
      for (const record of snapshot.records) this.persistRecord(record);
      for (const [key, id] of snapshot.keys)
        this.db
          .prepare('INSERT OR IGNORE INTO local_draft_keys VALUES(?,?,?)')
          .run(key, storeId, id);
      this.setMeta('catalogue_sequence', String(snapshot.sequence));
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  listingShop(actor: PilotActor | null, id: number) {
    if (!actor) throw new PilotError(401, 'Sign in to the merchant workspace.');
    if (actor.role !== 'store_owner')
      throw new PilotError(403, 'This workspace is for shopkeepers.');
    const row = this.db
      .prepare('SELECT store_id FROM local_listings WHERE id=?')
      .get(id);
    if (!row) throw new PilotError(404, 'Product not found.');
    return Number(row.store_id);
  }
  publicProducts(storeId: number): PublicProduct[] {
    return this.read(storeId, (catalogue) => {
      this.publicShop(storeId);
      const fixtures = this.db
        .prepare('SELECT product FROM local_fixtures WHERE store_id=?')
        .all(storeId)
        .map((row) => {
          const product = JSON.parse(String(row.product)) as Product;
          return {
            ...product,
            imageUrl: samplePhotoUrl(
              sampleProductPhoto(this.shop(storeId)!.name, product.name),
            ),
            brand: '',
            aliases: [],
            pricePence: priceInPence(product.priceGbp)!,
            availabilityStatus:
              product.availabilityStatus ||
              (product.inStock
                ? ('in_stock' as const)
                : ('unavailable' as const)),
            confirmedAt: null,
            merchantReviewedDemo: false,
            isDemo: true as const,
          };
        });
      const reviewed = catalogue.publicProducts(storeId).map((product) => ({
        ...product,
        brand: product.brand,
        aliases: product.aliases,
        pricePence: priceInPence(product.priceGbp)!,
        availabilityStatus: product.availabilityStatus as Availability,
        imageUrl: product.imageUrl
          ? `/api/catalogue/shops/${storeId}/products/${product.id}/photo`
          : undefined,
        isDemo: true as const,
      }));
      return [...fixtures, ...reviewed];
    });
  }
  photo(storeId: number, id: number) {
    return this.read(storeId, (catalogue) => {
      this.publicShop(storeId);
      if (
        !catalogue.publicProducts(storeId).some((product) => product.id === id)
      )
        throw new PilotError(404, 'Product photo is unavailable.');
      const record = this.db
        .prepare('SELECT record FROM local_listings WHERE id=? AND store_id=?')
        .get(id, storeId);
      const image = record
        ? (JSON.parse(String(record.record)) as MerchantListing).fields
            .imageDataUrl
        : '';
      const match = image.match(
        /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/,
      );
      if (!match) throw new PilotError(404, 'Product photo is unavailable.');
      return { type: match[1], bytes: Buffer.from(match[2], 'base64') };
    });
  }
  close() {
    this.db.close();
  }
}

export class SqliteSessionStore extends session.Store {
  private catalogue: LocalCatalogueStore;
  constructor(catalogue: LocalCatalogueStore) {
    super();
    this.catalogue = catalogue;
  }
  override get(
    sid: string,
    callback: (error: unknown, data?: SessionData | null) => void,
  ) {
    try {
      const row = this.catalogue.db
        .prepare('SELECT data FROM local_sessions WHERE sid=? AND expires>?')
        .get(sid, Date.now());
      callback(null, row ? JSON.parse(String(row.data)) : null);
    } catch (error) {
      callback(error);
    }
  }
  override set(
    sid: string,
    data: SessionData,
    callback?: (error?: unknown) => void,
  ) {
    try {
      const expires = data.cookie.expires
        ? new Date(data.cookie.expires).getTime()
        : Date.now() + 86400000;
      this.catalogue.db
        .prepare('DELETE FROM local_sessions WHERE expires<?')
        .run(Date.now());
      this.catalogue.db
        .prepare(
          'INSERT INTO local_sessions VALUES(?,?,?) ON CONFLICT(sid) DO UPDATE SET expires=excluded.expires,data=excluded.data',
        )
        .run(sid, expires, JSON.stringify(data));
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }
  override destroy(sid: string, callback?: (error?: unknown) => void) {
    try {
      this.catalogue.db
        .prepare('DELETE FROM local_sessions WHERE sid=?')
        .run(sid);
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }
  override touch(
    sid: string,
    data: SessionData,
    callback?: (error?: unknown) => void,
  ) {
    this.set(sid, data, callback);
  }
}
