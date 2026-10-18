import type { MetadataRoute } from 'next';
import { hasPublicSiteUrl, siteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  return hasPublicSiteUrl ? [{ url: new URL('/', siteUrl).href, changeFrequency: 'weekly', priority: 1 }] : [];
}
