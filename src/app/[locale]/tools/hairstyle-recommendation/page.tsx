import { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';
import { findToolBySlug } from '@/tools/registry';
import { routing } from '@/i18n/routing';
import { ShareButtons } from '@/components/share/ShareButtons';
import { ToolIntro } from '@/components/tools/ToolIntro';
import HairstyleTool from '@/components/tools/hairstyle-recommendation/HairstyleTool';
import { ToastHost } from '@/components/ui/ToastHost';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
    slug: 'hairstyle-recommendation',
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools.hairstyle-recommendation' });

  const title = t('title');
  const description = t('description');

  return buildPageMetadata({
    locale,
    path: 'tools/hairstyle-recommendation',
    title,
    description,
  });
}

export default async function HairstyleRecommendationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'tools.hairstyle-recommendation' });
  const tCommon = await getTranslations({ locale, namespace: 'toolPage' });
  const tool = findToolBySlug('hairstyle-recommendation');

  if (!tool || tool.status !== 'live') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-charcoal mb-4">
          {t('title')}
        </h1>
        <p className="text-muted mb-6">{t('description')}</p>
        <p className="text-secondary">Tool not yet available.</p>
      </div>
    );
  }

  // JSON-LD: SoftwareApplication
  const softwareApplicationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: t('title'),
    description: t('description'),
    applicationCategory: 'DesignApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    url: `https://ai.jurepi.kr/${locale}/tools/hairstyle-recommendation`,
    image: 'https://ai.jurepi.kr/og-image.png',
  };

  // JSON-LD: FAQPage
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: t('faq.q1'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a1'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.q2'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a2'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.q3'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a3'),
        },
      },
    ],
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'ko' ? '홈' : 'Home',
        item: `https://ai.jurepi.kr/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'ko' ? '도구' : 'Tools',
        item: `https://ai.jurepi.kr/${locale}/tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: t('title'),
        item: `https://ai.jurepi.kr/${locale}/tools/hairstyle-recommendation`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-8 md:py-12">
        {/* Back link + Share buttons row */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}`}
            className="flex items-center text-sm font-medium text-mute hover:text-charcoal min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outer focus-visible:ring-offset-2 rounded-md px-1"
          >
            {tCommon('back')}
          </Link>
          <ShareButtons orientation="horizontal" />
        </div>

        {/* ToolIntro */}
        <ToolIntro
          slug="hairstyle-recommendation"
          eyebrow={t('intro.eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        {/* Interactive Tool Module */}
        <section className="mb-12">
          <HairstyleTool />
          <ToastHost />
        </section>

        {/* How-To Section */}
        <section className="mb-12 border-t border-hairline pt-8">
          <h2 className="text-2xl font-bold text-charcoal mb-6">
            {t('howto.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="rounded-md bg-surface-soft p-4">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary font-bold text-sm mb-3">
                1
              </div>
              <h3 className="font-semibold text-charcoal mb-2">
                {t('howto.step1')}
              </h3>
            </div>

            {/* Step 2 */}
            <div className="rounded-md bg-surface-soft p-4">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary font-bold text-sm mb-3">
                2
              </div>
              <h3 className="font-semibold text-charcoal mb-2">
                {t('howto.step2')}
              </h3>
            </div>

            {/* Step 3 */}
            <div className="rounded-md bg-surface-soft p-4">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary font-bold text-sm mb-3">
                3
              </div>
              <h3 className="font-semibold text-charcoal mb-2">
                {t('howto.step3')}
              </h3>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12 border-t border-hairline pt-8">
          <h2 className="text-2xl font-bold text-charcoal mb-6">
            {t('faq.title')}
          </h2>
          <div className="space-y-3">
            <details className="group p-4 bg-surface-soft rounded-md cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-charcoal group-open:text-primary">
                <span>{t('faq.q1')}</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-secondary leading-relaxed">
                {t('faq.a1')}
              </p>
            </details>

            <details className="group p-4 bg-surface-soft rounded-md cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-charcoal group-open:text-primary">
                <span>{t('faq.q2')}</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-secondary leading-relaxed">
                {t('faq.a2')}
              </p>
            </details>

            <details className="group p-4 bg-surface-soft rounded-md cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-charcoal group-open:text-primary">
                <span>{t('faq.q3')}</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-secondary leading-relaxed">
                {t('faq.a3')}
              </p>
            </details>
          </div>
        </section>

        {/* Footer Note */}
        <section className="text-center pt-8 border-t border-hairline">
          <p className="text-sm text-mute">
            {t('footer.contact')}
          </p>
        </section>
      </div>
    </>
  );
}
