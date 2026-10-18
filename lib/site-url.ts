/** Shared origin for page metadata, robots and sitemap. */
const configuredOrigin = process.env.SITE_URL?.trim();

function parsePublicOrigin(value: string | undefined): URL | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.hostname.endsWith('.example') && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password
      ? url : undefined;
  } catch {
    return undefined;
  }
}

function vercelOrigin(host: string | undefined): URL | undefined {
  return host?.trim() ? parsePublicOrigin(`https://${host.trim()}`) : undefined;
}

const publicOrigin = parsePublicOrigin(configuredOrigin)
  ?? vercelOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  ?? vercelOrigin(process.env.VERCEL_URL);

export const siteUrl = publicOrigin ?? new URL('https://kvarta.example');
export const hasPublicSiteUrl = Boolean(publicOrigin);
