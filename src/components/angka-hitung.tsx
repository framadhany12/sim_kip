"use client";

import { useEffect, useRef, useState } from "react";

/** Angka yang naik dari 0 ke nilai akhir saat pertama tampil; langsung final bila pengguna memilih kurangi gerakan. */
export function AngkaHitung({ nilai, durasi = 700 }: { nilai: number; durasi?: number }) {
  const [tampil, setTampil] = useState(nilai);
  const sudah = useRef(false);
  useEffect(() => {
    if (sudah.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sudah.current = true;
    let raf = 0;
    const mulai = performance.now();
    const langkah = (t: number) => {
      const p = Math.min(1, (t - mulai) / durasi);
      setTampil(Math.round(nilai * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [nilai, durasi]);
  return <>{new Intl.NumberFormat("id-ID").format(tampil)}</>;
}
