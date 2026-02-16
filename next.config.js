/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  
  // Otimização de imagens
  images: {
    unoptimized: false, // Abilita otimização de imagens
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 ano cache
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Variáveis de ambiente
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Turbopack otimizações (substituem webpack)
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },

  // Compressão Brotli
  compress: true,

  experimental: {
    optimizePackageImports: ['recharts', '@supabase/supabase-js'],
  },
};

export default nextConfig;
