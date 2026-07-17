'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const otherLocale = locale === 'ko' ? 'en' : 'ko';
  const localeLabel = otherLocale === 'ko' ? '한국어' : 'English';

  // Remove current locale from pathname to construct the new URL
  const pathWithoutLocale = pathname.replace(`/${locale}`, '');

  return (
    <Link
      href={`/${otherLocale}${pathWithoutLocale || '/'}`}
      className="no-underline"
    >
      <Badge variant="neutral" size="md">
        {localeLabel}
      </Badge>
    </Link>
  );
}
