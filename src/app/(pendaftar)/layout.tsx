import { keluar } from "@/app/actions/auth";
import { LogoTedc } from "@/components/logo";
import { PendaftarShell } from "@/components/pendaftar/shell";
import { requirePendaftar } from "@/lib/auth";

export default async function PendaftarLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePendaftar();
  return (
    <PendaftarShell nama={user.nama} email={user.email} logo={<LogoTedc size={36} />} aksiKeluar={keluar}>
      <main>{children}</main>
    </PendaftarShell>
  );
}
