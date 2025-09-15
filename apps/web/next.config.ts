import { type NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals.push(
      "pino-pretty" /* add any other modules that might be causing the error */
    );
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  transpilePackages: ["@stealthgiving/contracts", "@stealthgiving/definition", "@stealthgiving/stealth"]
};

export default nextConfig;
