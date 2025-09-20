/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Fix webpack caching issues
    if (dev) {
      config.cache = false; // Disable cache in development to prevent header check errors
    }
    return config;
  },
}

export default nextConfig
