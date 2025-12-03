import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com'],
  },
};

export default nextConfig;
