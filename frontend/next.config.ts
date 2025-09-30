import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
