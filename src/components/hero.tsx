import type { ReactNode } from "react";

/** Banner judul halaman pendaftar: gradasi biru khas panel admin, dengan lingkaran dekoratif halus. */
export function Hero({ eyebrow, title, desc, children, className = "" }: { eyebrow?: string; title: ReactNode; desc?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d2a63] via-[#143c8f] to-[#2563eb] px-5 py-5 text-white shadow-lg shadow-blue-900/15 sm:px-7 sm:py-6 ${className}`}>
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-52 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-20 right-24 size-44 rounded-full bg-[#f5c400]/15" />
      <div className="relative">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">{eyebrow}</p>}
        <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-[15px]">{desc}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </section>
  );
}

/** Kotak angka kecil di dalam Hero. */
export function HeroStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 px-3.5 py-2.5 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-blue-200">{label}</p>
      <p className="mt-0.5 truncate text-base font-bold tabular-nums sm:text-lg">{value}</p>
    </div>
  );
}
