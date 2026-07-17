import { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { buildPageMetadata } from '@/lib/seo';
import { findToolBySlug } from '@/tools/registry';
import { routing } from '@/i18n/routing';
import HairstyleTool from '@/components/tools/hairstyle-recommendation/HairstyleTool';
import { ToastHost } from '@/components/ui/ToastHost';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * SSG: Generate static params for all live tool × locale combinations.
 * Tool pages are indexed (this layout is server-rendered, indexable).
 */
export async function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
    slug: 'hairstyle-recommendation',
  }));
}

/**
 * SEO: Build metadata (title, description, canonical, hreflang, OG).
 * Referenced by ui-engineer's i18n keys under tools.hairstyle-recommendation.
 */
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

/**
 * Tool Page: SSG-friendly layout with server-rendered intro/FAQ (indexable)
 * + client tool module (interactive).
 */
export default async function HairstyleRecommendationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'tools.hairstyle-recommendation' });
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

  // JSON-LD: SoftwareApplication (tool identity)
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

  // JSON-LD: FAQPage (Q&A for SEO + rich snippets)
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

  // JSON-LD: BreadcrumbList (navigation structure)
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

      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-secondary">
          <a href={`/${locale}`} className="hover:text-charcoal">
            {locale === 'ko' ? '홈' : 'Home'}
          </a>
          <span className="text-muted">/</span>
          <span className="text-charcoal font-medium">{t('title')}</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-charcoal mb-4 leading-tight">
            {t('title')}
          </h1>
          <p className="text-lg text-secondary leading-relaxed">
            {t('description')}
          </p>
        </header>

        {/* Intro Section */}
        <section className="mb-12 prose prose-invert max-w-none">
          <div className="bg-surface-card rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-charcoal mb-4">
              {t('intro.heading')}
            </h2>
            <p className="text-base text-secondary leading-relaxed">
              {t('intro.body')}
            </p>
          </div>
        </section>

        {/* How-To Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-charcoal mb-6">
            {locale === 'ko' ? '이용 방법' : 'How it works'}
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-surface-card rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-1">
                  {t('howto.step1')}
                </h3>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-surface-card rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-1">
                  {t('howto.step2')}
                </h3>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-surface-card rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-charcoal mb-1">
                  {t('howto.step3')}
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Tool Module (Client) */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <HairstyleTool />
            <ToastHost />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-charcoal mb-6">
            {locale === 'ko' ? '자주 묻는 질문' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-4">
            <details className="group p-4 bg-surface-card rounded-lg cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-charcoal group-open:text-accent">
                <span>{t('faq.q1')}</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-secondary leading-relaxed">
                {t('faq.a1')}
              </p>
            </details>

            <details className="group p-4 bg-surface-card rounded-lg cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-charcoal group-open:text-accent">
                <span>{t('faq.q2')}</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-secondary leading-relaxed">
                {t('faq.a2')}
              </p>
            </details>

            <details className="group p-4 bg-surface-card rounded-lg cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-charcoal group-open:text-accent">
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
        <section className="text-center pt-8 border-t border-surface-card">
          <p className="text-sm text-muted">
            {locale === 'ko'
              ? '질문이 있거나 피드백을 주고 싶으신가요? hello@jurepi.kr로 문의하세요.'
              : 'Questions or feedback? Reach out to hello@jurepi.kr'}
          </p>
        </section>
      </div>
    </>
  );
}
