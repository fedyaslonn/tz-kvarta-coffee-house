/** Shared origin for page metadata, robots and sitemap. */
const configuredOrigin = process.env.SITE_URL?.trim();

function parsePublicOrigin(value: string | undefined): URL | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.pathname.replace(/\/$/, '') && !url.search && !url.hash ? url : undefined;
  } catch {
    return undefined;
  }
}

const publicOrigin = parsePublicOrigin(configuredOrigin);

export const siteUrl = publicOrigin ?? new URL('https://kvarta.example');
export const hasPublicSiteUrl = Boolean(publicOrigin && !siteUrl.hostname.endsWith('.example'));
