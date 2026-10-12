import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { runtimeConfig, dataLocation } from '../server/src/config.ts';
import { createHostedApp } from '../server/src/hosted-app.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const sandbox = mkdtempSync(join(tmpdir(), 'ethnomart-hosting-'));
const config = runtimeConfig(root, {
  ETHNOMART_DATA_FILE: join(sandbox, 'private/catalogue.sqlite3'),
  PUBLIC_ORIGIN: 'https://preview.example.invalid',
  PORT: '3000',
  TRUST_PROXY: '1',
  ETHNOMART_COMING_SOON: 'false',
});

test('Both Hostinger entry files work directly and through a CommonJS hosting loader', async () => {
  for (const { entry, loader } of ['app.js', 'dist/app.js'].flatMap((entry) =>
    ['direct', 'require'].map((loader) => ({ entry, loader })),
  )) {
    const reserve = createServer();
    await new Promise((resolve) => reserve.listen(0, '127.0.0.1', resolve));
    const port = reserve.address().port;
    await new Promise((resolve) => reserve.close(resolve));
    const args =
      loader === 'require'
        ? [
            '--input-type=commonjs',
            '-e',
            `require(${JSON.stringify('./' + entry)});`,
          ]
        : [entry];
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        TRUST_PROXY: '1',
        ETHNOMART_COMING_SOON: 'false',
        ETHNOMART_DATA_FILE: join(
          sandbox,
          'entry-' + port,
          'catalogue.sqlite3',
        ),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let logs = '';
    child.stdout.on('data', (data) => {
      logs += data;
    });
    child.stderr.on('data', (data) => {
      logs += data;
    });
    try {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        if (child.exitCode !== null)
          throw new Error(`Entry ${entry} with ${loader} failed: ` + logs);
        try {
          const response = await fetch(`http://127.0.0.1:${port}/api/readyz`);
          if (response.ok) {
            assert.equal((await response.json()).mode, 'hosted-preview');
            ready = true;
            break;
          }
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.ok(ready, 'Compiled entry did not become ready: ' + logs);
      const html = await (
        await fetch(`http://127.0.0.1:${port}/clothing`)
      ).text();
      assert.match(html, /id="root"/);
    } finally {
      if (child.exitCode === null) {
        const ended = new Promise((resolve) => child.once('exit', resolve));
        child.kill('SIGTERM');
        await ended;
      }
    }
  }
});

test('Deployment configuration preserves data outside release folders', () => {
  const first = join(
    sandbox,
    'domains',
    'ethnomart.test',
    'hbuilds',
    'versions',
    'first',
    'nodejs',
  );
  const second = join(
    sandbox,
    'domains',
    'ethnomart.test',
    'hbuilds',
    'versions',
    'second',
    'nodejs',
  );
  assert.equal(dataLocation(first, {}), dataLocation(second, {}));
  assert.equal(
    dataLocation(first, {}),
    join(
      sandbox,
      'domains',
      'ethnomart.test',
      '.ethnomart',
      'catalogue.sqlite3',
    ),
  );
  assert.throws(
    () =>
      dataLocation(root, {
        ETHNOMART_DATA_FILE: join(root, 'dist/catalogue.sqlite3'),
      }),
    /outside/,
  );
  assert.throws(
    () =>
      dataLocation(root, {
        ETHNOMART_DATA_FILE: join(sandbox, 'public_html/catalogue.sqlite3'),
      }),
    /outside/,
  );
  assert.throws(
    () =>
      dataLocation(root, { ETHNOMART_DATA_FILE: '.local/catalogue.sqlite3' }),
    /absolute/,
  );
  assert.throws(() => dataLocation(root, {}), /Set ETHNOMART_DATA_FILE/);
  for (const port of ['0', '-1', '80000', 'NaN'])
    assert.throws(
      () =>
        runtimeConfig(root, {
          ETHNOMART_DATA_FILE: config.dataFile,
          PORT: port,
        }),
      /PORT/,
    );
  for (const origin of [
    'http://ethnomart.test',
    'https://ethnomart.test/private',
    'https://user:secret@ethnomart.test',
  ])
    assert.throws(
      () =>
        runtimeConfig(root, {
          ETHNOMART_DATA_FILE: config.dataFile,
          PUBLIC_ORIGIN: origin,
        }),
      /HTTPS/,
    );
  assert.throws(
    () =>
      runtimeConfig(root, {
        ETHNOMART_DATA_FILE: config.dataFile,
        SESSION_SECRET: 'short',
      }),
    /SESSION_SECRET/,
  );
  assert.throws(
    () =>
      runtimeConfig(root, {
        ETHNOMART_DATA_FILE: config.dataFile,
        TRUST_PROXY: 'true',
      }),
    /TRUST_PROXY/,
  );
});

test('Hosted frontend, API, secure sessions and private data work together', async (t) => {
  process.env.NODE_ENV = 'production';
  process.env.ETHNOMART_BACKEND_MODE = 'hosted-preview';
  let instance, server, base;
  const start = async () => {
    instance = createHostedApp(config);
    server = await new Promise((resolve) => {
      const s = instance.website.listen(0, '127.0.0.1', () => resolve(s));
    });
    base = `http://127.0.0.1:${server.address().port}`;
  };
  const stop = async () => {
    await new Promise((resolve) => server.close(resolve));
    instance.store.close();
  };
  const request = async (
    path,
    {
      body,
      method = body ? 'POST' : 'GET',
      cookie,
      origin = config.publicOrigin,
      forwarded = 'https',
    } = {},
  ) =>
    fetch(base + path, {
      method,
      headers: {
        'X-Forwarded-Proto': forwarded,
        ...(origin ? { Origin: origin } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  await start();
  let cookie, reference;
  try {
    await t.test(
      "Coming soon covers deep links and can reopen without replacing website data",
      async () => {
        try {
          config.comingSoon = true;
          for (const path of [
            "/",
            "/shops",
            "/clothing",
            "/events/neighbourhood-craft-table",
            "/admin/merchant-pilot",
            "/index.html",
            "/unknown-page",
          ]) {
            const r = await request(path),
              html = await r.text();
            assert.equal(r.status, 200, path);
            assert.match(html, /Coming soon\./);
            assert.match(html, /\/brand\/ethnomart-logo\.png/);
            assert.ok(!html.includes('id="root"'), path);
            assert.equal(r.headers.get("cache-control"), "no-store");
          }
          assert.equal(
            (await request("/shops", { method: "HEAD" })).status,
            200,
          );
          assert.match(
            (await request("/coming-soon.css")).headers.get("content-type"),
            /text\/css/,
          );
          assert.equal(
            (await request("/brand/ethnomart-logo.png")).status,
            200,
          );
          assert.equal((await request("/api/readyz")).status, 200);
          assert.equal((await request("/.env")).status, 404);
        } finally {
          config.comingSoon = false;
        }
        assert.match(await (await request("/clothing")).text(), /id="root"/);
        assert.equal((await request("/api/readyz")).status, 200);
      },
    );
    await t.test(
      'Production starts and reports the connected database',
      async () => {
        const r = await request('/api/readyz');
        const d = await r.json();
        assert.equal(r.status, 200);
        assert.equal(d.mode, 'hosted-preview');
        assert.equal(d.schemaVersion, 3);
        assert.equal(d.persistent, true);
      },
    );
    await t.test(
      'All destination and detail links return the built frontend',
      async () => {
        for (const path of [
          '/',
          '/clothing',
          '/shops',
          '/store/12',
          '/store/12/product/33',
          '/communities',
          '/community/pakistani',
          '/events/neighbourhood-craft-table',
          '/jobs/sample-shop-assistant',
          '/merchant',
          '/admin/community',
        ]) {
          const r = await request(path),
            html = await r.text();
          assert.equal(r.status, 200, path);
          assert.match(html, /id="root"/);
          assert.match(html, /noindex, nofollow/);
          assert.ok(!html.includes('/src/main.tsx'));
          assert.ok(r.headers.get('content-security-policy'));
        }
      },
    );
    await t.test(
      'Missing assets, source files and unknown API paths are not SPA HTML',
      async () => {
        for (const path of [
          '/images/missing.avif',
          '/server/src/catalogue/store.ts',
          '/.env',
          '/package.json',
          '/api/no-such-route',
        ]) {
          const r = await request(path);
          assert.equal(r.status, 404, path);
          assert.match(r.headers.get('content-type'), /json/);
        }
      },
    );
    await t.test(
      'Grocery search and nine distinct garment photos reach the real API',
      async () => {
        const rice = await (
          await request('/api/platform/search?q=rice')
        ).json();
        assert.ok(rice.items.some((i) => i.kind === 'grocery'));
        const garments = await (
          await request('/api/platform/search?kind=clothing')
        ).json();
        assert.equal(garments.total, 9);
        assert.equal(new Set(garments.items.map((i) => i.imageUrl)).size, 9);
      },
    );
    await t.test(
      'All generated responsive images are served with correct MIME types',
      async () => {
        const directory = new URL(
          '../frontend/public/images/individual/',
          import.meta.url,
        );
        const { readdirSync } = await import('node:fs');
        const files = readdirSync(directory).filter((f) =>
          /\.(avif|webp)$/.test(f),
        );
        assert.equal(files.length, 390);
        for (let offset = 0; offset < files.length; offset += 10)
          await Promise.all(
            files.slice(offset, offset + 10).map(async (file) => {
              const r = await request('/images/individual/' + file);
              assert.equal(r.status, 200, file);
              assert.match(
                r.headers.get('content-type'),
                /^image\/(avif|webp)/,
              );
              assert.equal(
                Number(r.headers.get('content-length')),
                readFileSync(new URL(file, directory)).length,
              );
            }),
          );
      },
    );
    await t.test('Hashed scripts are cached; HTML is revalidated', async () => {
      const html = readFileSync(
        join(config.staticDirectory, 'index.html'),
        'utf8',
      );
      const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/)[1];
      const r = await request(asset);
      assert.match(r.headers.get('cache-control'), /immutable/);
      const page = await request('/');
      assert.equal(page.headers.get('cache-control'), 'no-cache');
    });
    await t.test(
      'Local one-click login and known starter passwords are unavailable',
      async () => {
        assert.equal(
          (await request('/api/auth/demo-login', { body: {} })).status,
          404,
        );
        assert.equal(
          (
            await request('/api/auth/login', {
              body: { email: 'owner@ethnomart.co.uk', password: 'password123' },
            })
          ).status,
          401,
        );
        assert.equal(
          await bcrypt.compare(
            'password123',
            instance.store.user(3).passwordHash,
          ),
          false,
        );
      },
    );
    await t.test(
      'Foreign origin, missing origin and HTTP mutations are rejected',
      async () => {
        const payload = {
          kind: 'contact',
          name: 'Test Person',
          email: 'test@example.invalid',
          message: 'Sample message',
          sampleOnly: true,
          requestKey: 'blocked-origin-contact',
        };
        for (const options of [
          { origin: 'https://outside.example.invalid' },
          { origin: null },
          { forwarded: 'http' },
        ])
          assert.equal(
            (
              await request('/api/platform/responses', {
                body: payload,
                ...options,
              })
            ).status,
            403,
          );
      },
    );
    await t.test(
      'Public visitors cannot read manager or merchant private queues',
      async () => {
        for (const path of [
          '/api/platform/manager',
          '/api/onboarding/overview',
          '/api/pilot/merchant/shops',
        ])
          assert.equal((await request(path)).status, 401);
        assert.equal((await request('/api/stores/11')).status, 404);
      },
    );
    await t.test(
      'A trusted one-time manager link yields an HTTPS-only session',
      async () => {
        assert.throws(
          () => instance.onboarding.provisionManager(),
          /restricted/,
        );
        const access = instance.onboarding.provisionManager({
          hostedPreview: true,
        });
        const token = new URLSearchParams(access.path.split('#')[1]).get(
          'token',
        );
        const r = await request('/api/auth/manager-access', {
          body: { token },
        });
        assert.equal(r.status, 200);
        const header = r.headers.get('set-cookie');
        assert.match(header, /ethnomart\.sid=/);
        assert.match(header, /HttpOnly/);
        assert.match(header, /Secure/);
        assert.match(header, /SameSite=Strict/);
        cookie = header.split(';')[0];
        assert.equal(
          (await request('/api/auth/manager-access', { body: { token } }))
            .status,
          401,
        );
        assert.equal(
          (await request('/api/platform/manager', { cookie })).status,
          200,
        );
      },
    );
    await t.test(
      'A fictional contact receipt is stored and real email details are rejected',
      async () => {
        const payload = {
          kind: 'contact',
          name: 'Test Person',
          email: 'test@example.invalid',
          message: 'Hosted persistence sentinel',
          sampleOnly: true,
          requestKey: 'hosted-contact-response',
        };
        const r = await request('/api/platform/responses', { body: payload });
        assert.equal(r.status, 201);
        reference = (await r.json()).reference;
        assert.equal(
          (
            await request('/api/platform/responses', {
              body: {
                ...payload,
                email: 'real@example.com',
                requestKey: 'real-address-block',
              },
            })
          ).status,
          422,
        );
      },
    );
    await stop();
    await start();
    await t.test(
      'The private database, receipt and session survive a server restart',
      async () => {
        assert.ok(existsSync(config.dataFile));
        const r = await request('/api/platform/manager', { cookie });
        assert.equal(r.status, 200);
        const d = await r.json();
        assert.ok(
          d.responses.some(
            (i) =>
              `ER-${i.id}` === reference &&
              i.message === 'Hosted persistence sentinel',
          ),
        );
        assert.equal(
          instance.store.db.prepare('PRAGMA integrity_check').get()
            .integrity_check,
          'ok',
        );
        assert.equal(
          instance.store.db.prepare('PRAGMA foreign_key_check').all().length,
          0,
        );
      },
    );
    await t.test(
      'A backup includes stored records without public download access',
      async () => {
        const { backup } = await import('node:sqlite');
        const file = join(sandbox, 'private/snapshot.sqlite3');
        await backup(instance.store.db, file);
        const copy = new DatabaseSync(file, { readOnly: true });
        try {
          assert.equal(
            copy.prepare('SELECT COUNT(*) n FROM local_responses').get().n,
            1,
          );
        } finally {
          copy.close();
        }
        assert.equal(
          (await request('/.ethnomart/catalogue.sqlite3')).status,
          404,
        );
      },
    );
  } finally {
    await stop();
  }
});
