import type { MetadataRoute } from 'next';
import { hasPublicSiteUrl, siteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', ...(hasPublicSiteUrl ? { allow: '/', disallow: '/api/' } : { disallow: '/' }) },
    ...(hasPublicSiteUrl ? { sitemap: new URL('/sitemap.xml', siteUrl).href } : {}),
  };
}
