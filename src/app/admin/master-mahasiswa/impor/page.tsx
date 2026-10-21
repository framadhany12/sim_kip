import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormImporMahasiswa } from "@/components/admin/form-impor-mahasiswa";
import { Card } from "@/components/ui";

export const metadata = { title: "Impor Mahasiswa Lama" };

export default function ImporMahasiswaPage() {
  return (
    <div className="space-y-5">
      <Link href="/admin/master-mahasiswa" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Master Mahasiswa
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Impor Mahasiswa Lama</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          Buat akun sekaligus untuk mahasiswa KIP Kuliah yang sudah berkuliah sebelum aplikasi ini dipakai. Akun langsung masuk Master Mahasiswa dan tidak
          tampil di data pendaftar, pengumuman, maupun statistik seleksi. Jenis beasiswa diisi admin dari detail mahasiswa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card title="Unggah berkas">
          <FormImporMahasiswa />
        </Card>
        <Card title="Isi berkas">
          <dl className="space-y-3 text-sm">
            {[
              ["Nama", "Nama lengkap mahasiswa."],
              ["NIK", "16 digit, kolom berformat Teks. NIK menjadi sandi awal."],
              ["Email", "Email aktif mahasiswa, untuk login dan lupa sandi."],
              ["Angkatan", "Tahun masuk kuliah, misalnya 2024."],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-semibold text-slate-900">{k}</dt>
                <dd className="text-slate-600">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-slate-100 pt-3 text-[13px] leading-relaxed text-slate-600">
            Baris yang NIK atau emailnya sudah punya akun dilewati, jadi berkas yang sama aman diimpor ulang.
          </p>
        </Card>
      </div>
    </div>
  );
}
