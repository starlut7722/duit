import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel-friendly defaults. No custom server, no standalone output. */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
