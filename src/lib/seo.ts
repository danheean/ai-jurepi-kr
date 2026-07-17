import type { Metadata } from 'next';

interface MetadataParams {
  locale: string;
  path: string;
  title: string;
  description: string;
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
}: MetadataParams): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai.jurepi.kr';
  const canonicalUrl = `${siteUrl}/${locale}${path ? `/${path}` : ''}`;
  const alternateUrl = locale === 'ko'
    ? `${siteUrl}/en${path ? `/${path}` : ''}`
    : `${siteUrl}/ko${path ? `/${path}` : ''}`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale,
      url: canonicalUrl,
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ko: `${siteUrl}/ko${path ? `/${path}` : ''}`,
        en: `${siteUrl}/en${path ? `/${path}` : ''}`,
      },
    },
  };
}
