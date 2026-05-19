import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Suppress baseline-browser-mapping "data over two months old" warning during build
const origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('baseline-browser-mapping')) return;
  origWarn.apply(console, args);
};

const withNextIntl = createNextIntlPlugin();

// Use standalone for Docker (Linux); skip on Windows to avoid EPERM symlink errors
const nextConfig: NextConfig = {
  ...(process.platform !== 'win32' ? { output: 'standalone' as const } : {}),
  // Generate unique build ID to prevent Server Action cache mismatches
  generateBuildId: async () => {
    // Use timestamp + random string for unique ID on each deployment
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Document-Policy',
            value: 'js-profiling',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
