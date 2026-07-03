import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Next.js <Image> to optimise images from these domains.
    // Add your Vercel deployment domain and any CDN you use here.
    remotePatterns: [
      // Vercel deployment
      {
        protocol: "https",
        hostname: "ecommerce-alpha-green-15.vercel.app",
        pathname: "/**",
      },
      // Neon / any future CDN
      {
        protocol: "https",
        hostname: "*.neon.tech",
        pathname: "/**",
      },
    ],
    // Local paths in /public are always served without config —
    // this entry is kept for completeness / future blob storage.
    unoptimized: false,
  },
};

export default nextConfig;
