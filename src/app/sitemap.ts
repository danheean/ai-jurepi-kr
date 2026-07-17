import { MetadataRoute } from 'next';
import { liveTools } from '@/tools/registry';
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai.jurepi.kr';
  const entries: MetadataRoute.Sitemap = [];

  // Home page for each locale
  for (const locale of routing.locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    });
  }

  // Tool pages for each live tool × locale
  for (const tool of liveTools()) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${baseUrl}/${locale}/tools/${tool.slug}`,
        lastModified: tool.addedAt,
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    }
  }

  // Static pages for each locale
  const staticPages = ['about', 'privacy', 'terms', 'contact'];
  for (const page of staticPages) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${baseUrl}/${locale}/${page}`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.5,
      });
    }
  }

  return entries;
}
