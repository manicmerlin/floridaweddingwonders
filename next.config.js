/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  images: {
    // Allow data URLs for development mode uploaded images
    dangerouslyAllowSVG: true,
    unoptimized: process.env.NODE_ENV === 'development', // Skip optimization for dev mode
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
      {
        protocol: 'https',
        hostname: 'aflrmpkolumpjhpaxblz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
