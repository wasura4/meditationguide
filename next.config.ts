import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep emulator and normal local servers from overwriting each other's bundles.
  distDir: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === 'true' ? '.next-emulator' : '.next',
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com'],
  },
};

export default nextConfig;
