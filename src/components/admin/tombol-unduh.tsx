"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";

/** Dropdown unduh daftar pendaftar (mengikuti filter aktif): Excel atau CSV. */
export function TombolUnduh({ qs, total }: { qs: string; total: number }) {
  const [buka, setBuka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sambung = qs ? `${qs}&` : "";

  useEffect(() => {
    if (!buka) return;
    const tutup = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setBuka(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    document.addEventListener("mousedown", tutup);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", tutup);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);

  const item = "flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-50";
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={buka}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        <Download className="size-4" aria-hidden /> Unduh ({total})
        <ChevronDown className={`size-4 transition-transform ${buka ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {buka && (
        <div role="menu" className="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <a role="menuitem" href={`/api/admin/export?${sambung}format=xlsx`} onClick={() => setBuka(false)} className={item}>
            <FileSpreadsheet className="size-4 text-emerald-700" aria-hidden /> Excel (.xlsx)
          </a>
          <a role="menuitem" href={`/api/admin/export?${sambung}format=csv`} onClick={() => setBuka(false)} className={item}>
            <FileText className="size-4 text-slate-500" aria-hidden /> CSV (.csv)
          </a>
        </div>
      )}
    </div>
  );
}
