/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty', 'thread-stream', 'sonic-boom', 'atomic-sleep'],
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

module.exports = nextConfig;
