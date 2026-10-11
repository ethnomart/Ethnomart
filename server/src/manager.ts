import { fileURLToPath } from 'node:url';
import { runtimeConfig } from './config.ts';
import { LocalCatalogueStore } from './catalogue/store.ts';
import { OnboardingService } from './catalogue/onboarding.ts';
process.env.NODE_ENV = 'production';
process.env.ETHNOMART_BACKEND_MODE = 'hosted-preview';
process.umask(0o077);
const config = runtimeConfig(fileURLToPath(new URL('../../', import.meta.url)));
const store = new LocalCatalogueStore(config.dataFile, undefined, {
  disableSeedPasswords: true,
});
try {
  const access = new OnboardingService(store).provisionManager({
    hostedPreview: true,
  });
  console.log(
    'Private manager link; expires after 15 minutes and works once. Keep it out of GitHub and chat.',
  );
  console.log((config.publicOrigin || 'YOUR_HTTPS_ORIGIN') + access.path);
} finally {
  store.close();
}
