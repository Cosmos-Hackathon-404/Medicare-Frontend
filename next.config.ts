import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'illustrations.popsy.co',
      },
    ],
  },
};

export default nextConfig;
