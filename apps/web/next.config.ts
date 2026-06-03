import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@openaeo/schemas", "@openaeo/crawler", "@openaeo/audit"]
};

export default nextConfig;
