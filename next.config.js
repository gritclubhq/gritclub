/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization — serve WebP automatically
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Reduce bundle size — tree-shake lucide icons
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Headers for caching static assets
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-XSS-Protection',       value: '1; mode=block' },
        ],
      },
      {
        // Cache static files aggressively
        source: '/(.*)\\.(ico|png|jpg|jpeg|svg|woff2|woff)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

module.exports = nextConfig
