import { keluar } from "@/app/actions/auth";
import { LogoTedc } from "@/components/logo";
import { PendaftarShell } from "@/components/pendaftar/shell";
import { getCurrentUser } from "@/lib/auth";

/** Pendaftar yang sudah masuk melihat Bantuan di dalam kerangka pendaftar (sidebar/menu bawah); tamu memakai header situs. */
export default async function BantuanLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user?.role !== "pendaftar") return <>{children}</>;
  return (
    <PendaftarShell nama={user.nama} email={user.email} logo={<LogoTedc size={36} />} aksiKeluar={keluar}>
      {children}
    </PendaftarShell>
  );
}
