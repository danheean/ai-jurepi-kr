import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Server runtime: OpenNext (Cloudflare Workers) adapter handles server routes.
  // Unlike apps.jurepi.kr (static export), ai.jurepi.kr requires route handlers
  // for AI inference endpoints. Removed output: 'export'.
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
  },
};

export default withNextIntl(nextConfig);
