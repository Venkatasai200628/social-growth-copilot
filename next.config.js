/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'firebase'],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@composio/core': false,
      };
    }
    return config;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.together.ai' },
      { protocol: 'https', hostname: '*.together.ai' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'together.ai' },
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig