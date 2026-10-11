import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtimeConfig } from './config.ts';
process.umask(0o077);
const config = runtimeConfig(fileURLToPath(new URL('../../', import.meta.url)));
if (!existsSync(config.dataFile))
  throw new Error('Start the website before creating its first backup.');
const folder = resolve(dirname(config.dataFile), 'backups');
mkdirSync(folder, { recursive: true, mode: 0o700 });
const file = resolve(
  folder,
  'catalogue-' + new Date().toISOString().replace(/[:.]/g, '-') + '.sqlite3',
);
const source = new DatabaseSync(config.dataFile, { readOnly: true });
try {
  await backup(source, file);
  console.log(
    'Private SQLite backup created. Download it securely from the private backups directory.',
  );
} finally {
  source.close();
}
