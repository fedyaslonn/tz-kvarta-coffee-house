/** Shared origin for page metadata, robots and sitemap. */
const configuredOrigin = process.env.SITE_URL?.trim();

export const siteUrl = new URL(configuredOrigin || 'https://kvarta.example');
export const hasPublicSiteUrl = Boolean(configuredOrigin && !siteUrl.hostname.endsWith('.example'));
