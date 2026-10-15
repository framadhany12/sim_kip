import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mysql2"],
  poweredByHeader: false,
  // Folder build bisa diganti (NEXT_DIST_DIR) agar build uji tidak bentrok dengan `next dev` yang memakai .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;