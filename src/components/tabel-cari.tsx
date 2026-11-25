"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { inputCls } from "@/lib/styles";

/**
 * Kolom cari untuk tabel kecil yang semua barisnya sudah dimuat: baris yang tidak cocok disembunyikan selagi mengetik.
 * Mencocokkan teks yang terlihat di baris; baris pesan kosong (satu sel melebar) tidak ikut disaring.
 */
export function TabelCari({ label, children }: { label: string; children: ReactNode }) {
  const [q, setQ] = useState("");
  const [sisa, setSisa] = useState<number | null>(null);
  const area = useRef<HTMLDivElement>(null);

  // Dijalankan ulang bila isi tabel berubah dari server, agar baris baru tetap tersaring.
  useEffect(() => {
    const baris = [...(area.current?.querySelectorAll<HTMLTableRowElement>("tbody > tr") ?? [])].filter((tr) => !(tr.cells.length === 1 && tr.cells[0].colSpan > 1));
    const kata = q.toLowerCase().split(/\s+/).filter(Boolean);
    let cocok = 0;
    for (const tr of baris) {
      const teks = tr.innerText.toLowerCase();
      const ya = kata.every((k) => teks.includes(k));
      tr.hidden = !ya;
      if (ya) cocok++;
    }
    setSisa(kata.length && baris.length ? cocok : null);
  }, [q, children]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <label htmlFor="cari-tabel" className="sr-only">
          {label}
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input id="cari-tabel" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={label} autoComplete="off" className={`${inputCls} pl-9`} />
      </div>
      <div ref={area}>{children}</div>
      <p role="status" className="text-sm text-slate-600">
        {sisa === 0 && "Tidak ada baris yang cocok dengan pencarian."}
      </p>
    </div>
  );
}
