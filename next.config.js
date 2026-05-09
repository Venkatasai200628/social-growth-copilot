/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  // Faster page transitions
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'firebase'],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.together.ai' },
      { protocol: 'https', hostname: '*.together.ai' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'together.ai' },
    ],
  },

  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
