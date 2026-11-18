"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Share, SquarePlus } from "lucide-react";

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
 * Tombol "Pasang aplikasi", hanya tampil bila perangkat benar-benar bisa memasang:
 * - Chrome/Edge/Samsung Internet (Android & laptop): klik langsung membuka dialog pasang bawaan browser.
 *   Dialog itu hanya ada di HTTPS (atau localhost); di http://alamat-ip tombol tidak muncul.
 * - iPhone/iPad: Safari tidak punya API pemasangan, jadi klik menampilkan satu baris petunjuk singkat.
 * Tersembunyi bila sudah dibuka sebagai aplikasi, sudah terpasang, atau browser tidak mendukung.
 */
export function TombolPasang({ gelapDiLatar = false }: { gelapDiLatar?: boolean }) {
  const [prompt, setPrompt] = useState<PromptPasang | null>(null);
  const [ios, setIos] = useState(false);
  const [dalamAplikasi, setDalamAplikasi] = useState(false);
  const [petunjuk, setPetunjuk] = useState(false);
  const tombol = useRef<HTMLButtonElement>(null);
  const kotak = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    if (matchMedia("(display-mode: standalone)").matches || nav.standalone) return;
    const ua = nav.userAgent;
    setIos(/iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && nav.maxTouchPoints > 1));
    // Browser di dalam aplikasi lain (WhatsApp, Instagram, Facebook, Line) tidak bisa memasang PWA.
    setDalamAplikasi(/FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|WhatsApp/i.test(ua));
    const baca = () => setPrompt(window.__promptPasang ?? null);
    baca();
    window.addEventListener("siap-pasang", baca);
    return () => window.removeEventListener("siap-pasang", baca);
  }, []);

  useEffect(() => {
    if (!petunjuk) return;
    const tutup = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : ![tombol.current, kotak.current].some((el) => el?.contains(e.target as Node))) setPetunjuk(false);
    };
    document.addEventListener("pointerdown", tutup);
    document.addEventListener("keydown", tutup);
    return () => {
      document.removeEventListener("pointerdown", tutup);
      document.removeEventListener("keydown", tutup);
    };
  }, [petunjuk]);

  if (!prompt && !ios) return null;

  async function pasang() {
    if (!prompt) return setPetunjuk((v) => !v);
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
        ref={tombol}
        type="button"
        onClick={pasang}
        title="Pasang aplikasi SIM KIP"
        aria-expanded={prompt ? undefined : petunjuk}
        className={`pasang-denyut inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2.5 text-sm font-medium transition ${warna}`}
      >
        <Download className="size-[18px]" strokeWidth={1.8} aria-hidden />
        <span className="sr-only sm:not-sr-only">Pasang aplikasi</span>
      </button>
      {/* Lewat portal: header panel memakai backdrop-blur, yang membuat "fixed" di dalamnya ikut header. */}
      {petunjuk &&
        createPortal(
          // HP: di bawah layar (tombol Bagikan Safari iPhone ada di bawah), di atas menu bawah. iPad: kanan atas.
          <div
            ref={kotak}
            role="status"
            className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 rounded-xl bg-white p-3.5 text-sm text-slate-700 shadow-xl ring-1 ring-slate-200 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-[calc(env(safe-area-inset-top)+4.5rem)] sm:w-72"
          >
            {dalamAplikasi ? (
              <>
                Buka dulu di <b>Safari</b> (menu ⋯ → Buka di Safari), lalu ketuk Pasang lagi.
              </>
            ) : (
              <span className="flex items-center gap-2.5">
                <Share className="size-5 shrink-0 text-blue-700" aria-hidden />
                <span>
                  Ketuk <b>Bagikan</b>, lalu <b>Tambahkan ke Layar Utama</b> <SquarePlus className="inline size-4 align-[-3px]" aria-hidden />
                </span>
              </span>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
