"use client";

import { useEffect, useState } from "react";

/**
 * Penambal bug React di build produksi: navigasi atau aksi server kadang tertahan selamanya walau datanya
 * sudah tiba (sinyal "ping" hilang). Update state apa pun membuat React mencoba lagi, jadi setelah interaksi
 * komponen ini memicu beberapa update kecil. Render-nya kosong sehingga tidak berpengaruh bila tidak macet.
 */
export function PemulihTransisi() {
  const [, setDetak] = useState(0);
  useEffect(() => {
    let timer: number[] = [];
    const jadwalkan = () => {
      timer.forEach(clearTimeout);
      timer = [300, 800, 1500, 3000, 6000].map((ms) => window.setTimeout(() => setDetak((n) => n + 1), ms));
    };
    window.addEventListener("click", jadwalkan, true);
    window.addEventListener("submit", jadwalkan, true);
    window.addEventListener("popstate", jadwalkan);
    return () => {
      timer.forEach(clearTimeout);
      window.removeEventListener("click", jadwalkan, true);
      window.removeEventListener("submit", jadwalkan, true);
      window.removeEventListener("popstate", jadwalkan);
    };
  }, []);
  return null;
}
