import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { keluar } from "@/app/actions/auth";
import { NavLinks } from "./nav-links";
import { LogoTedc } from "./logo";

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
  // Pendaftar memakai kerangka sendiri (sidebar + menu bawah), bukan header ini.
  if (user?.role === "pendaftar") return null;
  const links = !user ? NAV_TAMU : NAV_ADMIN;
  return (
    <>
    <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-r from-[#0d2a63] via-[#12378a] to-[#1d4fb8] text-white shadow-md shadow-blue-950/10">
      <div className="mx-auto flex max-w-6xl flex-nowrap items-center md:flex-wrap gap-x-4 gap-y-2 px-4 py-2.5 md:gap-x-6 md:py-3">
        <Link href={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/"} className="flex items-center gap-2.5">
          <LogoTedc size={40} />
          <span className="hidden leading-tight min-[400px]:block">
            <span className="block text-[15px] font-bold text-white">KIP Kuliah</span>
            <span className="hidden text-xs text-blue-200/80 min-[420px]:block">{user?.role === "admin" ? "Panel Admin · Politeknik TEDC" : "Politeknik TEDC Bandung"}</span>
          </span>
        </Link>
        <NavLinks links={links} />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-40 truncate text-sm text-blue-100 sm:inline">{user.nama}</span>
              <form action={keluar}>
                <button className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-white ring-1 ring-white/30 hover:bg-white/10">Keluar</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/bantuan" className="inline-flex min-h-10 items-center rounded-lg px-2.5 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white md:hidden">
                Bantuan
              </Link>
              <Link href="/masuk" className="inline-flex min-h-10 items-center rounded-lg px-2.5 text-sm font-medium text-white hover:bg-white/10 sm:px-3">
                Masuk
              </Link>
              <Link href="/daftar" className="inline-flex min-h-10 items-center rounded-lg bg-[#f5c400] px-3.5 text-sm font-semibold text-[#0d2a63] hover:bg-[#ffd21f]">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
