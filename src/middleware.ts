import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api routes (server route handlers — must NOT be locale-redirected)
    // - _next / _vercel internals
    // - all root files inside public folder (contain a dot)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
