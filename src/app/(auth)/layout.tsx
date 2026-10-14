import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoTedc } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { KAMPUS } from "@/lib/profil";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");
  return (
    <main className="mx-auto grid max-w-md gap-6 px-4 py-10 sm:py-14">
      <Link href="/" className="flex flex-col items-center gap-3 text-center">
        <LogoTedc size={72} />
        <span className="leading-tight">
          <span className="block text-lg font-bold text-slate-900">Pendaftaran KIP Kuliah</span>
          <span className="block text-sm text-slate-600">{KAMPUS.nama}</span>
        </span>
      </Link>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
      <Link href="/" className="text-center text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Kembali ke beranda
      </Link>
    </main>
  );
}
