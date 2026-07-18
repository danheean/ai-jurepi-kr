import type { Metadata, Viewport } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { allTools, getAllCategories } from '@/tools/registry';
import { Hero } from '@/components/home/Hero';
import { ToolExplorer } from '@/components/home/ToolExplorer';
import { ShareButtons } from '@/components/share/ShareButtons';
import { buildPageMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return buildPageMetadata({
    locale,
    path: '',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch tools and categories on the server so they're in the SSG HTML.
  const allToolsList = allTools();
  const categories = getAllCategories();

  return (
    <>
      <Hero />
      {/* Share buttons row — sits close under the hero (related affordance),
          with a full section gap below before the tools list. */}
      <div className="mx-auto max-w-screen-2xl px-lg pt-lg pb-section">
        <ShareButtons orientation="horizontal" />
      </div>
      <ToolExplorer initialTools={allToolsList} categories={categories} />
    </>
  );
}
