// Set to false and redeploy to reopen the full website.
// ETHNOMART_COMING_SOON=false can also override this in Hostinger.
export const comingSoonByDefault = true;

export function comingSoonEnabled(override?: string): boolean {
  if (override === undefined || override.trim() === '')
    return comingSoonByDefault;
  const value = override.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('ETHNOMART_COMING_SOON must be true or false.');
}

export function isWebsiteDocument(
  method: string,
  pathname: string,
  acceptsHtml: boolean,
): boolean {
  return (
    ['GET', 'HEAD'].includes(method) &&
    !/^\/api(?:\/|$)/.test(pathname) &&
    !pathname.split('/').some((part) => part.startsWith('.')) &&
    acceptsHtml &&
    (!/\.[^/]+$/.test(pathname) || /\.html$/i.test(pathname))
  );
}
