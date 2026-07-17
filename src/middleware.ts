import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except for
    // - ._ segments
    // - _next segments
    // - all root files inside public folder
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
};
