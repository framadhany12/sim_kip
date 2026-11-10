"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGKAH } from "@/lib/constants";

type Langkah = readonly { slug: string; label: string }[];

/** Langkah formulir bertahap. Bawaannya formulir pendaftaran; `langkah` + `basis` dipakai untuk Lengkapi Data mahasiswa lama. */
export function Stepper({ selesai, langkah = LANGKAH, basis = "/formulir", label = "Formulir" }: { selesai: Record<string, boolean>; langkah?: Langkah; basis?: string; label?: string }) {
  const path = usePathname();
  const aktif = langkah.findIndex((l) => path.endsWith("/" + l.slug));
  const jumlahSelesai = langkah.filter((l) => selesai[l.slug]).length;
  const kolom = { gridTemplateColumns: `repeat(${langkah.length}, minmax(0, 1fr))` };
  return (
    <nav aria-label={`Langkah ${label.toLowerCase()}`}>
      {/* HP & tablet: ringkasan satu baris + segmen yang bisa disentuh */}
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-900/5 lg:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 text-[15px] font-bold leading-tight text-slate-900">
            <span className="mr-1.5 text-blue-700">{aktif >= 0 ? aktif + 1 : "-"}/{langkah.length}</span>
            {aktif >= 0 ? langkah[aktif].label : label}
          </p>
          <p className="shrink-0 text-xs font-medium text-slate-500">{jumlahSelesai} selesai</p>
        </div>
        <ol className="mt-3 grid gap-1.5" style={kolom}>
          {langkah.map((l, i) => (
            <li key={l.slug}>
              <Link
                href={`${basis}/${l.slug}`}
                aria-label={`Langkah ${i + 1}: ${l.label}${selesai[l.slug] ? " (selesai)" : ""}`}
                aria-current={i === aktif ? "step" : undefined}
                className="group flex h-9 items-center justify-center"
              >
                <span
                  className={`${i === aktif || selesai[l.slug] ? "langkah-isi " : ""}h-2 w-full rounded-full transition ${
                    i === aktif ? "bg-gradient-to-r from-[#2563eb] to-[#0d2a63]" : selesai[l.slug] ? "bg-emerald-500" : "bg-slate-200 group-active:bg-slate-300"
                  }`}
                />
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* Laptop: semua langkah tampil sekaligus */}
      <ol className="hidden gap-2 lg:grid" style={kolom}>
        {langkah.map((l, i) => {
          const isAktif = i === aktif;
          const done = selesai[l.slug];
          return (
            <li key={l.slug}>
              <Link
                href={`${basis}/${l.slug}`}
                aria-current={isAktif ? "step" : undefined}
                className={`flex h-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                  isAktif ? "border-blue-600 bg-gradient-to-r from-blue-50 to-white text-blue-900 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    done ? "bg-emerald-600 text-white" : isAktif ? "bg-gradient-to-b from-[#2563eb] to-[#0d2a63] text-white" : "bg-slate-200 text-slate-600"
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
