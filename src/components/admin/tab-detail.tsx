"use client";

import { useSearchParams } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

/**
 * Tab yang semua panelnya sudah dirender server; pindah tab hanya mengganti `?tab=` lewat history,
 * tanpa navigasi RSC. Navigasi RSC antar-tab di halaman ini kadang macet di router Next.js (tab Data Diri yang besar).
 */
export function TabDetail({ tabs, panel, awal }: { tabs: readonly (readonly [string, string])[]; panel: Record<string, ReactNode>; awal: string }) {
  const diminta = useSearchParams().get("tab");
  const aktif = tabs.some(([s]) => s === diminta) ? diminta! : awal;

  function pilih(e: MouseEvent<HTMLAnchorElement>, slug: string) {
    // Ctrl/Shift/klik tengah tetap membuka tab browser baru seperti tautan biasa.
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (slug !== aktif) window.history.pushState(null, "", `?tab=${slug}`);
  }

  return (
    <>
      <nav aria-label="Bagian data" className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1">
        {tabs.map(([slug, label]) => (
          <a
            key={slug}
            href={`?tab=${slug}`}
            onClick={(e) => pilih(e, slug)}
            aria-current={aktif === slug ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
              aktif === slug ? "border-blue-700 text-blue-800" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {label}
          </a>
        ))}
      </nav>
      {tabs.map(([slug]) => (
        <div key={slug} hidden={slug !== aktif}>
          {panel[slug]}
        </div>
      ))}
    </>
  );
}
