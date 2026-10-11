// Hostinger entry point; frontend and API are served by the same Node process.
process.env.NODE_ENV ||= 'production';
await import('./dist/server/index.mjs');
