"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

type PromptPasang = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
declare global {
  interface Window {
    __promptPasang?: PromptPasang | null;
  }
}

/** Daftarkan service worker (hanya build produksi; di `next dev` SW mengganggu muat ulang). */
export function DaftarkanSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* gagal daftar (mis. bukan HTTPS): situs tetap berjalan biasa */
    });
  }, []);
  return null;
}

/**
 * Skrip <head>: tangkap `beforeinstallprompt` sedini mungkin (sering terjadi sebelum React siap),
 * simpan untuk tombol Pasang Aplikasi.
 */
export const SKRIP_TANGKAP_PASANG =
  "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__promptPasang=e;window.dispatchEvent(new Event('siap-pasang'))});" +
  "window.addEventListener('appinstalled',function(){window.__promptPasang=null;window.dispatchEvent(new Event('siap-pasang'))});";

/**
 * Tombol "Pasang aplikasi". Chrome/Edge/Android: memunculkan dialog pasang bawaan browser.
 * iPhone/iPad: browser tidak punya dialog itu, jadi tampil petunjuk "Tambahkan ke Layar Utama".
 * Tersembunyi bila sudah dibuka sebagai aplikasi atau browser tidak mendukung.
 */
export function TombolPasang({ gelapDiLatar = false }: { gelapDiLatar?: boolean }) {
  const [prompt, setPrompt] = useState<PromptPasang | null>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [dalamAplikasi, setDalamAplikasi] = useState(false);
  const [bukanSafari, setBukanSafari] = useState(false);
  const [tampil, setTampil] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    if (matchMedia("(display-mode: standalone)").matches || nav.standalone) return;
    setTampil(true);
    const ua = nav.userAgent;
    const iosPerangkat = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && nav.maxTouchPoints > 1);
    setPlatform(iosPerangkat ? "ios" : /android/i.test(ua) ? "android" : "desktop");
    // Browser di dalam aplikasi lain (WhatsApp, Instagram, Facebook, Line, WebView Android) tidak bisa memasang PWA.
    setDalamAplikasi(/FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|; wv\)/i.test(ua));
    // iOS 16.4+: Chrome/Edge/Firefox juga punya "Tambahkan ke Layar Utama", tetapi menunya ada di tempat berbeda.
    setBukanSafari(iosPerangkat && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua));
    const baca = () => setPrompt(window.__promptPasang ?? null);
    baca();
    window.addEventListener("siap-pasang", baca);
    return () => window.removeEventListener("siap-pasang", baca);
  }, []);

  // Tanpa dialog bawaan (iPhone, atau browser belum memicunya) tombol tetap tampil dengan petunjuk manual.
  if (!tampil) return null;

  async function pasang() {
    if (!prompt) return dialog.current?.showModal();
    await prompt.prompt();
    await prompt.userChoice;
    // Prompt hanya bisa dipakai sekali; browser mengirim yang baru bila pengguna menolak.
    window.__promptPasang = null;
    setPrompt(null);
  }

  const warna = gelapDiLatar ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100";
  return (
    <>
      <button
        type="button"
        onClick={pasang}
        title="Pasang aplikasi SIM KIP"
        className={`pasang-denyut inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2.5 text-sm font-medium transition ${warna}`}
      >
        <Download className="size-[18px]" strokeWidth={1.8} aria-hidden />
        <span className="sr-only sm:not-sr-only">Pasang aplikasi</span>
      </button>
      {!prompt && (
        <dialog
          ref={dialog}
          aria-labelledby="judul-pasang"
          onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/50"
        >
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 id="judul-pasang" className="text-lg font-bold">
                {platform === "ios" ? "Pasang SIM KIP di iPhone" : "Pasang SIM KIP"}
              </h2>
              <button type="button" onClick={() => dialog.current?.close()} className="-m-2 grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Tutup">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {dalamAplikasi && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
                Anda membuka SIM KIP dari dalam aplikasi lain. Buka dulu lewat menu <b>⋮</b> → <b>Buka di browser</b> ({platform === "ios" ? "Safari" : "Chrome"}), lalu pasang.
              </p>
            )}
            {platform === "ios" ? (
              <ol className="mt-3 space-y-3 text-[15px] text-slate-700">
                <li className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">1</span>
                  <span>
                    {bukanSafari ? (
                      <>Ketuk tombol Bagikan <Share className="inline size-4 align-[-2px]" aria-label="(ikon kotak dengan panah ke atas)" /> di bilah browser (perlu iOS 16.4 ke atas; bila tidak ada, buka halaman ini di <b>Safari</b>).</>
                    ) : (
                      <>Buka halaman ini di <b>Safari</b>, lalu ketuk tombol Bagikan <Share className="inline size-4 align-[-2px]" aria-label="(ikon kotak dengan panah ke atas)" />.</>
                    )}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">2</span>
                  <span>
                    Gulir ke bawah, pilih <b>Tambahkan ke Layar Utama</b> <SquarePlus className="inline size-4 align-[-2px]" aria-hidden />.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">3</span>
                  <span>
                    Ketuk <b>Tambah</b>. Ikon SIM KIP muncul di layar utama.
                  </span>
                </li>
              </ol>
            ) : (
              <div className="mt-3 space-y-3 text-[15px] text-slate-700">
                {platform === "android" ? (
                  <>
                    <p>
                      <b>Chrome / Edge / Firefox di Android:</b> ketuk menu <b>⋮</b> → <b>Instal aplikasi</b> (atau <b>Tambahkan ke layar utama</b>).
                    </p>
                    <p>
                      <b>Samsung Internet:</b> menu <b>☰</b> → <b>Tambahkan halaman ke</b> → <b>Layar utama</b>.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <b>Chrome / Edge:</b> klik ikon pasang <Download className="inline size-4 align-[-2px]" aria-hidden /> di ujung kanan kolom alamat, atau menu <b>⋮</b> → <b>Kirim, simpan, dan bagikan</b> → <b>Instal halaman sebagai aplikasi</b> (Edge: <b>Aplikasi</b> → <b>Instal situs ini sebagai aplikasi</b>).
                    </p>
                    <p>
                      <b>Safari di Mac (macOS Sonoma ke atas):</b> menu <b>File</b> → <b>Tambahkan ke Dock</b>.
                    </p>
                    <p>
                      <b>Firefox di komputer</b> belum mendukung pemasangan aplikasi; gunakan Chrome atau Edge.
                    </p>
                  </>
                )}
                <p className="text-sm text-slate-500">Bila pilihan tidak muncul, pastikan situs dibuka lewat HTTPS dan bukan di mode penyamaran.</p>
              </div>
            )}
          </div>
        </dialog>
      )}
    </>
  );
}
