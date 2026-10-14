"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGKAH, type SlugLangkah } from "@/lib/constants";

export function Stepper({ selesai }: { selesai: Record<SlugLangkah, boolean> }) {
  const path = usePathname();
  const aktif = LANGKAH.findIndex((l) => path.endsWith("/" + l.slug));
  return (
    <nav aria-label="Langkah formulir" className="-mx-4 overflow-x-auto px-4 pb-1">
      <ol className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-7">
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
