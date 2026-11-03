import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || process.env.VERCEL_DEPLOYMENT_ID,
};

export default nextConfig;
