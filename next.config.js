/** @type {import('next').NextConfig} */
const nextConfig = {
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
