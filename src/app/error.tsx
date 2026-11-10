"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Batas galat untuk semua halaman (di dalam layout root, jadi header/sidebar tetap tampil).
 * Pesan galat asli tidak ditampilkan ke pengguna; hanya `digest` sebagai rujukan log server.
 */
export default function GalatHalaman({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="konten" className="halaman-masuk mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-rose-50 text-rose-700" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Terjadi kesalahan</h1>
      <p className="mt-3 text-base text-slate-600">
        Halaman ini gagal dimuat. Coba muat ulang. Bila masih gagal, hubungi admin lewat menu Bantuan dan sebutkan kode di bawah.
      </p>
      {error.digest && (
        <p className="mt-3 rounded-md bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-700">Kode: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-lg bg-[#0d2a63] px-5 text-[15px] font-semibold text-white shadow-sm hover:bg-[#143a85]"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg px-5 text-[15px] font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Ke halaman utama
        </Link>
      </div>
    </main>
  );
}
