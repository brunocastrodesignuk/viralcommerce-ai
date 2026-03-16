/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'via.placeholder.com', 'ae01.alicdn.com'],
  },
};

module.exports = nextConfig;
