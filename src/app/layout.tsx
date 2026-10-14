import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Pendaftaran KIP Kuliah · Politeknik TEDC Bandung", template: "%s · KIP Kuliah Politeknik TEDC" },
  description:
    "Pendaftaran KIP Kuliah Politeknik TEDC Bandung secara daring: isi formulir terpandu, unggah berkas, dan pantau status pendaftaran.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} min-h-dvh font-sans antialiased`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
