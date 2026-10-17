"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Tema = "sistem" | "terang" | "gelap";
const URUTAN: Tema[] = ["sistem", "terang", "gelap"];
const LABEL: Record<Tema, string> = { sistem: "Tema: ikuti perangkat", terang: "Tema: terang", gelap: "Tema: gelap" };

/** Terapkan tema ke <html>; "sistem" mengikuti pengaturan perangkat. */
export function terapkanTema(t: Tema) {
  const gelap = t === "gelap" || (t === "sistem" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", gelap);
}

function bacaTema(): Tema {
  try {
    const t = localStorage.getItem("tema");
    return t === "terang" || t === "gelap" ? t : "sistem";
  } catch {
    return "sistem";
  }
}

/**
 * Tombol pengganti tema (ikuti perangkat → terang → gelap). Pilihan disimpan di browser; skrip kecil di <head>
 * (lihat layout) menerapkannya sebelum halaman tampil agar tidak berkedip.
 * `gelapDiLatar`: tombol berada di bilah biru tua (header/sidebar), jadi warnanya putih.
 */
export function TombolTema({ gelapDiLatar = false, className = "" }: { gelapDiLatar?: boolean; className?: string }) {
  const [tema, setTema] = useState<Tema>("sistem");
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setTema(bacaTema());
    setSiap(true);
    // Saat memilih "ikuti perangkat", ubah tema langsung bila pengaturan perangkat berganti.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const ubah = () => bacaTema() === "sistem" && terapkanTema("sistem");
    mq.addEventListener("change", ubah);
    return () => mq.removeEventListener("change", ubah);
  }, []);

  function ganti() {
    const berikut = URUTAN[(URUTAN.indexOf(tema) + 1) % URUTAN.length];
    setTema(berikut);
    try {
      if (berikut === "sistem") localStorage.removeItem("tema");
      else localStorage.setItem("tema", berikut);
    } catch {
      /* penyimpanan diblokir: tema tetap berlaku untuk sesi ini */
    }
    terapkanTema(berikut);
  }

  const Ikon = tema === "gelap" ? Moon : tema === "terang" ? Sun : Monitor;
  const warna = gelapDiLatar ? "text-white hover:bg-white/10" : "text-slate-600 hover:bg-slate-100";
  return (
    <button
      type="button"
      onClick={ganti}
      title={LABEL[tema]}
      aria-label={`${LABEL[tema]}. Tekan untuk mengganti.`}
      className={`grid size-11 shrink-0 place-items-center rounded-lg transition ${warna} ${className}`}
    >
      {/* Ikon baru dirender setelah pilihan tersimpan terbaca, agar tidak beda antara server dan klien. */}
      {siap ? <Ikon className="size-[18px]" strokeWidth={1.8} aria-hidden /> : <Monitor className="size-[18px]" strokeWidth={1.8} aria-hidden />}
    </button>
  );
}
