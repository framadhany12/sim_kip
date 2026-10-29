import { keluar } from "@/app/actions/auth";
import { LogoTedc } from "@/components/logo";
import { PendaftarShell } from "@/components/pendaftar/shell";
import { getCurrentUser } from "@/lib/auth";
import { wajibBukuTabungan } from "@/lib/buku-tabungan";
import { cariPendaftaranUser, sudahMahasiswa } from "@/lib/pendaftaran";

/** Pendaftar yang sudah masuk melihat Bantuan di dalam kerangka pendaftar (sidebar/menu bawah); tamu memakai header situs. */
export default async function BantuanLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user?.role !== "pendaftar") return <>{children}</>;
  // Menu harus sama dengan halaman pendaftar lain: mahasiswa melihat menu Mahasiswa, bukan Formulir.
  const p = await cariPendaftaranUser(user.id);
  const mahasiswa = !!p && sudahMahasiswa(p);
  const bukuTabungan = mahasiswa && (await wajibBukuTabungan(p.id));
  return (
    <PendaftarShell nama={user.nama} email={user.email} logo={<LogoTedc size={36} />} aksiKeluar={keluar} mahasiswa={mahasiswa} bukuTabungan={bukuTabungan}>
      {children}
    </PendaftarShell>
  );
}
