/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 300, // 5 minutes for dynamic routes
      static: 3600, // 1 hour for static routes
    },
  },
};

export default nextConfig;
