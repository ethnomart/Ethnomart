import { Buffer } from 'node:buffer';
import {
  emptyDraft,
  clothingCategories,
  validateForReview,
  priceInPence,
  type DraftFields,
  type MerchantListing,
} from './fields.ts';

export class PilotError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(
    status: number,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export interface PilotActor {
  id: number;
  role: string;
}
export interface PilotShop {
  kind?: 'grocery' | 'clothing';
  id: number;
  ownerId: number;
  name: string;
  isApproved: boolean;
  status?: string;
  moderationReason?: string | null;
}

function readDraft(input: unknown): DraftFields {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new PilotError(400, 'Product details are required.');
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some((key) => !Object.hasOwn(emptyDraft, key)))
    throw new PilotError(400, 'Unsupported product field.');
  const fields = { ...emptyDraft };
  for (const key of Object.keys(emptyDraft) as (keyof DraftFields)[]) {
    const value = body[key];
    if (value === undefined) continue;
    if (key === 'imagePermission') {
      if (typeof value !== 'boolean')
        throw new PilotError(400, 'Photo permission must be a confirmation.');
      fields.imagePermission = value;
    } else {
      if (typeof value !== 'string')
        throw new PilotError(400, 'Product fields must be text.');
      const max =
        key === 'imageDataUrl'
          ? 480_000
          : key === 'aliases'
            ? 900
            : key === 'name' ||
                key === 'imageName' ||
                key === 'sizes' ||
                key === 'fabric'
              ? 160
              : key === 'brand'
                ? 80
                : 50;
      if (value.length > max)
        throw new PilotError(400, 'One of the product fields is too long.');
      fields[key] = value.trim();
    }
  }
  if (fields.imageDataUrl) {
    const match = fields.imageDataUrl.match(
      /^data:image\/(png|webp|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/,
    );
    if (!match)
      throw new PilotError(400, 'Use a JPEG, PNG or WebP product photo.');
    const bytes = Buffer.from(match[2], 'base64');
    if (
      bytes.length < 20 ||
      bytes.length > 350_000 ||
      bytes.toString('base64') !== match[2]
    )
      throw new PilotError(400, 'The photo is invalid or too large.');
    const valid =
      match[1] === 'png'
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : match[1] === 'webp'
          ? bytes.toString('ascii', 0, 4) === 'RIFF' &&
            bytes.toString('ascii', 8, 12) === 'WEBP'
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid)
      throw new PilotError(400, 'The file does not match its image type.');
  } else {
    fields.imageName = '';
    fields.imagePermission = false;
  }
  return fields;
}

// Pure catalogue state rules. Persistence adapters run these inside a transaction.
export class PilotCatalogue {
  private records = new Map<number, MerchantListing>();
  private keys = new Map<string, number>();
  private sequence = 100_000;
  private shops: PilotShop[];
  private now: () => string;
  constructor(
    shops: PilotShop[],
    now: () => string = () => new Date().toISOString(),
  ) {
    this.shops = shops;
    this.now = now;
  }

  snapshot() {
    return {
      records: [...this.records.values()].map((record) =>
        structuredClone(record),
      ),
      keys: [...this.keys.entries()],
      sequence: this.sequence,
    };
  }
  restore(snapshot: {
    records: MerchantListing[];
    keys: [string, number][];
    sequence: number;
  }) {
    this.records = new Map(
      snapshot.records.map((record) => [
        record.id,
        {
          ...structuredClone(record),
          fields: { ...emptyDraft, ...record.fields },
        },
      ]),
    );
    this.keys = new Map(snapshot.keys);
    this.sequence = snapshot.sequence;
  }
  private ownShop(actor: PilotActor | null, storeId: number) {
    if (!actor) throw new PilotError(401, 'Sign in to the merchant workspace.');
    if (actor.role !== 'store_owner')
      throw new PilotError(403, 'This workspace is for shopkeepers.');
    const shop = this.shops.find((item) => item.id === storeId);
    if (!shop) throw new PilotError(404, 'Sample shop not found.');
    if (shop.ownerId !== actor.id)
      throw new PilotError(403, 'This shop is not assigned to your account.');
    return shop;
  }
  private ownListing(actor: PilotActor | null, id: number) {
    if (!actor) throw new PilotError(401, 'Sign in to the merchant workspace.');
    if (actor.role !== 'store_owner')
      throw new PilotError(403, 'This workspace is for shopkeepers.');
    const record = this.records.get(id);
    if (!record) throw new PilotError(404, 'Product not found.');
    this.ownShop(actor, record.storeId);
    return record;
  }
  private revision(record: MerchantListing, expected: unknown) {
    if (!Number.isInteger(expected) || expected !== record.revision)
      throw new PilotError(
        409,
        'A newer version was saved. Your entered details are still on screen; reload the saved version before continuing.',
      );
  }
  private event(
    record: MerchantListing,
    actor: PilotActor,
    type: MerchantListing['events'][number]['type'],
  ) {
    record.updatedAt = this.now();
    record.events.push({
      type,
      actorId: actor.id,
      revision: record.revision,
      at: record.updatedAt,
    });
  }
  shopsFor(actor: PilotActor | null) {
    if (!actor) throw new PilotError(401, 'Sign in to the merchant workspace.');
    if (actor.role !== 'store_owner')
      throw new PilotError(403, 'This workspace is for shopkeepers.');
    return this.shops
      .filter((shop) => shop.ownerId === actor.id)
      .map(({ id, name, isApproved, status, moderationReason, kind }) => ({
        id,
        name,
        isApproved,
        status,
        moderationReason,
        kind,
      }));
  }
  list(actor: PilotActor | null, storeId: number) {
    this.ownShop(actor, storeId);
    return [...this.records.values()]
      .filter((record) => record.storeId === storeId)
      .map((record) => structuredClone(record));
  }
  get(actor: PilotActor | null, id: number) {
    return structuredClone(this.ownListing(actor, id));
  }
  create(
    actor: PilotActor | null,
    storeId: number,
    values: unknown,
    requestKey: unknown,
  ) {
    this.ownShop(actor, storeId);
    if (
      typeof requestKey !== 'string' ||
      !/^[a-zA-Z0-9-]{8,80}$/.test(requestKey)
    )
      throw new PilotError(400, 'A draft request reference is required.');
    const fields = readDraft(values);
    const key = `${actor!.id}:${storeId}:${requestKey}`;
    const existing = this.keys.get(key);
    if (existing) {
      const previous = this.ownListing(actor, existing);
      if (JSON.stringify(previous.fields) !== JSON.stringify(fields))
        throw new PilotError(
          409,
          'This draft reference was used for different details. Reload before creating another product.',
        );
      return structuredClone(previous);
    }
    if (this.list(actor, storeId).length >= 100)
      throw new PilotError(
        400,
        'This demo supports up to 100 workspace products per shop.',
      );
    const record: MerchantListing = {
      id: ++this.sequence,
      storeId,
      fields,
      state: 'draft',
      revision: 1,
      reviewedRevision: null,
      reviewedBy: null,
      confirmedAt: null,
      updatedAt: this.now(),
      events: [],
    };
    this.event(record, actor!, 'created');
    this.records.set(record.id, record);
    this.keys.set(key, record.id);
    return structuredClone(record);
  }
  update(
    actor: PilotActor | null,
    id: number,
    values: unknown,
    expected: unknown,
  ) {
    const record = this.ownListing(actor, id);
    this.revision(record, expected);
    const fields = readDraft(values);
    record.fields = fields;
    record.state = 'draft';
    record.revision++;
    record.reviewedRevision = null;
    record.reviewedBy = null;
    record.confirmedAt = null;
    this.event(record, actor!, 'edited');
    return structuredClone(record);
  }
  publish(
    actor: PilotActor | null,
    id: number,
    expected: unknown,
    review: unknown,
    priceConfirmation: unknown,
  ) {
    const record = this.ownListing(actor, id);
    const shop = this.ownShop(actor, record.storeId);
    this.revision(record, expected);
    if (record.moderation?.blocked)
      throw new PilotError(
        403,
        'This product is blocked by the manager. Ask for the block to be reviewed.',
      );
    if (!shop.isApproved)
      throw new PilotError(
        403,
        'This shop is paused. Its products cannot be published.',
      );
    if (review !== true || priceConfirmation !== true)
      throw new PilotError(
        400,
        'Review the product and confirm its price and reported availability.',
      );
    const errors = validateForReview(record.fields);
    const isClothing = (clothingCategories as readonly string[]).includes(
      record.fields.category,
    );
    if ((shop.kind === 'clothing') !== isClothing)
      errors.category = 'Choose a category matching this shop’s business type.';
    if (Object.keys(errors).length)
      throw new PilotError(
        422,
        'Correct these details before publishing.',
        errors,
      );
    if (
      record.state === 'published' &&
      record.reviewedRevision === record.revision
    )
      return structuredClone(record);
    if (record.state !== 'draft')
      throw new PilotError(
        409,
        'Save this product as a draft and review it before publishing again.',
      );
    record.state = 'published';
    record.reviewedRevision = record.revision;
    record.reviewedBy = actor!.id;
    record.confirmedAt = this.now();
    this.event(record, actor!, 'published');
    return structuredClone(record);
  }
  pause(actor: PilotActor | null, id: number, expected: unknown) {
    const record = this.ownListing(actor, id);
    this.revision(record, expected);
    if (record.state !== 'published')
      throw new PilotError(409, 'Only a published product can be paused.');
    record.state = 'paused';
    record.revision++;
    record.reviewedRevision = null;
    this.event(record, actor!, 'paused');
    return structuredClone(record);
  }
  publicProducts(storeId: number) {
    if (!this.shops.find((shop) => shop.id === storeId)?.isApproved) return [];
    return [...this.records.values()]
      .filter(
        (record) =>
          record.storeId === storeId &&
          record.state === 'published' &&
          record.reviewedRevision === record.revision &&
          !record.moderation?.blocked,
      )
      .map((record) => ({
        id: record.id,
        storeId,
        name: record.fields.name,
        brand: record.fields.brand,
        description: '',
        aliases: record.fields.aliases.split('\n').filter(Boolean),
        sizes: record.fields.sizes,
        fabric: record.fields.fabric,
        category: record.fields.category,
        unit: `${record.fields.packAmount} ${record.fields.packUnit}`,
        priceGbp: (priceInPence(record.fields.price)! / 100).toFixed(2),
        inStock: record.fields.availability === 'in_stock',
        availabilityStatus: record.fields.availability,
        imageUrl: record.fields.imageDataUrl || undefined,
        confirmedAt: record.confirmedAt,
        createdAt: record.updatedAt,
        merchantReviewedDemo: true,
      }));
  }
}
