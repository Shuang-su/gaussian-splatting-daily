import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/horizon",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  agentRules: false,
};

export default nextConfig;
