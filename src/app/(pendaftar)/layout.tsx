import { keluar } from "@/app/actions/auth";
import { LogoTedc } from "@/components/logo";
import { FormSandiAwal } from "@/components/pendaftar/form-sandi-awal";
import { PendaftarShell } from "@/components/pendaftar/shell";
import { requirePendaftar } from "@/lib/auth";
import { wajibBukuTabungan } from "@/lib/buku-tabungan";
import { cariPendaftaranUser, sudahMahasiswa } from "@/lib/pendaftaran";

export default async function PendaftarLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePendaftar();
  const p = await cariPendaftaranUser(user.id);
  const mahasiswa = !!p && sudahMahasiswa(p);
  const bukuTabungan = mahasiswa && (await wajibBukuTabungan(p.id));
  return (
    <PendaftarShell nama={user.nama} email={user.email} logo={<LogoTedc size={36} />} aksiKeluar={keluar} mahasiswa={mahasiswa} bukuTabungan={bukuTabungan} tanpaStatus={user.mahasiswaLama}>
      <main id="konten">{user.wajibGantiSandi ? <FormSandiAwal nama={user.nama} /> : children}</main>
    </PendaftarShell>
  );
}
