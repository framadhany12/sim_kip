"use client";

import Link from "next/link";
import { KreditAplikasi } from "@/components/kredit-aplikasi";
import { TombolPasang } from "@/components/pwa";
import { TombolTema } from "@/components/tombol-tema";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpenText,
  BookUser,
  CalendarCheck,
  ChartPie,
  FileSpreadsheet,
  BadgeCheck,
  CalendarDays,
  Contact,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Award,
  School,
  Menu,
  Megaphone,
  PanelsTopLeft,
  PiggyBank,
  MessageCircleQuestion,
  Search,
  UserX,
  Share2,
  ShieldCheck,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: number };

export function AdminShell({
  children,
  nama,
  email,
  pertanyaanBaru,
  logo,
  aksiKeluar,
}: {
  children: React.ReactNode;
  nama: string;
  email: string;
  pertanyaanBaru: number;
  logo: React.ReactNode;
  aksiKeluar: () => Promise<void>;
}) {
  const path = usePathname();
  const [buka, setBuka] = useState(false);
  useEffect(() => setBuka(false), [path]);

  const grup: { judul: string; item: Item[] }[] = [
    { judul: "Utama", item: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
    {
      judul: "Seleksi",
      item: [
        { href: "/admin/pendaftar", label: "Data Pendaftar", icon: Users },
        { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
        { href: "/admin/diterima", label: "Mahasiswa Diterima", icon: BadgeCheck },
        { href: "/admin/ditolak", label: "Mahasiswa Ditolak", icon: UserX },
      ],
    },
    {
      judul: "Master data",
      item: [
        { href: "/admin/mahasiswa", label: "Master Calon Mahasiswa", icon: Contact },
        { href: "/admin/user", label: "Manajemen User", icon: ShieldCheck },
        { href: "/admin/tahun-ajaran", label: "Tahun Ajaran", icon: CalendarDays },
        { href: "/admin/jurusan", label: "Jurusan", icon: GraduationCap },
        { href: "/admin/rekomendasi", label: "Sumber Rekomendasi", icon: Share2 },
        { href: "/admin/beasiswa", label: "Jenis Beasiswa", icon: Award },
        { href: "/admin/sekolah", label: "Master Sekolah", icon: School },
      ],
    },
    {
      judul: "SIM KIP",
      item: [
        { href: "/admin/dashboard-mahasiswa", label: "Dashboard Mahasiswa", icon: ChartPie },
        { href: "/admin/master-mahasiswa", label: "Master Mahasiswa", icon: BookUser },
        { href: "/admin/pelaporan", label: "Pelaporan IPK & Transkrip", icon: FileSpreadsheet },
        { href: "/admin/kegiatan", label: "Kegiatan", icon: CalendarCheck },
        { href: "/admin/buku-tabungan", label: "Buku Tabungan", icon: PiggyBank },
      ],
    },
    { judul: "Informasi", item: [{ href: "/admin/landing", label: "Landing Page", icon: PanelsTopLeft }] },
    {
      judul: "Layanan",
      item: [
        { href: "/admin/pertanyaan", label: "Tanya Admin", icon: MessageCircleQuestion, badge: pertanyaanBaru },
        { href: "/admin/faq", label: "FAQ", icon: BookOpenText },
      ],
    },
    { judul: "Akun", item: [{ href: "/admin/akun", label: "Akun Saya", icon: UserCog }] },
  ];
  const aktif = (i: Item) => (i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/"));
  const inisial = nama
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const sidebar = (
    <nav aria-label="Menu admin" className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        {logo}
        <span className="leading-tight">
          <span className="block text-[15px] font-bold text-white">KIP Kuliah</span>
          <span className="block text-xs text-blue-200/80">Panel Admin · Poltek TEDC</span>
        </span>
      </Link>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {grup.map((g) => (
          <div key={g.judul}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-200/60">{g.judul}</p>
            <ul className="space-y-0.5">
              {g.item.map((i) => {
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
                      <span className="flex-1">{i.label}</span>
                      {!!i.badge && (
                        <span className="rounded-full bg-[#f5c400] px-1.5 py-px text-[11px] font-bold text-[#0d2a63]" aria-label={`${i.badge} belum dijawab`}>
                          {i.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <form action={aksiKeluar} className="border-t border-white/10 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-100/80 hover:bg-white/6 hover:text-white">
          <LogOut className="size-[18px]" strokeWidth={1.8} aria-hidden /> Keluar
        </button>
      </form>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#f4f6fa] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh bg-[#0d2a63] lg:block">{sidebar}</aside>

      {/* Sidebar ponsel */}
      {buka && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
          <button className="absolute inset-0 bg-black/50" aria-label="Tutup menu" onClick={() => setBuka(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0d2a63] shadow-xl">
            <button onClick={() => setBuka(false)} className="absolute right-3 top-4 rounded-md p-1.5 text-blue-100 hover:bg-white/10" aria-label="Tutup menu">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6" style={{ top: "env(safe-area-inset-top, 0px)" }}>
          <button onClick={() => setBuka(true)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <form action="/admin/pendaftar" className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <label htmlFor="cari-global" className="sr-only">
              Cari pendaftar
            </label>
            <input
              id="cari-global"
              name="q"
              placeholder="Cari nama, NIK, No. KIP, sekolah…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            {/* Pencarian cepat mencari di semua status dan semua tahun. */}
            <input type="hidden" name="status" value="semua" />
            <input type="hidden" name="tahun" value="semua" />
          </form>
          <div className="ml-auto flex items-center gap-3">
            <TombolPasang />
            <TombolTema />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-slate-900">{nama}</p>
              <p className="text-xs text-slate-500">{email}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-[#0d2a63] text-sm font-bold text-white" aria-hidden>
              {inisial || "A"}
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
          <KreditAplikasi className="mt-10" />
        </main>
      </div>
    </div>
  );
}
