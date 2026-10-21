import Link from "next/link";
import { redirect } from "next/navigation";
import { Hero } from "@/components/hero";
import { Stepper } from "@/components/stepper";
import { Alert } from "@/components/ui";
import { requirePendaftar } from "@/lib/auth";
import { BAGIAN_LENGKAPI, cekLengkapMahasiswaLama } from "@/lib/mahasiswa-lama";
import { cariPendaftaranUser, muatLengkap } from "@/lib/pendaftaran";

export default async function LengkapiLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePendaftar();
  if (!user.mahasiswaLama) redirect("/dashboard");
  const p = await cariPendaftaranUser(user.id);
  const d = p && (await muatLengkap(p.id));
  if (!d) redirect("/dashboard");
  const { selesai, semua } = cekLengkapMahasiswaLama(d);

  return (
    <div className="space-y-6">
      <Hero
        eyebrow={d.angkatan ? `Mahasiswa KIP Kuliah angkatan ${d.angkatan}` : "Mahasiswa KIP Kuliah"}
        title="Lengkapi Data Mahasiswa"
        desc="Akun Anda dibuat oleh admin. Isi kelima bagian di bawah; tidak perlu mengunggah berkas. Menu Lapor IPK dan Kegiatan terbuka setelah semua bagian lengkap."
      />
      <Stepper selesai={selesai} langkah={BAGIAN_LENGKAPI} basis="/lengkapi-data" label="Lengkapi Data" />
      {semua && (
        <Alert tone="success" title="Data Anda sudah lengkap">
          Anda masih bisa memperbaiki isian di sini.{" "}
          <Link href="/mahasiswa" className="font-semibold underline">
            Buka menu Mahasiswa
          </Link>
        </Alert>
      )}
      {children}
    </div>
  );
}
