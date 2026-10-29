import Link from "next/link";
import { redirect } from "next/navigation";
import { KreditAplikasi } from "@/components/kredit-aplikasi";
import { LogoTedc } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { KAMPUS } from "@/lib/profil";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#0d2a63_0,#1646a0_13rem,transparent_19rem)]">
    <main id="konten" className="mx-auto grid max-w-md gap-6 px-4 py-8 sm:py-12">
      <Link href="/" className="flex flex-col items-center gap-3 text-center">
        <LogoTedc size={72} />
        <span className="leading-tight">
          <span className="block text-lg font-bold text-white">Pendaftaran KIP Kuliah</span>
          <span className="block text-sm text-blue-200">{KAMPUS.nama}</span>
        </span>
      </Link>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-blue-950/10 sm:p-8">{children}</div>
      <Link href="/" className="text-center text-sm font-medium text-slate-600 hover:text-[#0d2a63] dark:hover:text-blue-300">
        ← Kembali ke beranda
      </Link>
      <KreditAplikasi className="sm:flex-col sm:items-center sm:text-center" />
    </main>
    </div>
  );
}
