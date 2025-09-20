/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { isServer }) {
    // PDF.js worker configuration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        canvas: false,
      }
    }

    // Enable WebAssembly for PDF processing
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    return config
  },
}

module.exports = nextConfig
