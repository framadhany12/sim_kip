import type { MetadataRoute } from "next";

/** Manifest PWA: aplikasi bisa dipasang ke layar utama HP/laptop dan dibuka tanpa bilah browser. */
export default function manifest(): MetadataRoute.Manifest {
  return {
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
    background_color: "#ffffff",
    theme_color: "#0d2a63",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
