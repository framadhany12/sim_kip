import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { keluar } from "@/app/actions/auth";
import { NavLinks } from "./nav-links";
import { LogoTedc } from "./logo";

const NAV_PENDAFTAR = [
  { href: "/dashboard", label: "Beranda" },
  { href: "/formulir/data-diri", label: "Formulir", match: "/formulir" },
  { href: "/status", label: "Status" },
  { href: "/bantuan", label: "Bantuan" },
  { href: "/akun", label: "Akun Saya" },
];
const NAV_ADMIN = [
  { href: "/admin", label: "Ringkasan", exact: true },
  { href: "/admin/pendaftar", label: "Pendaftar" },
  { href: "/admin/jurusan", label: "Jurusan" },
  { href: "/admin/rekomendasi", label: "Rekomendasi" },
  { href: "/admin/pertanyaan", label: "Pertanyaan" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/akun", label: "Akun" },
];
const NAV_TAMU = [
  { href: "/#tentang-kip", label: "Tentang KIP" },
  { href: "/#tentang-tedc", label: "Politeknik TEDC" },
  { href: "/#alur", label: "Alur" },
  { href: "/bantuan", label: "Bantuan & FAQ" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const links = !user ? NAV_TAMU : user.role === "admin" ? NAV_ADMIN : NAV_PENDAFTAR;
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-2.5">
          <LogoTedc size={40} />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold text-slate-900">KIP Kuliah</span>
            <span className="block text-xs text-slate-500">{user?.role === "admin" ? "Panel Admin · Politeknik TEDC" : "Politeknik TEDC Bandung"}</span>
          </span>
        </Link>
        <NavLinks links={links} />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-40 truncate text-sm text-slate-600 sm:inline">{user.nama}</span>
              <form action={keluar}>
                <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Keluar</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/masuk" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Masuk
              </Link>
              <Link href="/daftar" className="rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
