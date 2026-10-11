import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PilotError, type PilotActor } from './domain.ts';
import { cities, communities, type Store } from './fixtures.ts';
import type { LocalCatalogueStore } from './store.ts';
import type { MerchantListing } from './fields.ts';

type Row = Record<string, string | number | null>;
export const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex');
function tokenValue(input: unknown) {
  if (typeof input !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(input))
    throw new PilotError(400, 'This access link is invalid.');
  return input;
}
function object(input: unknown, allowed: string[]) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new PilotError(400, 'Request details are required.');
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    throw new PilotError(400, 'Unsupported request field.');
  return body;
}
function text(input: unknown, name: string, min: number, max: number) {
  if (
    typeof input !== 'string' ||
    input.trim().length < min ||
    input.trim().length > max
  )
    throw new PilotError(422, `Check ${name}.`, {
      [name]: `Enter ${min}–${max} characters.`,
    });
  return input.trim();
}
function revision(current: number, expected: unknown) {
  if (!Number.isSafeInteger(expected) || current !== expected)
    throw new PilotError(
      409,
      'This record changed. Reload the latest version before deciding. Your reason is still on screen.',
    );
}

export class OnboardingService {
  private store: LocalCatalogueStore;
  private now: () => string;
  constructor(
    store: LocalCatalogueStore,
    now: () => string = () => new Date().toISOString(),
  ) {
    this.store = store;
    this.now = now;
  }
  private transaction<T>(operation: () => T): T {
    this.store.db.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      this.store.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.store.db.exec('ROLLBACK');
      throw error;
    }
  }
  requireManager(actor: PilotActor | null) {
    if (!actor) throw new PilotError(401, 'Sign in to the manager workspace.');
    const current = this.store.user(actor.id);
    if (current?.role !== 'admin')
      throw new PilotError(
        403,
        'This workspace is for the authorised local manager.',
      );
    return current;
  }
  private event(
    entity: 'application' | 'shop' | 'listing' | 'access',
    id: number,
    kind: string,
    actorId: number | null,
    reason: string | null,
  ) {
    this.store.db
      .prepare(
        'INSERT INTO local_operation_events(entity_type,entity_id,kind,actor_id,reason,at) VALUES(?,?,?,?,?,?)',
      )
      .run(entity, id, kind, actorId, reason, this.now());
  }
  private application(id: number) {
    const row = this.store.db
      .prepare('SELECT * FROM local_applications WHERE id=?')
      .get(id) as Row | undefined;
    if (!row) throw new PilotError(404, 'Trial request not found.');
    return row;
  }
  private applicationDto(row: Row) {
    const invite = this.store.db
      .prepare(
        'SELECT expires_at,used_at,revoked_at FROM local_invitations WHERE application_id=? ORDER BY id DESC LIMIT 1',
      )
      .get(row.id!) as Row | undefined;
    return {
      kind: row.kind || 'grocery',
      id: Number(row.id),
      shopName: String(row.shop_name),
      ownerName: String(row.owner_name),
      email: String(row.email),
      cityId: Number(row.city_id),
      communityId: Number(row.community_id),
      cityName: cities.find((item) => item.id === row.city_id)?.name,
      communityName: communities.find((item) => item.id === row.community_id)
        ?.name,
      state: String(row.state),
      revision: Number(row.revision),
      createdAt: String(row.created_at),
      decisionAt: row.decision_at,
      reason: row.reason,
      shopId: row.shop_id,
      invitation: invite
        ? {
            expiresAt: String(invite.expires_at),
            used: !!invite.used_at,
            revoked: !!invite.revoked_at,
            expired: String(invite.expires_at) <= this.now(),
          }
        : null,
    };
  }
  submit(input: unknown) {
    const body = object(input, [
      'shopName',
      'ownerName',
      'email',
      'cityId',
      'communityId',
      'kind',
      'requestKey',
      'sampleOnly',
    ]);
    const kind = body.kind === undefined ? 'grocery' : body.kind;
    if (!['grocery', 'clothing'].includes(String(kind)))
      throw new PilotError(422, 'Choose grocery or clothing.');
    const shopName = text(body.shopName, 'shopName', 2, 100),
      ownerName = text(body.ownerName, 'ownerName', 2, 100);
    const email = text(body.email, 'email', 5, 254).toLowerCase();
    if (
      !/^[a-z0-9._+-]+@(?:[a-z0-9-]+\.)+invalid$/.test(email) ||
      email === 'manager@example.invalid'
    )
      throw new PilotError(
        422,
        'Use fictional sample details in this local trial.',
        {
          email: 'Use a sample address such as grocer@example.invalid.',
        },
      );
    if (body.sampleOnly !== true)
      throw new PilotError(
        422,
        'Confirm that these are fictional sample details.',
        {
          sampleOnly: 'Use fictional details only.',
        },
      );
    if (
      !cities.some((item) => item.id === body.cityId) ||
      !communities.some((item) => item.id === body.communityId)
    )
      throw new PilotError(422, 'Choose a city and community from the list.');
    if (
      typeof body.requestKey !== 'string' ||
      !/^[A-Za-z0-9-]{8,80}$/.test(body.requestKey)
    )
      throw new PilotError(400, 'A request reference is required.');
    return this.transaction(() => {
      const existing = this.store.db
        .prepare('SELECT * FROM local_applications WHERE request_key=?')
        .get(body.requestKey as string) as Row | undefined;
      if (existing) {
        if (
          existing.email !== email ||
          existing.shop_name !== shopName ||
          existing.owner_name !== ownerName ||
          existing.city_id !== body.cityId ||
          existing.community_id !== body.communityId ||
          existing.kind !== kind
        )
          throw new PilotError(
            409,
            'This request reference was already used for different details.',
          );
        return {
          reference: `EM-${existing.id}`,
          receivedAt: String(existing.created_at),
        };
      }
      if (
        this.store.userByEmail(email) ||
        this.store.db
          .prepare(
            'SELECT id FROM local_applications WHERE email=? COLLATE NOCASE',
          )
          .get(email)
      )
        throw new PilotError(
          409,
          'A request or sample account already exists for this address. Ask the local manager to review it.',
        );
      if (
        Number(
          this.store.db
            .prepare('SELECT COUNT(*) AS n FROM local_applications')
            .get()!.n,
        ) >= 100
      )
        throw new PilotError(
          429,
          'This local trial supports up to 100 requests.',
        );
      const at = this.now();
      const result = this.store.db
        .prepare(
          "INSERT INTO local_applications(request_key,email,shop_name,owner_name,city_id,community_id,state,revision,created_at,kind) VALUES(?,?,?,?,?,?,'pending',1,?,?)",
        )
        .run(
          body.requestKey as string,
          email,
          shopName,
          ownerName,
          body.cityId as number,
          body.communityId as number,
          at,
          String(kind),
        );
      const id = Number(result.lastInsertRowid);
      this.event(
        'application',
        id,
        'submitted',
        null,
        'Fictional local trial request.',
      );
      return { reference: `EM-${id}`, receivedAt: at };
    });
  }
  overview(actor: PilotActor | null) {
    this.requireManager(actor);
    const applications = this.store.db
      .prepare('SELECT * FROM local_applications ORDER BY id DESC LIMIT 100')
      .all()
      .map((row) => this.applicationDto(row as Row));
    const shops = this.store.shops().map((shop) => ({
      id: shop.id,
      name: shop.name,
      state: shop.status,
      revision: shop.controlRevision,
      reason: shop.moderationReason,
      cityName: cities.find((item) => item.id === shop.cityId)?.name,
      communityName: communities.find((item) => item.id === shop.communityId)
        ?.name,
    }));
    return { applications, shops };
  }
  decide(
    actor: PilotActor | null,
    id: number,
    action: 'approve' | 'reject' | 'reissue' | 'revoke',
    input: unknown,
  ) {
    const body = object(input, ['expectedRevision', 'reason']);
    return this.transaction(() => {
      const user = this.requireManager(actor),
        row = this.application(id);
      revision(Number(row.revision), body.expectedRevision);
      if (row.state === 'accepted' || row.state === 'rejected')
        throw new PilotError(
          409,
          'This request has already been completed. Manage its shop if it has one.',
        );
      if (
        action !== 'approve' &&
        row.state !== 'approved' &&
        action !== 'reject'
      )
        throw new PilotError(409, 'There is no approved invitation to change.');
      if (action === 'approve' && row.state !== 'pending')
        throw new PilotError(
          409,
          'This request has already been approved. Use Reissue if another link is needed.',
        );
      const reason =
        action === 'reject' || action === 'revoke'
          ? text(body.reason, 'reason', 5, 500)
          : action === 'approve'
            ? 'Local trial invitation approved.'
            : 'Local trial invitation reissued.';
      this.store.db
        .prepare(
          'UPDATE local_invitations SET revoked_at=? WHERE application_id=? AND used_at IS NULL AND revoked_at IS NULL',
        )
        .run(this.now(), id);
      this.store.db
        .prepare(
          'UPDATE local_applications SET state=?,revision=revision+1,decision_at=?,decided_by=?,reason=? WHERE id=?',
        )
        .run(
          action === 'reject' ? 'rejected' : 'approved',
          this.now(),
          user.id,
          reason,
          id,
        );
      let invitation: { path: string; expiresAt: string } | undefined;
      if (action === 'approve' || action === 'reissue') {
        const token = randomBytes(32).toString('base64url'),
          expiresAt = new Date(
            Date.parse(this.now()) + 72 * 3600000,
          ).toISOString();
        this.store.db
          .prepare(
            'INSERT INTO local_invitations(application_id,token_hash,expires_at,created_at,created_by) VALUES(?,?,?,?,?)',
          )
          .run(id, tokenHash(token), expiresAt, this.now(), user.id);
        invitation = { path: `/merchant/invitation#token=${token}`, expiresAt };
      }
      this.event('application', id, action, user.id, reason);
      return {
        application: this.applicationDto(this.application(id)),
        invitation,
      };
    });
  }
  private validInvitation(input: unknown) {
    const token = tokenValue(input);
    const row = this.store.db
      .prepare(
        'SELECT i.*,a.state,a.shop_name,a.owner_name,a.email,a.city_id,a.community_id,a.kind FROM local_invitations i JOIN local_applications a ON a.id=i.application_id WHERE i.token_hash=?',
      )
      .get(tokenHash(token)) as Row | undefined;
    if (
      !row ||
      row.used_at ||
      row.revoked_at ||
      String(row.expires_at) <= this.now() ||
      row.state !== 'approved'
    )
      throw new PilotError(
        410,
        'This invitation is invalid, expired or already used. Ask the local manager for a new link.',
      );
    return row;
  }
  preview(input: unknown) {
    const body = object(input, ['token']),
      row = this.validInvitation(body.token);
    return {
      shopName: String(row.shop_name),
      ownerName: String(row.owner_name),
      email: String(row.email),
      cityName: cities.find((item) => item.id === row.city_id)?.name,
      expiresAt: String(row.expires_at),
      isDemo: true,
    };
  }
  async accept(input: unknown) {
    const body = object(input, ['token', 'password', 'passwordConfirmation']);
    const token = tokenValue(body.token);
    this.validInvitation(token);
    if (
      typeof body.password !== 'string' ||
      body.password.length < 12 ||
      body.password.length > 64 ||
      Buffer.byteLength(body.password, 'utf8') > 72 ||
      body.password !== body.passwordConfirmation
    )
      throw new PilotError(
        422,
        'Use matching passwords with at least 12 characters.',
        {
          password:
            'Use 12–64 characters, no more than 72 UTF-8 bytes, and enter it twice.',
        },
      );
    const passwordHash = await bcrypt.hash(body.password, 10);
    return this.transaction(() => {
      const row = this.validInvitation(token),
        at = this.now();
      if (this.store.userByEmail(String(row.email)))
        throw new PilotError(
          409,
          'This sample address already has an account.',
        );
      const userId = Number(
        this.store.db
          .prepare('SELECT COALESCE(MAX(id),0)+1 AS id FROM local_users')
          .get()!.id,
      );
      this.store.db
        .prepare('INSERT INTO local_users VALUES(?,?,?,?,?)')
        .run(
          userId,
          String(row.owner_name),
          String(row.email),
          passwordHash,
          'store_owner',
        );
      const shopId = Number(
        this.store.db
          .prepare('SELECT COALESCE(MAX(id),0)+1 AS id FROM local_shops')
          .get()!.id,
      );
      const profile: Store = {
        id: shopId,
        ownerId: userId,
        name: String(row.shop_name),
        slug: `sample-shop-${shopId}`,
        description: 'A fictional local trial shop.',
        communityId: Number(row.community_id),
        cityId: Number(row.city_id),
        kind: row.kind === 'clothing' ? 'clothing' : 'grocery',
        category: row.kind === 'clothing' ? 'Clothing' : 'Grocery',
        address: '',
        subscriptionTier: 'basic',
        isApproved: true,
        averageRating: null,
        reviewCount: 0,
        createdAt: at,
      };
      this.store.db
        .prepare('INSERT INTO local_shops VALUES(?,?,1,?)')
        .run(shopId, userId, JSON.stringify(profile));
      this.store.db
        .prepare("INSERT INTO local_shop_controls VALUES(?,'active',1,?,?)")
        .run(
          shopId,
          'Activated after the approved local invitation was accepted.',
          at,
        );
      this.store.db
        .prepare(
          "UPDATE local_applications SET state='accepted',revision=revision+1,shop_id=? WHERE id=?",
        )
        .run(shopId, row.application_id!);
      this.store.db
        .prepare('UPDATE local_invitations SET used_at=? WHERE id=?')
        .run(at, row.id!);
      this.event(
        'application',
        Number(row.application_id),
        'accepted',
        userId,
        'Fictional invited operator accepted.',
      );
      this.event(
        'shop',
        shopId,
        'activated',
        userId,
        'Approved local invitation accepted.',
      );
      return { shopId, email: String(row.email), isDemo: true };
    });
  }
  manageShop(actor: PilotActor | null, id: number) {
    this.requireManager(actor);
    const shop = this.store.shop(id);
    if (!shop) throw new PilotError(404, 'Sample shop not found.');
    const listings = this.store
      .read(id, (model) =>
        model.list({ id: shop.ownerId, role: 'store_owner' }, id),
      )
      .map((record) => ({
        id: record.id,
        name: record.fields.name || 'Untitled draft',
        brand: record.fields.brand,
        pack: `${record.fields.packAmount} ${record.fields.packUnit}`,
        price: record.fields.price,
        state: record.state,
        revision: record.revision,
        moderation: record.moderation,
        hasPhoto: !!record.fields.imageDataUrl,
      }));
    const events = this.store.db
      .prepare(
        "SELECT e.id,e.entity_type AS entity,e.entity_id AS entityId,e.kind,e.reason,e.at,u.name AS actor FROM local_operation_events e LEFT JOIN local_users u ON u.id=e.actor_id WHERE (e.entity_type='shop' AND e.entity_id=?) OR (e.entity_type='listing' AND e.entity_id IN (SELECT id FROM local_listings WHERE store_id=?)) ORDER BY e.id DESC LIMIT 40",
      )
      .all(id, id);
    return {
      shop: {
        id,
        name: shop.name,
        state: shop.status,
        revision: shop.controlRevision,
        reason: shop.moderationReason,
      },
      listings,
      events,
    };
  }
  setShopState(actor: PilotActor | null, id: number, input: unknown) {
    const body = object(input, ['state', 'expectedRevision', 'reason']);
    if (!['active', 'suspended'].includes(String(body.state)))
      throw new PilotError(400, 'Choose an active or suspended shop state.');
    const reason = text(body.reason, 'reason', 5, 500);
    return this.transaction(() => {
      const user = this.requireManager(actor),
        shop = this.store.shop(id);
      if (!shop) throw new PilotError(404, 'Sample shop not found.');
      revision(shop.controlRevision, body.expectedRevision);
      if (shop.status === body.state)
        throw new PilotError(409, 'This shop already has that state.');
      this.store.db
        .prepare(
          'UPDATE local_shop_controls SET state=?,revision=revision+1,reason=?,updated_at=? WHERE shop_id=?',
        )
        .run(String(body.state), reason, this.now(), id);
      this.store.db
        .prepare('UPDATE local_shops SET approved=? WHERE id=?')
        .run(body.state === 'active' ? 1 : 0, id);
      this.event(
        'shop',
        id,
        body.state === 'active' ? 'activated' : 'suspended',
        user.id,
        reason,
      );
      return { success: true };
    });
  }
  setListingBlock(actor: PilotActor | null, id: number, input: unknown) {
    const body = object(input, [
      'blocked',
      'expectedRevision',
      'expectedBlockRevision',
      'reason',
    ]);
    if (typeof body.blocked !== 'boolean')
      throw new PilotError(400, 'Choose a block or release action.');
    const reason = text(body.reason, 'reason', 5, 500);
    return this.transaction(() => {
      const user = this.requireManager(actor),
        row = this.store.db
          .prepare('SELECT revision FROM local_listings WHERE id=?')
          .get(id);
      if (!row) throw new PilotError(404, 'Workspace product not found.');
      revision(Number(row.revision), body.expectedRevision);
      const previous = this.store.db
        .prepare(
          'SELECT active,revision FROM local_listing_blocks WHERE listing_id=?',
        )
        .get(id);
      revision(Number(previous?.revision || 0), body.expectedBlockRevision);
      if (!!previous?.active === body.blocked)
        throw new PilotError(
          409,
          'This product already has that moderation state.',
        );
      this.store.db
        .prepare(
          'INSERT INTO local_listing_blocks VALUES(?,?,?,?,?,?) ON CONFLICT(listing_id) DO UPDATE SET active=excluded.active,revision=local_listing_blocks.revision+1,reason=excluded.reason,changed_by=excluded.changed_by,changed_at=excluded.changed_at',
        )
        .run(id, body.blocked ? 1 : 0, 1, reason, user.id, this.now());
      this.event(
        'listing',
        id,
        body.blocked ? 'blocked' : 'released',
        user.id,
        reason,
      );
      return { success: true };
    });
  }
  managerPhoto(actor: PilotActor | null, id: number) {
    this.requireManager(actor);
    const row = this.store.db
      .prepare('SELECT record FROM local_listings WHERE id=?')
      .get(id);
    const record = row
      ? (JSON.parse(String(row.record)) as MerchantListing)
      : null;
    const match = record?.fields.imageDataUrl.match(
      /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/,
    );
    if (!match)
      throw new PilotError(404, 'No sample product photo is available.');
    return { type: match[1], bytes: Buffer.from(match[2], 'base64') };
  }
  // Trusted local CLI procedure only. No HTTP route can create admin membership.
  provisionManager(options: { hostedPreview?: boolean } = {}) {
    const hostedCLI =
      options.hostedPreview === true &&
      process.env.ETHNOMART_BACKEND_MODE === 'hosted-preview';
    if (
      !hostedCLI &&
      (process.env.ETHNOMART_BACKEND_MODE !== 'local-catalogue' ||
        process.env.NODE_ENV === 'production')
    )
      throw new Error(
        'Manager provisioning is restricted to the fictional local catalogue.',
      );
    const unusedPasswordHash = bcrypt.hashSync(
      randomBytes(32).toString('base64url'),
      10,
    );
    return this.transaction(() => {
      let user = this.store.userByEmail('manager@example.invalid');
      if (
        user &&
        this.store.db
          .prepare('SELECT id FROM local_shops WHERE owner_id=?')
          .get(user.id)
      )
        throw new Error(
          'The reserved local manager address belongs to a merchant.',
        );
      if (!user) {
        const id = Number(
          this.store.db
            .prepare('SELECT COALESCE(MAX(id),0)+1 AS id FROM local_users')
            .get()!.id,
        );
        this.store.db
          .prepare('INSERT INTO local_users VALUES(?,?,?,?,?)')
          .run(
            id,
            'Sample pilot manager',
            'manager@example.invalid',
            unusedPasswordHash,
            'customer',
          );
        user = this.store.user(id)!;
      }
      this.store.db
        .prepare(
          'INSERT INTO local_admin_memberships VALUES(?,1,?) ON CONFLICT(user_id) DO UPDATE SET active=1',
        )
        .run(user.id, this.now());
      this.store.db
        .prepare(
          'UPDATE local_manager_links SET used_at=? WHERE user_id=? AND used_at IS NULL',
        )
        .run(this.now(), user.id);
      const token = randomBytes(32).toString('base64url'),
        expiresAt = new Date(Date.parse(this.now()) + 15 * 60000).toISOString();
      this.store.db
        .prepare('INSERT INTO local_manager_links VALUES(?,?,?,NULL)')
        .run(tokenHash(token), user.id, expiresAt);
      this.event(
        'access',
        user.id,
        'provisioned',
        user.id,
        'Trusted local CLI provisioned a fictional manager access link.',
      );
      return { path: `/admin/access#token=${token}`, expiresAt };
    });
  }
  consumeManagerLink(input: unknown) {
    const body = object(input, ['token']),
      token = tokenValue(body.token);
    return this.transaction(() => {
      const row = this.store.db
        .prepare('SELECT * FROM local_manager_links WHERE token_hash=?')
        .get(tokenHash(token)) as Row | undefined;
      if (
        !row ||
        row.used_at ||
        String(row.expires_at) <= this.now() ||
        this.store.user(Number(row.user_id))?.role !== 'admin'
      )
        throw new PilotError(
          401,
          'This manager link is invalid, expired or already used. Generate a new local access link.',
        );
      this.store.db
        .prepare('UPDATE local_manager_links SET used_at=? WHERE token_hash=?')
        .run(this.now(), tokenHash(token));
      this.event(
        'access',
        Number(row.user_id),
        'opened',
        Number(row.user_id),
        'One-time local manager link consumed.',
      );
      return Number(row.user_id);
    });
  }
}
