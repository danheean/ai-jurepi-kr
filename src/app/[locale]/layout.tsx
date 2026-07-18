import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ConsentBanner } from '@/components/layout/ConsentBanner';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return [{ locale: 'ko' }, { locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages();
  const t = await getTranslations('common');

  return (
    <html lang={locale}>
      <body className="bg-surface-soft text-body antialiased">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-sm focus:left-sm focus:rounded-md focus:bg-primary focus:px-lg focus:py-sm focus:text-button-md focus:text-on-primary"
          >
            {t('skipToContent')}
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <ConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
