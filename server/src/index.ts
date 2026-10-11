import { fileURLToPath } from 'node:url';
import { runtimeConfig } from './config.ts';
import { createHostedApp } from './hosted-app.ts';
process.env.NODE_ENV ||= 'production';
process.env.ETHNOMART_BACKEND_MODE = 'hosted-preview';
process.umask(0o077);
if (Number(process.versions.node.split('.')[0]) !== 24)
  throw new Error('EthnoMart hosting requires Node.js 24.');
const root = fileURLToPath(new URL('../../', import.meta.url));
const config = runtimeConfig(root);
const instance = createHostedApp(config);
const server = instance.website.listen(config.port, '0.0.0.0', () =>
  console.log(
    `EthnoMart website and API listening on port ${config.port} (hosted sample preview).`,
  ),
);
server.on('error', (error) => {
  console.error('EthnoMart could not start:', error.message);
  instance.store.close();
  process.exitCode = 1;
});
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(() => {
      clearTimeout(deadline);
      instance.store.close();
      process.exit(0);
    });
  });
