const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty', 'thread-stream', 'sonic-boom', 'atomic-sleep'],
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('pino', 'pino-pretty', 'thread-stream', 'sonic-boom', 'atomic-sleep');
      }
    }
    return config;
  },
};

// Only wrap with Sentry if DSN is configured — build works fine without it
const hasSentry = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

module.exports = hasSentry
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
      disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
    })
  : nextConfig;
