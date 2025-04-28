import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpackDevMiddleware: (config: any) => {
    // Enable polling for file changes to avoid server quitting
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
