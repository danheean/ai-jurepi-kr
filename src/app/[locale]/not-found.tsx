import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-display-xl mb-4">404</h1>
      <p className="text-body-md text-mute mb-8">{t('common.notFound')}</p>
      <Link href="/" className="text-primary hover:text-primary-pressed">
        {t('common.goHome')}
      </Link>
    </div>
  );
}
