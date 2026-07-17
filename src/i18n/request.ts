import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale might be a promise in async contexts
  const locale = await Promise.resolve(requestLocale);

  const resolvedLocale =
    locale && routing.locales.includes(locale as any)
      ? locale
      : routing.defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (
      await (resolvedLocale === 'ko'
        ? import('./messages/ko.json')
        : import('./messages/en.json'))
    ).default,
  };
});
