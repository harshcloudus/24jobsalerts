import type { NextConfig } from "next";

// Local: omit NEXT_PUBLIC_BASE_PATH → site at http://localhost:3000/
// Production: NEXT_PUBLIC_BASE_PATH=/24jobsalert → match Apache ProxyPass
const raw = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  ...(raw ? { basePath: raw } : {}),
};

export default nextConfig;

