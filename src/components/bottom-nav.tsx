"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, FileText, CalendarCheck, ChartColumn, GraduationCap, House, ListChecks, UserRound, type LucideIcon } from "lucide-react";

const ITEM = (mahasiswa: boolean): { href: string; label: string; match: string; icon: LucideIcon; kecuali?: string[] }[] => [
  { href: "/dashboard", label: "Beranda", match: "/dashboard", icon: House },
  ...(mahasiswa
    ? [
        { href: "/mahasiswa", label: "Mahasiswa", match: "/mahasiswa", icon: GraduationCap, kecuali: ["/mahasiswa/ipk", "/mahasiswa/kegiatan"] },
        { href: "/mahasiswa/ipk", label: "IPK", match: "/mahasiswa/ipk", icon: ChartColumn },
        { href: "/mahasiswa/kegiatan", label: "Kegiatan", match: "/mahasiswa/kegiatan", icon: CalendarCheck },
      ]
    : [{ href: "/formulir/data-diri", label: "Formulir", match: "/formulir", icon: FileText }]),
  { href: "/status", label: "Status", match: "/status", icon: ListChecks },
  ...(mahasiswa ? [] : [{ href: "/bantuan", label: "Bantuan", match: "/bantuan", icon: CircleHelp }]),
  { href: "/akun", label: "Akun", match: "/akun", icon: UserRound },
];

/** Menu bawah untuk pendaftar di HP & tablet (di bawah lebar lg): mudah dijangkau ibu jari. */
export function BottomNav({ mahasiswa = false }: { mahasiswa?: boolean }) {
  const path = usePathname();
  return (
    <nav
      aria-label="Menu utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${ITEM(mahasiswa).length}, minmax(0, 1fr))` }}>
        {ITEM(mahasiswa).map((i) => {
          const aktif = (path === i.match || path.startsWith(i.match + "/")) && !i.kecuali?.some((k) => path === k || path.startsWith(k + "/"));
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={aktif ? "page" : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition active:bg-slate-100 ${
                  aktif ? "text-[#0d2a63]" : "text-slate-500"
                }`}
              >
                {aktif && <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-gradient-to-r from-[#2563eb] to-[#0d2a63]" />}
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${aktif ? "bg-blue-100" : ""}`}><i.icon className="size-[22px]" strokeWidth={aktif ? 2.2 : 1.8} aria-hidden /></span>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
