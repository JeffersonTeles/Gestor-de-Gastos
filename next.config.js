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

  // Otimizações webpack
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          recharts: {
            test: /[\\/]node_modules[\\/](recharts)[\\/]/,
            name: 'recharts',
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      },
    };
    return config;
  },

  // Compressão Brotli
  compress: true,

  experimental: {
    optimizePackageImports: ['recharts', '@supabase/supabase-js'],
  },
};

export default nextConfig;
