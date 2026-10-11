// Hostinger entry point; frontend and API are served by the same Node process.
process.env.NODE_ENV ||= 'production';
// LiteSpeed loads this file with require(), which cannot load top-level await.
import('./dist/server/index.mjs').catch((error) => {
  console.error('EthnoMart could not start:', error);
  process.exitCode = 1;
});
