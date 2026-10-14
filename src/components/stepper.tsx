"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGKAH, type SlugLangkah } from "@/lib/constants";

export function Stepper({ selesai }: { selesai: Record<SlugLangkah, boolean> }) {
  const path = usePathname();
  const aktif = LANGKAH.findIndex((l) => path.endsWith("/" + l.slug));
  const jumlahSelesai = LANGKAH.filter((l) => selesai[l.slug]).length;
  return (
    <nav aria-label="Langkah formulir">
      {/* HP & tablet: ringkasan satu baris + 7 segmen yang bisa disentuh */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 text-[15px] font-bold leading-tight text-slate-900">
            <span className="mr-1.5 text-blue-700">{aktif >= 0 ? aktif + 1 : "-"}/{LANGKAH.length}</span>
            {aktif >= 0 ? LANGKAH[aktif].label : "Formulir"}
          </p>
          <p className="shrink-0 text-xs font-medium text-slate-500">{jumlahSelesai} selesai</p>
        </div>
        <ol className="mt-3 grid grid-cols-7 gap-1.5">
          {LANGKAH.map((l, i) => (
            <li key={l.slug}>
              <Link
                href={`/formulir/${l.slug}`}
                aria-label={`Langkah ${i + 1}: ${l.label}${selesai[l.slug] ? " (selesai)" : ""}`}
                aria-current={i === aktif ? "step" : undefined}
                className="group flex h-9 items-center justify-center"
              >
                <span
                  className={`h-2 w-full rounded-full transition ${
                    i === aktif ? "bg-blue-700" : selesai[l.slug] ? "bg-emerald-500" : "bg-slate-200 group-active:bg-slate-300"
                  }`}
                />
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* Laptop: semua langkah tampil sekaligus */}
      <ol className="hidden gap-2 lg:grid lg:grid-cols-7">
        {LANGKAH.map((l, i) => {
          const isAktif = i === aktif;
          const done = selesai[l.slug];
          return (
            <li key={l.slug}>
              <Link
                href={`/formulir/${l.slug}`}
                aria-current={isAktif ? "step" : undefined}
                className={`flex h-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                  isAktif ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    done ? "bg-emerald-600 text-white" : isAktif ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="font-medium leading-tight">{l.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
