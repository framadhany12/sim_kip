import type { MetadataRoute } from "next";

/**
 * Manifest PWA: aplikasi bisa dipasang ke layar utama HP/laptop dan dibuka tanpa bilah browser.
 * Sengaja route handler, bukan konvensi `app/manifest.ts`: Next tidak memberi `crossorigin` pada
 * tag manifest otomatis, sehingga Chrome mengambilnya tanpa cookie dan WAF produksi (SafeLine di
 * belakang Cloudflare) membalas halaman tantangan HTML (468) -> pasang gagal. Tag `<link>` ditulis
 * sendiri di layout.tsx dengan `crossOrigin="use-credentials"`.
 */
const manifest: MetadataRoute.Manifest = {
  id: "/",
  name: "SIM KIP",
  short_name: "SIM KIP",
  description: "Pendaftaran dan layanan mahasiswa KIP Kuliah Politeknik TEDC Bandung.",
  lang: "id",
  // "/" menjawab 200 untuk pengunjung (syarat pasang browser; /dashboard menjawab 307).
  // Yang sudah masuk langsung diarahkan ke /admin atau /dashboard oleh halaman utama.
  start_url: "/",
  scope: "/",
  display: "standalone",
  // Desktop/browser yang tak mendukung standalone jatuh ke jendela minimal, bukan tab biasa.
  display_override: ["standalone", "minimal-ui"],
  orientation: "any",
  categories: ["education"],
  shortcuts: [
    { name: "Dashboard", url: "/dashboard", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    { name: "Status pendaftaran", url: "/status", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
  ],
  background_color: "#ffffff",
  theme_color: "#0d2a63",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
