import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve avif and webp for supported browsers — reduces payload size
    formats: ["image/avif", "image/webp"],

    // Remote patterns: only needed if you load images from an external host.
    // All product images are stored in /public/shoes/ and served as static
    // assets — they do NOT need to be listed here.
    // Add an entry if you ever move images to a CDN (e.g. Cloudinary, S3).
    remotePatterns: [],
  },
};

export default nextConfig;
