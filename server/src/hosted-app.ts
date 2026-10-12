import express from 'express';
import { existsSync } from 'node:fs';
import { resolve, relative, extname, sep } from 'node:path';
import { createCatalogueApp } from './catalogue/app.ts';
import type { runtimeConfig } from './config.ts';
import { isWebsiteDocument } from '../../shared/site-status.ts';

export function createHostedApp(config: ReturnType<typeof runtimeConfig>) {
  const html = resolve(config.staticDirectory, 'index.html');
  const comingSoonHtml = resolve(config.staticDirectory, 'coming-soon.html');
  if (!existsSync(html))
    throw new Error(
      'Frontend build is missing. Run npm run build before starting the website.',
    );
  if (config.comingSoon && !existsSync(comingSoonHtml))
    throw new Error('Coming soon page is missing. Run npm run build.');
  const catalogue = createCatalogueApp({
    dataFile: config.dataFile,
    deployment: 'hosted-preview',
    frontendOrigin: config.publicOrigin,
    trustProxy: config.trustProxy,
    sessionSecret: config.sessionSecret,
  });
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Robots-Tag': 'noindex, nofollow',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    });
    if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000');
    next();
  });
  // Preserve the full /api prefix for the existing catalogue router.
  app.use((req, res, next) =>
    /^\/api(?:\/|$)/.test(req.path) ? catalogue.app(req, res, next) : next(),
  );
  app.use((req, res, next) => {
    if (
      !config.comingSoon ||
      !isWebsiteDocument(req.method, req.path, Boolean(req.accepts('html')))
    )
      return next();
    res.set('Cache-Control', 'no-store');
    res.sendFile(comingSoonHtml);
  });
  app.use(
    express.static(config.staticDirectory, {
      index: false,
      dotfiles: 'deny',
      maxAge: 86400000,
      setHeaders: (res, file) => {
        if (/coming-soon\.(css|html)$/.test(file))
          res.setHeader('Cache-Control', 'no-store');
        if (relative(config.staticDirectory, file).startsWith('assets' + sep))
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );
  app.use((req, res, next) => {
    if (
      !['GET', 'HEAD'].includes(req.method) ||
      !req.accepts('html') ||
      extname(req.path) ||
      req.path.split('/').some((p) => p.startsWith('.'))
    )
      return next();
    res.set('Cache-Control', 'no-cache');
    res.sendFile(html);
  });
  app.use((_req, res) => {
    res
      .status(404)
      .set('Cache-Control', 'no-store')
      .json({ error: 'This resource is unavailable.' });
  });
  const errors: express.ErrorRequestHandler = (_error, _req, res, _next) => {
    res
      .status(500)
      .json({ error: 'The website could not complete this request.' });
  };
  app.use(errors);
  return { ...catalogue, app, website: app };
}
