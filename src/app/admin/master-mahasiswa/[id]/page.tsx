import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { simpanAkademikAdmin } from "@/app/actions/akun-mahasiswa";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Card, Dl } from "@/components/ui";
import { muatLengkap, sudahMahasiswa } from "@/lib/pendaftaran";

export const metadata = { title: "Detail Mahasiswa" };

export default async function DetailMasterMahasiswa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await muatLengkap(id);
  if (!d || !sudahMahasiswa(d)) notFound();
  const x = d.diri;

  return (
    <div className="space-y-5">
      <Link href="/admin/master-mahasiswa" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Master Mahasiswa
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{x?.namaLengkap ?? d.user.nama}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{d.user.email}</p>
      </div>

      <Card title="Data akademik">
        <ActionForm action={simpanAkademikAdmin.bind(null, d.id)} className="space-y-5">
          <Dl items={[["Jurusan diterima", d.jurusanDiterima]]} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="nim" label="NIM" defaultValue={d.nim} maxLength={30} hint="Dapat juga diisi mahasiswa sendiri dari menu Mahasiswa di akunnya." contoh="2026101001" />
            <Field name="kelas" label="Kelas" defaultValue={d.kelas} maxLength={30} contoh="TI-1A" />
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <SubmitButton>Simpan Perubahan</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <Card
        title="Identitas & alamat"
        action={
          <Link href={`/admin/mahasiswa/${d.userId}?tab=data-diri`} className="text-sm font-semibold text-blue-700 hover:underline">
            Ubah di Master Calon Mahasiswa
          </Link>
        }
      >
        <Dl
          items={[
            ["NIK", x?.nik ?? d.user.nik],
            ["Nomor HP/WhatsApp", x?.kontak],
            ["Alamat", x ? `${x.alamatLengkap}, RT ${x.rt}/RW ${x.rw}, ${x.desaKelurahan}, ${x.kecamatan}, ${x.kabupaten}, ${x.provinsi}` : null],
          ]}
        />
      </Card>
    </div>
  );
}
