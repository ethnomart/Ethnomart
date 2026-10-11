import express, { type ErrorRequestHandler, type Request } from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { PlatformService } from './platform.ts';
import { OnboardingService } from './onboarding.ts';
import { LocalCatalogueStore, SqliteSessionStore } from './store.ts';
import { PilotError } from './domain.ts';
import { cities, communities } from './fixtures.ts';
import { positiveId, productPage, queryText } from './search.ts';

export function createCatalogueApp(options: {
  dataFile: string;
  importFile?: string;
  frontendOrigin?: string;
  deployment?: 'local' | 'hosted-preview';
  trustProxy?: number;
  sessionSecret?: string;
}) {
  const hosted = options.deployment === 'hosted-preview';
  if (process.env.NODE_ENV === 'production' && !hosted)
    throw new Error(
      'The fictional local catalogue cannot run as a production service.',
    );
  const store = new LocalCatalogueStore(options.dataFile, options.importFile, {
    disableSeedPasswords: hosted,
  });
  const onboarding = new OnboardingService(store);
  const platform = new PlatformService(store);
  const app = express();
  app.disable('x-powered-by');
  if (hosted) app.set('trust proxy', options.trustProxy ?? 1);
  const cookieName = hosted ? 'ethnomart.sid' : 'ethnomart.local.sid';
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      const allowed = hosted
        ? new Set([
            options.frontendOrigin || `${req.protocol}://${req.get('host')}`,
          ])
        : new Set([
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            options.frontendOrigin,
          ]);
      if (hosted && (!req.secure || !origin))
        return next(
          new PilotError(
            403,
            'Use the HTTPS EthnoMart website for this request.',
          ),
        );
      if (
        req.get('sec-fetch-site') === 'cross-site' ||
        (origin && !allowed.has(origin))
      )
        return next(
          new PilotError(
            403,
            'This request must come from the EthnoMart website.',
          ),
        );
    }
    next();
  });
  app.use(express.json({ limit: 786432 }));
  app.use(
    session({
      name: cookieName,
      secret: options.sessionSecret || store.meta('session_secret')!,
      store: new SqliteSessionStore(store),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: hosted,
        maxAge: 86400000,
      },
    }),
  );
  const actor = (req: Request) =>
    store.user(
      (req.session as session.Session & { userId?: number }).userId || 0,
    );
  const userDto = (user: NonNullable<ReturnType<typeof actor>>) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: '2026-01-01T00:00:00.000Z',
    isDemo: true,
  });
  const signIn = async (req: Request, id: number) => {
    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((error) => (error ? reject(error) : resolve())),
    );
    (req.session as session.Session & { userId?: number }).userId = id;
    await new Promise<void>((resolve, reject) =>
      req.session.save((error) => (error ? reject(error) : resolve())),
    );
    return userDto(store.user(id)!);
  };
  const api = express.Router();
  const attempts = new Map<string, { count: number; until: number }>();
  api.get(['/healthz', '/readyz'], (_req, res) => {
    store.db.prepare('SELECT 1').get();
    res.json({
      status: 'ok',
      backend: 'express',
      storage: 'sqlite',
      mode: hosted ? 'hosted-preview' : 'local-catalogue',
      persistent: options.dataFile !== ':memory:',
      schemaVersion: Number(store.meta('schema_version')),
    });
  });
  api.get('/auth/me', (req, res) => {
    const user = actor(req);
    if (!user) throw new PilotError(401, 'Sign in to the merchant workspace.');
    res.json(userDto(user));
  });
  api.post('/auth/demo-login', async (req, res) => {
    if (hosted)
      throw new PilotError(
        404,
        'Sample one-click login is disabled on the hosted website.',
      );
    res.json(await signIn(req, 3));
  });
  api.post('/auth/login', async (req, res) => {
    const ip = req.ip || 'local';
    for (const [key, value] of attempts)
      if (value.until < Date.now()) attempts.delete(key);
    const attempt = attempts.get(ip) || { count: 0, until: Date.now() + 60000 };
    if (++attempt.count > 15)
      throw new PilotError(429, 'Please wait a minute before trying again.');
    attempts.set(ip, attempt);
    const { email, password } = req.body || {};
    if (
      typeof email !== 'string' ||
      email.length > 254 ||
      typeof password !== 'string' ||
      password.length > 128
    )
      throw new PilotError(400, 'Enter a valid email and password.');
    const user = store.userByEmail(email.trim().toLowerCase());
    if (
      !user ||
      (hosted && [2, 3, 5].includes(user.id)) ||
      !(await bcrypt.compare(password, user.passwordHash))
    )
      throw new PilotError(401, 'Email or password was not recognised.');
    res.json(await signIn(req, user.id));
  });
  api.post('/auth/logout', async (req, res) => {
    await new Promise<void>((resolve, reject) =>
      req.session.destroy((error) => (error ? reject(error) : resolve())),
    );
    res.clearCookie(cookieName, {
      sameSite: 'strict',
      httpOnly: true,
      secure: hosted,
    });
    res.json({ success: true });
  });
  api.post('/auth/register', () => {
    throw new PilotError(
      405,
      'Real registration is not open in this local demonstration.',
    );
  });
  const slugs: Record<string, string> = {
    pakistan: 'pakistani',
    india: 'indian',
    bangladesh: 'bangladeshi',
    nepal: 'nepali',
  };
  const publicCommunities = () =>
    communities.map((item) => ({
      ...item,
      slug: slugs[item.slug] || item.slug,
      description: `Explore ${item.name} shops, culture and community activities.`,
      storeCount: store
        .shops()
        .filter((shop) => shop.isApproved && shop.communityId === item.id)
        .length,
    }));
  api.get('/cities', (_req, res) => res.json(cities));
  api.get('/communities', (_req, res) => res.json(publicCommunities()));
  api.get('/communities/:slug', (req, res) => {
    const value = publicCommunities().find(
      (item) =>
        item.slug === req.params.slug ||
        communities.find((source) => source.id === item.id)?.slug ===
          req.params.slug,
    );
    if (!value) throw new PilotError(404, 'Community not found.');
    res.json(value);
  });
  api.get('/stores', (req, res) => {
    if (req.query.approved !== undefined && req.query.approved !== 'true')
      throw new PilotError(403, 'Only public sample shops can be browsed.');
    const communityId =
      req.query.communityId === undefined
        ? null
        : positiveId(req.query.communityId);
    const cityId =
      req.query.cityId === undefined ? null : positiveId(req.query.cityId);
    const q = queryText(req.query.search).toLowerCase();
    res.json(
      store
        .shops()
        .filter(
          (shop) =>
            shop.isApproved &&
            (!communityId || shop.communityId === communityId) &&
            (!cityId || shop.cityId === cityId) &&
            (!q || `${shop.name} ${shop.category}`.toLowerCase().includes(q)),
        )
        .map((shop) => store.publicShop(shop.id)),
    );
  });
  api.get('/stores/:id', (req, res) =>
    res.json(store.publicShop(positiveId(req.params.id))),
  );
  api.get('/stores/:id/products', (req, res) =>
    res.json(
      productPage(store.publicProducts(positiveId(req.params.id)), {
        ...req.query,
        pageSize: req.query.pageSize ?? '24',
      }).items,
    ),
  );
  api.all(
    ['/stores', '/stores/:id', '/stores/:id/approve'],
    (_req, _res, next) =>
      next(
        new PilotError(
          405,
          'Shop onboarding is not open in the local demonstration.',
        ),
      ),
  );
  api.all(['/products', '/products/:id'], () => {
    throw new PilotError(405, 'Use the reviewed merchant catalogue workflow.');
  });
  api.get('/catalogue/shops/:storeId/products', (req, res) =>
    res.json(
      productPage(
        store.publicProducts(positiveId(req.params.storeId)),
        req.query,
      ),
    ),
  );
  api.get('/catalogue/shops/:storeId/products/:id', (req, res) => {
    const storeId = positiveId(req.params.storeId),
      id = positiveId(req.params.id);
    const product = store
      .publicProducts(storeId)
      .find((item) => item.id === id);
    if (!product)
      throw new PilotError(
        404,
        'This product is unavailable. It may have been edited or paused.',
      );
    res.json({ shop: store.publicShop(storeId), product });
  });
  api.get('/catalogue/shops/:storeId/products/:id/photo', (req, res) => {
    const photo = store.photo(
      positiveId(req.params.storeId),
      positiveId(req.params.id),
    );
    res.type(photo.type).send(photo.bytes);
  });
  api.get('/pilot/merchant/shops', (req, res) =>
    res.json(
      store.read(undefined, (catalogue) => catalogue.shopsFor(actor(req))),
    ),
  );
  api.get('/pilot/merchant/shops/:id/listings', (req, res) => {
    const id = positiveId(req.params.id);
    res.json(store.read(id, (catalogue) => catalogue.list(actor(req), id)));
  });
  api.post('/pilot/merchant/shops/:id/listings', (req, res) => {
    const id = positiveId(req.params.id);
    res
      .status(201)
      .json(
        store.mutate(actor(req), id, (catalogue, current) =>
          catalogue.create(current, id, req.body?.fields, req.body?.requestKey),
        ),
      );
  });
  api.get('/pilot/merchant/listings/:id', (req, res) => {
    const id = positiveId(req.params.id),
      user = actor(req),
      shop = store.listingShop(user, id);
    res.json(store.read(shop, (catalogue) => catalogue.get(user, id)));
  });
  api.patch('/pilot/merchant/listings/:id', (req, res) => {
    const id = positiveId(req.params.id),
      user = actor(req),
      shop = store.listingShop(user, id);
    res.json(
      store.mutate(user, shop, (catalogue, current) =>
        catalogue.update(
          current,
          id,
          req.body?.fields,
          req.body?.expectedRevision,
        ),
      ),
    );
  });
  api.post('/pilot/merchant/listings/:id/publish', (req, res) => {
    const id = positiveId(req.params.id),
      user = actor(req),
      shop = store.listingShop(user, id);
    res.json(
      store.mutate(user, shop, (catalogue, current) =>
        catalogue.publish(
          current,
          id,
          req.body?.expectedRevision,
          req.body?.reviewConfirmed,
          req.body?.priceAvailabilityConfirmed,
        ),
      ),
    );
  });
  api.post('/pilot/merchant/listings/:id/pause', (req, res) => {
    const id = positiveId(req.params.id),
      user = actor(req),
      shop = store.listingShop(user, id);
    res.json(
      store.mutate(user, shop, (catalogue, current) =>
        catalogue.pause(current, id, req.body?.expectedRevision),
      ),
    );
  });
  const requestLimits = new Map<string, { count: number; until: number }>();
  const limit = (key: string, max: number) => {
    for (const [item, value] of requestLimits)
      if (value.until < Date.now()) requestLimits.delete(item);
    const current = requestLimits.get(key) || {
      count: 0,
      until: Date.now() + 60000,
    };
    if (++current.count > max)
      throw new PilotError(429, 'Please wait a minute before trying again.');
    requestLimits.set(key, current);
  };
  api.post('/onboarding/requests', (req, res) => {
    limit(`request:${req.ip}`, 10);
    res.status(201).json(onboarding.submit(req.body));
  });
  api.get('/onboarding/overview', (req, res) =>
    res.json(onboarding.overview(actor(req))),
  );
  for (const action of ['approve', 'reject', 'reissue', 'revoke'] as const)
    api.post(`/onboarding/requests/:id/${action}`, (req, res) =>
      res.json(
        onboarding.decide(
          actor(req),
          positiveId(req.params.id),
          action,
          req.body,
        ),
      ),
    );
  api.post('/onboarding/invitations/preview', (req, res) => {
    limit(`invite:${req.ip}`, 30);
    res.json(onboarding.preview(req.body));
  });
  api.post('/onboarding/invitations/accept', async (req, res) => {
    limit(`accept:${req.ip}`, 10);
    res.status(201).json(await onboarding.accept(req.body));
  });
  api.post('/auth/manager-access', async (req, res) => {
    limit(`manager:${req.ip}`, 10);
    res.json(await signIn(req, onboarding.consumeManagerLink(req.body)));
  });
  api.get('/onboarding/shops/:id', (req, res) =>
    res.json(onboarding.manageShop(actor(req), positiveId(req.params.id))),
  );
  api.post('/onboarding/shops/:id/state', (req, res) =>
    res.json(
      onboarding.setShopState(actor(req), positiveId(req.params.id), req.body),
    ),
  );
  api.post('/onboarding/listings/:id/moderation', (req, res) =>
    res.json(
      onboarding.setListingBlock(
        actor(req),
        positiveId(req.params.id),
        req.body,
      ),
    ),
  );
  api.get('/onboarding/listings/:id/photo', (req, res) => {
    const photo = onboarding.managerPhoto(
      actor(req),
      positiveId(req.params.id),
    );
    res.type(photo.type).send(photo.bytes);
  });
  api.get('/platform/meta', (_req, res) => res.json(platform.meta()));
  api.get('/platform/saved', (req, res) =>
    res.json(platform.saved(req.query.keys)),
  );
  api.get('/platform/search', (req, res) =>
    res.json(platform.search(req.query)),
  );
  api.get('/platform/communities/:slug', (req, res) =>
    res.json(platform.community(String(req.params.slug))),
  );
  api.get('/platform/events/:slug/calendar', (req, res) =>
    res
      .set(
        'Content-Disposition',
        'attachment; filename=ethnomart-sample-event.ics',
      )
      .type('text/calendar; charset=utf-8')
      .send(platform.calendar(String(req.params.slug))),
  );
  api.get('/platform/events/:slug', (req, res) =>
    res.json(platform.detail('event', String(req.params.slug))),
  );
  api.get('/platform/jobs/:slug', (req, res) =>
    res.json(platform.detail('job', String(req.params.slug))),
  );
  api.post('/platform/responses', (req, res) => {
    limit(`response:${req.ip}`, 10);
    res.status(201).json(platform.respond(req.body));
  });
  api.post('/platform/contributions', (req, res) => {
    limit(`contribution:${req.ip}`, 10);
    res.status(201).json(platform.contribute(req.body));
  });
  api.post('/platform/content/:id/reports', (req, res) => {
    limit(`report:${req.ip}`, 10);
    res.status(201).json(platform.report(positiveId(req.params.id), req.body));
  });
  api.get('/platform/manager', (req, res) =>
    res.json(platform.overview(actor(req))),
  );
  api.post('/platform/manager/content/:id', (req, res) =>
    res.json(
      platform.decide(
        actor(req),
        'content',
        positiveId(req.params.id),
        req.body,
      ),
    ),
  );
  api.post('/platform/manager/reports/:id', (req, res) =>
    res.json(
      platform.decide(
        actor(req),
        'report',
        positiveId(req.params.id),
        req.body,
      ),
    ),
  );
  app.use('/api', api);
  app.use((_req, _res, next) =>
    next(
      new PilotError(404, 'This route is unavailable in the catalogue pilot.'),
    ),
  );
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    const status =
      error instanceof PilotError
        ? error.status
        : error?.type === 'entity.too.large'
          ? 413
          : error instanceof SyntaxError &&
              (error as SyntaxError & { status?: number }).status === 400
            ? 400
            : 500;
    res.status(status).json({
      error:
        error instanceof PilotError
          ? error.message
          : status === 413
            ? 'This request is too large.'
            : status === 400
              ? 'This request contains invalid JSON.'
              : 'The catalogue could not complete this request.',
      ...(error instanceof PilotError && error.fields
        ? { fields: error.fields }
        : {}),
    });
  };
  app.use(errors);
  return { app, store, onboarding, platform };
}
