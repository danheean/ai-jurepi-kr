import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ai.jurepi.kr — Free AI Tools Hub',
  description: 'Free online AI-powered tools for hairstyle recommendations, image analysis, and more.',
  robots: 'index, follow',
  openGraph: {
    title: 'ai.jurepi.kr — Free AI Tools Hub',
    description: 'Free online AI-powered tools for hairstyle recommendations, image analysis, and more.',
    url: 'https://ai.jurepi.kr',
    type: 'website',
    locale: 'ko_KR',
    alternateLocale: ['en_US'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="x-ua-compatible" content="ie=edge" />
        {/* Pretendard (variable) + Gmarket Sans as dynamic subsets, served from
            /public so webpack never parses their ~180 @font-face rules
            (css-loader stack-overflows on them). The browser downloads only the
            unicode-range chunks a page actually uses. */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#e60023" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Theme flash prevention: detect theme from localStorage before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){const t=localStorage.getItem('theme');const d=!!(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches));if(d)document.documentElement.classList.add('dark');})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
