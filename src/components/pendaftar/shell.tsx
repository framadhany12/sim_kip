"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, FileText, CalendarCheck, ChartColumn, GraduationCap, House, ListChecks, LogOut, PiggyBank, UserRound, type LucideIcon } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { KreditAplikasi } from "@/components/kredit-aplikasi";
import { TombolPasang } from "@/components/pwa";
import { TombolTema } from "@/components/tombol-tema";

type Item = { href: string; label: string; match: string; icon: LucideIcon; kecuali?: string[] };

const MENU_FORMULIR: Item = { href: "/formulir/data-diri", label: "Formulir", match: "/formulir", icon: FileText };
const MENU_MAHASISWA = (bukuTabungan: boolean): Item[] => [
  { href: "/mahasiswa", label: "Mahasiswa", match: "/mahasiswa", icon: GraduationCap, kecuali: ["/mahasiswa/ipk", "/mahasiswa/kegiatan", "/mahasiswa/buku-tabungan"] },
  { href: "/mahasiswa/ipk", label: "Laporan IPK", match: "/mahasiswa/ipk", icon: ChartColumn },
  { href: "/mahasiswa/kegiatan", label: "Kegiatan", match: "/mahasiswa/kegiatan", icon: CalendarCheck },
  ...(bukuTabungan ? [{ href: "/mahasiswa/buku-tabungan", label: "Buku Tabungan", match: "/mahasiswa/buku-tabungan", icon: PiggyBank }] : []),
];

const MENU = (mahasiswa: boolean, bukuTabungan: boolean, tanpaStatus: boolean): Item[] => [
  { href: "/dashboard", label: mahasiswa ? "Dashboard" : "Beranda", match: "/dashboard", icon: House },
  ...(mahasiswa ? MENU_MAHASISWA(bukuTabungan) : [MENU_FORMULIR]),
  ...(tanpaStatus ? [] : [{ href: "/status", label: "Status Seleksi", match: "/status", icon: ListChecks }]),
  { href: "/bantuan", label: "Bantuan", match: "/bantuan", icon: CircleHelp },
  { href: "/akun", label: "Akun Saya", match: "/akun", icon: UserRound },
];

/**
 * Kerangka halaman pendaftar, mengikuti panel admin: sidebar di layar lebar (lg ke atas),
 * serta topbar + menu bawah di HP/tablet.
 */
export function PendaftarShell({
  children,
  nama,
  email,
  logo,
  aksiKeluar,
  mahasiswa = false,
  bukuTabungan = false,
  tanpaStatus = false,
}: {
  children: React.ReactNode;
  nama: string;
  email: string;
  logo: React.ReactNode;
  aksiKeluar: () => Promise<void>;
  /** Pendaftar yang sudah diterima: menu Formulir diganti menu Mahasiswa. */
  mahasiswa?: boolean;
  /** Mahasiswa angkatan 2026+ mendapat menu Buku Tabungan. */
  bukuTabungan?: boolean;
  /** Mahasiswa lama hasil impor tidak pernah ikut seleksi: menu Status Seleksi disembunyikan. */
  tanpaStatus?: boolean;
}) {
  const path = usePathname();
  const aktif = (i: Item) => (path === i.match || path.startsWith(i.match + "/")) && !i.kecuali?.some((k) => path === k || path.startsWith(k + "/"));
  const inisial = nama
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-dvh bg-[#f4f6fa] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#konten"
        className="sr-only rounded-lg bg-[#f5c400] px-4 font-semibold text-[#0d2a63] focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center"
      >
        Lewati ke konten utama
      </a>
      <aside className="sticky top-0 hidden h-dvh bg-[#0d2a63] lg:block">
        <nav aria-label="Menu pendaftar" className="flex h-full flex-col">
          <Link href="/dashboard" className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            {logo}
            <span className="leading-tight">
              <span className="block text-[15px] font-bold text-white">KIP Kuliah</span>
              <span className="block text-xs text-blue-200/80">Politeknik TEDC Bandung</span>
            </span>
          </Link>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-200/60">Menu</p>
            <ul className="space-y-0.5">
              {MENU(mahasiswa, bukuTabungan, tanpaStatus).map((i) => {
                const on = aktif(i);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      aria-current={on ? "page" : undefined}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        on ? "bg-white/12 text-white" : "text-blue-100/80 hover:bg-white/6 hover:text-white"
                      }`}
                    >
                      {on && <span aria-hidden className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-[#f5c400]" />}
                      <i.icon className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
                      {i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <form action={aksiKeluar} className="border-t border-white/10 p-3">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-100/80 hover:bg-white/6 hover:text-white">
              <LogOut className="size-[18px]" strokeWidth={1.8} aria-hidden /> Keluar
            </button>
          </form>
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6" style={{ top: "env(safe-area-inset-top, 0px)" }}>
          <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden" aria-label="Beranda">
            {logo}
            <span className="hidden leading-tight min-[380px]:block">
              <span className="block text-[15px] font-bold text-slate-900">KIP Kuliah</span>
              <span className="block text-xs text-slate-500">Politeknik TEDC</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <TombolPasang />
            <TombolTema />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-slate-900">{nama}</p>
              <p className="max-w-56 truncate text-xs text-slate-500">{email}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-[#0d2a63] text-sm font-bold text-white" aria-hidden>
              {inisial || "P"}
            </span>
            <form action={aksiKeluar} className="lg:hidden">
              <button className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Keluar">
                <LogOut className="size-5" aria-hidden />
              </button>
            </form>
          </div>
        </header>
        {/* pb-28: ruang untuk menu bawah (HP/tablet) beserta area aman perangkat. */}
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-8">
          {children}
          <KreditAplikasi className="mt-10" />
        </div>
      </div>
      <BottomNav mahasiswa={mahasiswa} tanpaStatus={tanpaStatus} />
    </div>
  );
}
