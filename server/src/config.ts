import {
  isAbsolute,
  resolve,
  relative,
  dirname,
  basename,
  sep,
} from 'node:path';
import { realpathSync, existsSync } from 'node:fs';
import { comingSoonEnabled } from '../../shared/site-status.ts';

function inside(file: string, directory: string) {
  const part = relative(directory, file);
  return (
    !part ||
    (!part.startsWith('..' + sep) && part !== '..' && !isAbsolute(part))
  );
}
function canonical(file: string): string {
  if (existsSync(file)) return realpathSync(file);
  const parent = dirname(file);
  return parent === file ? file : resolve(canonical(parent), basename(file));
}
export function dataLocation(
  projectRoot: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  let file = env.ETHNOMART_DATA_FILE;
  if (file && !isAbsolute(file))
    throw new Error('ETHNOMART_DATA_FILE must be an absolute private path.');
  if (!file) {
    let parent = resolve(projectRoot);
    while (dirname(parent) !== parent) {
      if (basename(parent) === 'hbuilds') {
        file = resolve(dirname(parent), '.ethnomart/catalogue.sqlite3');
        break;
      }
      parent = dirname(parent);
    }
  }
  if (!file)
    throw new Error(
      'Set ETHNOMART_DATA_FILE to a private absolute database path outside the app and public_html.',
    );
  const safeFile = canonical(resolve(file)),
    root = canonical(resolve(projectRoot));
  if (
    inside(safeFile, root) ||
    safeFile.split(sep).some((p) => ['hbuilds', 'public_html'].includes(p))
  )
    throw new Error(
      'The database must be outside the release, hbuilds and public_html so redeployment cannot replace it.',
    );
  return safeFile;
}
export function runtimeConfig(
  projectRoot: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  const port = Number(env.PORT || '3000'),
    trustProxy = Number(env.TRUST_PROXY || '1');
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be an integer between 1 and 65535.');
  if (!Number.isInteger(trustProxy) || trustProxy < 0 || trustProxy > 3)
    throw new Error(
      'TRUST_PROXY must be the actual proxy hop count, from 0 to 3.',
    );
  let publicOrigin: string | undefined;
  if (env.PUBLIC_ORIGIN) {
    const url = new URL(env.PUBLIC_ORIGIN);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw new Error(
        'PUBLIC_ORIGIN must be one HTTPS origin, with no credentials or path.',
      );
    publicOrigin = url.origin;
  }
  if (
    env.SESSION_SECRET &&
    (env.SESSION_SECRET.length < 32 || env.SESSION_SECRET.length > 4096)
  )
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  return {
    projectRoot: resolve(projectRoot),
    dataFile: dataLocation(projectRoot, env),
    publicOrigin,
    sessionSecret: env.SESSION_SECRET,
    trustProxy,
    port,
    staticDirectory: resolve(projectRoot, 'dist/public'),
    comingSoon: comingSoonEnabled(env.ETHNOMART_COMING_SOON),
  };
}
