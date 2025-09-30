import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/projects/:id/watch',
        destination: '/projects/:id/edit?view=preview'
      }
    ];
  }
};

export default nextConfig;
