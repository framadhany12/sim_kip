import { keluar } from "@/app/actions/auth";
import { LogoTedc } from "@/components/logo";
import { PendaftarShell } from "@/components/pendaftar/shell";
import { requirePendaftar } from "@/lib/auth";
import { cariPendaftaranUser, sudahMahasiswa } from "@/lib/pendaftaran";

export default async function PendaftarLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePendaftar();
  const p = await cariPendaftaranUser(user.id);
  return (
    <PendaftarShell nama={user.nama} email={user.email} logo={<LogoTedc size={36} />} aksiKeluar={keluar} mahasiswa={!!p && sudahMahasiswa(p)}>
      <main>{children}</main>
    </PendaftarShell>
  );
}
