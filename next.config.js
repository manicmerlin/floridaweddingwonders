/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds for deployment
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  experimental: {
    // Disable static optimization to avoid Suspense issues
    isrMemoryCacheSize: 0,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/photo-*',
      },
      {
        protocol: 'https',
        hostname: 'images.sofloweddingvenues.com',
        port: '',
        pathname: '/venues/**',
      },
    ],
  },
}

module.exports = nextConfig
