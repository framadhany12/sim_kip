import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SembunyikanDiAdmin } from "@/components/sembunyikan-di-admin";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0d2a63" };

export const metadata: Metadata = {
  title: { default: "Pendaftaran KIP Kuliah · Politeknik TEDC Bandung", template: "%s · KIP Kuliah Politeknik TEDC" },
  description:
    "Pendaftaran KIP Kuliah Politeknik TEDC Bandung secara daring: isi formulir terpandu, unggah berkas, dan pantau status pendaftaran.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} min-h-dvh font-sans antialiased`}>
        <SembunyikanDiAdmin>
          <SiteHeader />
        </SembunyikanDiAdmin>
        {children}
      </body>
    </html>
  );
}
