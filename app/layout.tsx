import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { hasPublicSiteUrl, siteUrl } from '@/lib/site-url';
import './globals.css';

const golos = localFont({ src: './fonts/golos-text.woff2', weight: '400 700', display: 'swap', variable: '--font-golos', adjustFontFallback: false });
const serif = localFont({ src: './fonts/pt-serif.woff2', weight: '400', display: 'swap', variable: '--font-serif', adjustFontFallback: false });
const title = 'Кварта — свежая обжарка кофе в Минске';
const description = 'Маленькая кофейная обжарка в Минске. Зерно, дрипы и подписка с бесплатной доставкой.';
const previewImage = {
  url: new URL('/opengraph-image.png', siteUrl),
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Кварта. В четверг обжариваем, в пятницу — у вас. Зерно, дрипы и подписка с доставкой.',
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  ...(hasPublicSiteUrl ? { alternates: { canonical: '/' } } : {}),
  title,
  description,
  openGraph: {
    title,
    description,
    locale: 'ru_BY', type: 'website', siteName: 'Кварта',
    url: '/',
    images: [previewImage],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [previewImage],
  },
  robots: hasPublicSiteUrl ? { index: true, follow: true } : { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" className={`${golos.variable} ${serif.variable}`}><body>{children}</body></html>;
}
