import Link from "next/link";
import { LogoTedc } from "@/components/logo";

export const metadata = { title: "Halaman tidak ditemukan" };

/** 404 untuk seluruh situs. Tanpa data dinamis agar selalu bisa dirender. */
export default function NotFound() {
  return (
    <main id="konten" className="halaman-masuk mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <LogoTedc size={56} />
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Kesalahan 404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-base text-slate-600">Alamat yang Anda buka tidak ada atau sudah dipindahkan. Periksa kembali tautannya, atau kembali ke halaman utama.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg bg-[#0d2a63] px-5 text-[15px] font-semibold text-white shadow-sm hover:bg-[#143a85]"
        >
          Ke halaman utama
        </Link>
        <Link
          href="/bantuan"
          className="inline-flex min-h-11 items-center rounded-lg px-5 text-[15px] font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Pusat bantuan
        </Link>
      </div>
    </main>
  );
}
