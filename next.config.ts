import type { NextConfig } from "next";

const nextConfig: NextConfig = {
};

// Source - https://stackoverflow.com/a
// Posted by Dijalma Silva, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-10, License - CC BY-SA 4.0

module.exports = {
  reactStrictMode: true,
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  }
}

export default nextConfig;
