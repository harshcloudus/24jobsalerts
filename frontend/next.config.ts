import type { NextConfig } from "next";

// For main domain (root) keep NEXT_PUBLIC_BASE_PATH empty.
// If you ever deploy under a subpath, set NEXT_PUBLIC_BASE_PATH=/subpath
// and rebuild the frontend.
const normalizedBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath: normalizedBasePath,
  assetPrefix: normalizedBasePath,
  trailingSlash: true,
  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: "/api/sitemap" },
      { source: "/page-sitemap.xml", destination: "/api/sitemap/page" },
      { source: "/post-sitemap.xml", destination: "/api/sitemap/post/1" },
      {
        source: "/post-sitemap:n(\\d+).xml",
        destination: "/api/sitemap/post/:n",
      },
    ];
  },
};

export default nextConfig;
