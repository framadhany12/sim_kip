import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mysql2"],
  poweredByHeader: false,
  async headers() {
    const aman = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Kamera hanya untuk halaman sendiri (scan QR presensi); mikrofon dan lokasi tidak dipakai.
      { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
    ];
    // HSTS hanya di produksi (HTTPS); localhost tidak terpengaruh.
    if (process.env.NODE_ENV === "production") aman.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    return [{ source: "/:path*", headers: aman }];
  },
  // Folder build bisa diganti (NEXT_DIST_DIR) agar build uji tidak bentrok dengan `next dev` yang memakai .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;