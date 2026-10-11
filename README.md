# EthnoMart

A multicultural discovery website for groceries, clothing, communities, events and jobs. React/Vite and the Express catalogue API run on the same domain. This release contains clearly labelled fictional listings and sample-only forms.

## Deploy on Hostinger Node.js Web Apps

In hPanel, add a **Node.js Web App** and choose **Upload files** to upload `ethnomart-hostinger-source.zip`. The ZIP contains the source code, package lockfile and assets; Hostinger installs dependencies and builds it. Keep `package.json` at the selected root directory.

For GitHub deployment later, connect the EthnoMart repository and choose `main` after this source has been pushed using an account with access to it. Both methods use the settings below.

| Setting | Value |
| --- | --- |
| Framework | Express |
| Node.js | 24.x |
| Package manager | npm |
| Root directory | Repository root (`/`) |
| Install command, if shown | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Entry file | `app.js` |
| Start command, if shown | `npm start` |

The root `app.js` launches the built server. A second launcher at `dist/app.js` is also generated for interfaces that expect the entry file within the output directory. Choose Express, rather than a static Vite-only deployment, to retain the API.

Both launchers support direct Node startup and LiteSpeed's CommonJS `require()` loader. They import the server without top-level `await` and log startup errors to the runtime log.

Set `NODE_ENV=production` and `TRUST_PROXY=1` in hPanel. Hostinger supplies `PORT`; do not replace it with the development port. `PUBLIC_ORIGIN` is optional: set it to the exact HTTPS domain currently serving the website, such as your Hostinger temporary URL. Update it when switching domains. When omitted, mutations are restricted to the HTTPS origin of the incoming website request. Cookie security relies on the configured proxy hop count matching Hostinger's routing.

Deploy, then verify:

- `/api/readyz` returns `status: ok`, `mode: hosted-preview`, `storage: sqlite`, `schemaVersion: 3`.
- Refreshing `/clothing`, `/community/pakistani` and an event detail loads the website.
- A fictional contact submission returns a receipt; real email addresses remain rejected.
- The private database and that receipt survive a redeployment on the actual hosting account.

## Database and redeployment

Node 24 supplies SQLite without a third-party native database module. The database holds sample catalogue records, private review queues and sessions.

Hostinger documents versioned deployments under `/home/USER/domains/DOMAIN/hbuilds/`. The app detects that layout and places its database at `/home/USER/domains/DOMAIN/.ethnomart/catalogue.sqlite3`, outside the replaceable deployment and public folders. The runtime creates the private folder on first start. This location is a deliberate application choice; Hostinger's documentation does not separately guarantee SQLite persistence or permissions for every account. Verify it with a stored sample receipt and redeployment before depending on it.

If the layout is different, set `ETHNOMART_DATA_FILE` to a private absolute path outside the release, `hbuilds` and `public_html`. The app refuses an unsafe path. If the hosting account does not permit a persistent private directory, a durable database adapter is required before accepting important records. Connecting the Hostinger database wizard alone does not convert this SQLite application to MySQL, PostgreSQL or MongoDB.

Do not upload the database, `.env`, session secrets or invitation links to GitHub. The first hosted database is seeded from fictional source fixtures; your existing local database is not copied or published.

## Manager and merchant access

Hosted mode disables one-click demo login and starter passwords. Existing invitation authentication, merchant ownership, review revisions and independent moderation continue to apply. Manager membership can only be provisioned through a trusted server command, never through public registration.

If your plan provides SSH/terminal access, run these in the deployed project with the same environment variables as the website:

```sh
npm run manager-link
npm run backup
```

The manager command prints a private link that expires after 15 minutes and can be consumed once. If `PUBLIC_ORIGIN` is unset, replace `YOUR_HTTPS_ORIGIN` in the printed link with the current website origin. Keep the link private. Backups use SQLite's backup API and are saved in the private data directory's `backups` folder. Download them securely; take a backup before upgrading the schema. If server-command access is unavailable, arrange trusted operator access before using manager/merchant review flows.

## Development and checks

Use Node 24:

```sh
npm ci
npm run build
npm test
```

For development, run `npm run dev:api` and `npm run dev` in separate terminals. The frontend uses `http://127.0.0.1:5174` and proxies to the API on port 3002.

For a local production-mode check, set `ETHNOMART_DATA_FILE` to an absolute private path outside this checkout, then run `npm start`. The production server defaults to port 3000 if no `PORT` is supplied. Hosted mutations require HTTPS, including when testing behind a simulated proxy.

Tests cover the compiled website and API, deep links, all 390 individual responsive image assets, secure sessions, private queues, database persistence and catalogue publication. CI runs installation, type checks, both builds and tests on Node 24.

The typography plugin pins an older CSS parser. The scoped `package.json` override supplies `postcss-selector-parser` 7.1.6 to address GHSA-rj75-hqrm-r3gf while retaining the current plugin. Revisit the override when the plugin supports a patched parser directly. Esbuild is pinned to 0.28.2 for the build scripts and Vite.

## Release scope

This is the current sample website deployed with a production runtime. Sample events, jobs, merchant accounts and stock claims are fictional. Real registration, payments, deliveries and external email are not connected. Real operator details, permitted live listings and policies are still needed for an operational marketplace. The preview remains `noindex` while fictional content is present.

## Hosting references

Checked 12 October 2026:

- [Hostinger Node.js deployment and file locations](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Supported Node.js versions](https://www.hostinger.com/support/how-to-select-the-node-js-version-for-your-application/)
- [GitHub migration workflow](https://www.hostinger.com/support/how-to-migrate-a-node-js-application-to-hostinger/)
- [Express proxy configuration](https://expressjs.com/en/guide/behind-proxies/)
