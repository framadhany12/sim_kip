import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SembunyikanDiAdmin } from "@/components/sembunyikan-di-admin";
import { DaftarkanSW, SKRIP_TANGKAP_PASANG } from "@/components/pwa";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0d2a63" };

export const metadata: Metadata = {
  title: { default: "Pendaftaran KIP Kuliah · Politeknik TEDC Bandung", template: "%s · KIP Kuliah Politeknik TEDC" },
  description:
    "Pendaftaran KIP Kuliah Politeknik TEDC Bandung secara daring: isi formulir terpandu, unggah berkas, dan pantau status pendaftaran.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Terapkan tema tersimpan sebelum halaman tampil (hindari kedip terang → gelap). */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('tema');if(t==='gelap'||(t!=='terang'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TANGKAP_PASANG }} />
      </head>
      <body className={`${jakarta.variable} min-h-dvh font-sans antialiased`}>
        <SembunyikanDiAdmin>
          <SiteHeader />
        </SembunyikanDiAdmin>
        {children}
        <DaftarkanSW />
      </body>
    </html>
  );
}
