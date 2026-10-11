import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
await viteBuild({ configFile: resolve(root, 'vite.config.ts') });
await esbuild({
  entryPoints: {
    index: resolve(root, 'server/src/index.ts'),
    manager: resolve(root, 'server/src/manager.ts'),
    backup: resolve(root, 'server/src/backup.ts'),
  },
  outdir: resolve(root, 'dist/server'),
  outExtension: { '.js': '.mjs' },
  platform: 'node',
  format: 'esm',
  target: 'node24',
  bundle: true,
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(
  resolve(root, 'dist/app.js'),
  "process.env.NODE_ENV ||= 'production';\nawait import('./server/index.mjs');\n",
);
