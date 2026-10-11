import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const { createCatalogueApp } = await import(
  new URL('../server/src/catalogue/app.ts', import.meta.url)
);
const { emptyDraft } = await import(
  new URL('../server/src/catalogue/fields.ts', import.meta.url)
);
const dbFile = fileURLToPath(
  new URL(`./integration-${Date.now()}.sqlite3`, import.meta.url),
);
let instance,
  server,
  base,
  checks = [];
const pass = (name, operation) => {
  operation();
  checks.push(name);
};
async function start() {
  instance = createCatalogueApp({ dataFile: dbFile });
  server = await new Promise((resolve) => {
    const running = instance.app.listen(0, '127.0.0.1', () => resolve(running));
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
}
async function stop() {
  await new Promise((resolve) => server.close(resolve));
  instance.store.close();
}
const cookie = { owner: '', other: '', shopper: '' };
async function request(path, { method = 'GET', body, as, headers = {} } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(as && cookie[as] ? { Cookie: cookie[as] } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : typeof body === 'string'
          ? body
          : JSON.stringify(body),
  });
  if (as && response.headers.get('set-cookie'))
    cookie[as] = response.headers.get('set-cookie').split(';')[0];
  const data = response.headers
    .get('content-type')
    ?.includes('application/json')
    ? await response.json()
    : Buffer.from(await response.arrayBuffer());
  return { status: response.status, data, headers: response.headers };
}
const check = async (name, path, options, expected) => {
  const result = await request(path, options);
  pass(name, () => assert.equal(result.status, expected));
  return result;
};
await start();
try {
  let result = await check('Readiness uses actual SQLite', '/readyz', {}, 200);
  pass('Readiness identifies Express and SQLite', () =>
    assert.equal(result.data.storage, 'sqlite'),
  );
  await check(
    'Anonymous merchant access rejected',
    '/pilot/merchant/shops',
    {},
    401,
  );
  await check('Anonymous browser has no user', '/auth/me', {}, 401);
  await check(
    'Foreign origin login rejected',
    '/auth/demo-login',
    {
      method: 'POST',
      body: {},
      headers: { Origin: 'https://foreign.example' },
    },
    403,
  );
  await check(
    'Cross-site mutation rejected',
    '/auth/demo-login',
    { method: 'POST', body: {}, headers: { 'Sec-Fetch-Site': 'cross-site' } },
    403,
  );
  await check(
    'Real role registration disabled',
    '/auth/register',
    { method: 'POST', body: { role: 'admin' } },
    405,
  );
  await check(
    'Invalid password rejected',
    '/auth/login',
    {
      method: 'POST',
      body: { email: 'owner@ethnomart.co.uk', password: 'wrong' },
    },
    401,
  );
  await check(
    'Local sample entry',
    '/auth/demo-login',
    { method: 'POST', body: { role: 'admin' }, as: 'owner' },
    200,
  );
  result = await check(
    'Local account ignores supplied role',
    '/auth/me',
    { as: 'owner' },
    200,
  );
  pass('Demo user cannot become admin', () =>
    assert.equal(result.data.role, 'store_owner'),
  );
  const firstCookie = cookie.owner;
  result = await check(
    'Login rotates session',
    '/auth/demo-login',
    { method: 'POST', body: {}, as: 'owner' },
    200,
  );
  pass('Session ID changed', () => assert.notEqual(cookie.owner, firstCookie));
  result = await check(
    'Session cookie is HttpOnly and strict',
    '/auth/login',
    {
      method: 'POST',
      body: { email: ' OTHER.OWNER@EXAMPLE.INVALID ', password: 'password123' },
      as: 'other',
    },
    200,
  );
  pass('Cookie flags', () =>
    assert.match(result.headers.get('set-cookie'), /HttpOnly.*SameSite=Strict/),
  );
  await check(
    'Shopper login',
    '/auth/login',
    {
      method: 'POST',
      body: { email: 'shopper@example.invalid', password: 'password123' },
      as: 'shopper',
    },
    200,
  );
  await check(
    'Shopper merchant access rejected',
    '/pilot/merchant/shops',
    { as: 'shopper' },
    403,
  );
  await check(
    'Other owner cannot list assigned shop',
    '/pilot/merchant/shops/1/listings',
    { as: 'other' },
    403,
  );
  result = await check(
    'Other owner sees only own shops',
    '/pilot/merchant/shops',
    { as: 'other' },
    200,
  );
  pass('Assignment is scoped', () =>
    assert.deepEqual(
      result.data.map((item) => item.id),
      [10],
    ),
  );
  await check(
    'Anonymous remains separate after owner login',
    '/auth/me',
    {},
    401,
  );
  await check('Pending shops are private', '/stores/11', {}, 404);
  await check(
    'Pending store query is blocked',
    '/stores?approved=false',
    {},
    403,
  );
  result = await check(
    'Public shops exclude private contact and owner',
    '/stores/1',
    {},
    200,
  );
  pass('Public shop projection', () =>
    assert.equal(
      ['ownerId', 'phone', 'email', 'subscriptionTier'].some(
        (key) => key in result.data,
      ),
      false,
    ),
  );
  await check(
    'Legacy product writes disabled',
    '/products',
    { method: 'POST', body: {}, as: 'owner' },
    405,
  );
  await check(
    'Legacy payment routes unmounted',
    '/orders/1/checkout',
    { method: 'POST', body: {}, as: 'owner' },
    404,
  );
  await check('Unknown API is JSON 404', '/not-a-route', {}, 404);
  await check(
    'Invalid JSON rejected',
    '/auth/demo-login',
    { method: 'POST', body: '{' },
    400,
  );
  await check(
    'Oversized body rejected',
    '/auth/demo-login',
    { method: 'POST', body: JSON.stringify({ a: 'x'.repeat(800000) }) },
    413,
  );
  await check(
    'Repeated query parameter rejected',
    '/catalogue/shops/1/products?q=x&q=y',
    {},
    400,
  );
  await check(
    'Long search rejected',
    '/catalogue/shops/1/products?q=' + 'x'.repeat(101),
    {},
    400,
  );
  await check(
    'Page size is bounded',
    '/catalogue/shops/1/products?pageSize=25',
    {},
    400,
  );
  // Self-contained tiny PNG fixture; no dependency on a developer's private database.
  const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  assert.ok(photo);
  const fields = {
    ...emptyDraft,
    name: 'QA Basmati Rice',
    brand: 'QA pantry',
    aliases: 'Chawal\nچاول',
    category: 'Rice & grains',
    packAmount: '5',
    packUnit: 'kg',
    price: '7.95',
    imageDataUrl: photo,
    imageName: 'sample.webp',
    imagePermission: true,
  };
  const create = {
    method: 'POST',
    body: { fields, requestKey: 'integration-draft-0001' },
    as: 'owner',
  };
  result = await check(
    'Save a durable draft',
    '/pilot/merchant/shops/1/listings',
    create,
    201,
  );
  let listing = result.data,
    id = listing.id;
  result = await check(
    'Duplicate create is idempotent',
    '/pilot/merchant/shops/1/listings',
    create,
    201,
  );
  pass('Idempotent ID', () => assert.equal(result.data.id, id));
  await check(
    'Changed duplicate request rejected',
    '/pilot/merchant/shops/1/listings',
    {
      ...create,
      body: { ...create.body, fields: { ...fields, name: 'Changed' } },
    },
    409,
  );
  await check(
    'Draft detail hidden',
    `/catalogue/shops/1/products/${id}`,
    {},
    404,
  );
  await check(
    'Draft photo hidden',
    `/catalogue/shops/1/products/${id}/photo`,
    {},
    404,
  );
  await check(
    'Other owner cannot read listing',
    `/pilot/merchant/listings/${id}`,
    { as: 'other' },
    403,
  );
  await check(
    'Other owner cannot modify listing',
    `/pilot/merchant/listings/${id}`,
    { as: 'other', method: 'PATCH', body: { fields, expectedRevision: 1 } },
    403,
  );
  await check(
    'Review confirmations required',
    `/pilot/merchant/listings/${id}/publish`,
    { as: 'owner', method: 'POST', body: { expectedRevision: 1 } },
    400,
  );
  result = await check(
    'Reviewed publication succeeds',
    `/pilot/merchant/listings/${id}/publish`,
    {
      as: 'owner',
      method: 'POST',
      body: {
        expectedRevision: 1,
        reviewConfirmed: true,
        priceAvailabilityConfirmed: true,
      },
    },
    200,
  );
  listing = result.data;
  result = await check(
    'Published product detail is public',
    `/catalogue/shops/1/products/${id}`,
    {},
    200,
  );
  pass('Exact integer pence and unknown availability', () => {
    assert.equal(result.data.product.pricePence, 795);
    assert.equal(result.data.product.availabilityStatus, 'unknown');
  });
  pass('Public projection hides review internals and inline image', () => {
    assert.ok(!JSON.stringify(result.data).includes('base64'));
    assert.ok(!('events' in result.data.product));
    assert.ok(!('reviewedBy' in result.data.product));
  });
  result = await check(
    'Published photo is served',
    `/catalogue/shops/1/products/${id}/photo`,
    {},
    200,
  );
  pass('Photo bytes preserved', () => assert.ok(result.data.length > 20));
  await check(
    'Wrong shop cannot expose product',
    `/catalogue/shops/2/products/${id}`,
    {},
    404,
  );
  result = await check(
    'Urdu alias search',
    '/catalogue/shops/1/products?q=' + encodeURIComponent('چاول'),
    {},
    200,
  );
  pass('Urdu finds merchant product', () =>
    assert.ok(result.data.items.some((item) => item.id === id)),
  );
  result = await check(
    'Compact pack and brand search',
    '/catalogue/shops/1/products?q=QA%205kg',
    {},
    200,
  );
  pass('Pack and brand match', () => assert.equal(result.data.items[0].id, id));
  result = await check(
    'Alias search is shop scoped',
    '/catalogue/shops/2/products?q=chawal',
    {},
    200,
  );
  pass('No cross-shop product leak', () => assert.equal(result.data.total, 0));
  result = await check(
    'Category filtering',
    '/catalogue/shops/1/products?category=' +
      encodeURIComponent('Rice & grains'),
    {},
    200,
  );
  pass('Category results correct', () =>
    assert.ok(
      result.data.items.every((item) => item.category === 'Rice & grains'),
    ),
  );
  const page1 = await request('/catalogue/shops/1/products?pageSize=2'),
    page2 = await request('/catalogue/shops/1/products?pageSize=2&page=2');
  pass('Deterministic pages without overlap', () => {
    assert.equal(page1.data.items.length, 2);
    assert.ok(
      page1.data.items.every(
        (item) => !page2.data.items.some((other) => item.id === other.id),
      ),
    );
  });
  const stable = await request('/catalogue/shops/1/products?pageSize=2');
  pass('Same query has stable ordering', () =>
    assert.deepEqual(
      stable.data.items.map((item) => item.id),
      page1.data.items.map((item) => item.id),
    ),
  );
  await check(
    'Stale revision rejected',
    `/pilot/merchant/listings/${id}`,
    { as: 'owner', method: 'PATCH', body: { fields, expectedRevision: 0 } },
    409,
  );
  await stop();
  await start();
  result = await check(
    'Owner session survives backend restart',
    '/auth/me',
    { as: 'owner' },
    200,
  );
  pass('Same owner after restart', () => assert.equal(result.data.id, 3));
  await check(
    'Published record survives restart',
    `/catalogue/shops/1/products/${id}`,
    {},
    200,
  );
  await check(
    'Photo survives restart',
    `/catalogue/shops/1/products/${id}/photo`,
    {},
    200,
  );
  result = await check(
    'Editing returns published record to draft',
    `/pilot/merchant/listings/${id}`,
    {
      as: 'owner',
      method: 'PATCH',
      body: { fields: { ...fields, price: '7.951' }, expectedRevision: 1 },
    },
    200,
  );
  listing = result.data;
  await check(
    'Edited product hidden',
    `/catalogue/shops/1/products/${id}`,
    {},
    404,
  );
  await check(
    'Edited photo hidden',
    `/catalogue/shops/1/products/${id}/photo`,
    {},
    404,
  );
  await check(
    'Three decimal price cannot publish',
    `/pilot/merchant/listings/${id}/publish`,
    {
      as: 'owner',
      method: 'POST',
      body: {
        expectedRevision: 2,
        reviewConfirmed: true,
        priceAvailabilityConfirmed: true,
      },
    },
    422,
  );
  pass('Failed publication is rolled back', () =>
    assert.equal(
      instance.store.read(1, (model) =>
        model.get({ id: 3, role: 'store_owner' }, id),
      ).state,
      'draft',
    ),
  );
  result = await check(
    'Save corrected draft',
    `/pilot/merchant/listings/${id}`,
    { as: 'owner', method: 'PATCH', body: { fields, expectedRevision: 2 } },
    200,
  );
  listing = result.data;
  await check(
    'Republish corrected revision',
    `/pilot/merchant/listings/${id}/publish`,
    {
      as: 'owner',
      method: 'POST',
      body: {
        expectedRevision: 3,
        reviewConfirmed: true,
        priceAvailabilityConfirmed: true,
      },
    },
    200,
  );
  await check(
    'Pause publication',
    `/pilot/merchant/listings/${id}/pause`,
    { as: 'owner', method: 'POST', body: { expectedRevision: 3 } },
    200,
  );
  await check(
    'Paused detail hidden',
    `/catalogue/shops/1/products/${id}`,
    {},
    404,
  );
  await check(
    'Paused photo hidden',
    `/catalogue/shops/1/products/${id}/photo`,
    {},
    404,
  );
  instance.store.db
    .prepare('UPDATE local_users SET role=? WHERE id=3')
    .run('customer');
  await check(
    'Role revocation applies to existing cookie',
    '/pilot/merchant/shops',
    { as: 'owner' },
    403,
  );
  instance.store.db
    .prepare('UPDATE local_users SET role=? WHERE id=3')
    .run('store_owner');
  instance.store.db
    .prepare('UPDATE local_shops SET owner_id=5 WHERE id=1')
    .run();
  await check(
    'Ownership revocation applies immediately',
    `/pilot/merchant/listings/${id}`,
    { as: 'owner' },
    403,
  );
  instance.store.db
    .prepare('UPDATE local_shops SET owner_id=3,approved=0 WHERE id=1')
    .run();
  await check(
    'Inactive shop hides catalogue',
    '/catalogue/shops/1/products',
    {},
    404,
  );
  instance.store.db
    .prepare('UPDATE local_shops SET approved=1 WHERE id=1')
    .run();
  await check(
    'Logout destroys session',
    '/auth/logout',
    { as: 'owner', method: 'POST', body: {} },
    200,
  );
  await check('Logged out cookie rejected', '/auth/me', { as: 'owner' }, 401);
  pass('No permissive reflected CORS', () =>
    assert.equal(result.headers.get('access-control-allow-origin'), null),
  );
  pass('Database blocks published null review revision', () =>
    assert.throws(() =>
      instance.store.db
        .prepare(
          "UPDATE local_listings SET state='published',record=json_set(record,'$.reviewedRevision',NULL) WHERE id=?",
        )
        .run(id),
    ),
  );
  pass('Audit events persisted', () =>
    assert.ok(
      instance.store.db
        .prepare('SELECT COUNT(*) AS n FROM local_events WHERE listing_id=?')
        .get(id).n >= 6,
    ),
  );
} finally {
  if (server?.listening) await stop();
}
writeFileSync(
  new URL('./results.json', import.meta.url),
  JSON.stringify({ passed: checks.length, database: dbFile, checks }, null, 2),
);
console.log(`${checks.length} backend and persistence checks passed.`);
