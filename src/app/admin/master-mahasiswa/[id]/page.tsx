import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { jenisBeasiswa } from "@/db/schema";
import { ArrowLeft } from "lucide-react";
import { simpanAkademikAdmin, ubahStatusMahasiswa } from "@/app/actions/akun-mahasiswa";
import { FormStatusMahasiswa } from "@/components/admin/form-status-mahasiswa";
import { ActionForm, Field, Select, SubmitButton } from "@/components/form";
import { Card, Dl, StatusMahasiswaBadge } from "@/components/ui";
import type { StatusMahasiswa } from "@/db/schema";
import { STATUS_MAHASISWA_LABEL, tanggal, tanggalPanjang } from "@/lib/constants";
import { muatLengkap, sudahMahasiswa } from "@/lib/pendaftaran";

export const metadata = { title: "Detail Mahasiswa" };

export default async function DetailMasterMahasiswa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await muatLengkap(id);
  if (!d || !sudahMahasiswa(d)) notFound();
  const x = d.diri;
  const db = await getDb();
  const beasiswa = await db
    .select({ value: jenisBeasiswa.id, label: jenisBeasiswa.nama })
    .from(jenisBeasiswa)
    .where(d.jenisBeasiswaId ? or(eq(jenisBeasiswa.aktif, true), eq(jenisBeasiswa.id, d.jenisBeasiswaId)) : eq(jenisBeasiswa.aktif, true))
    .orderBy(asc(jenisBeasiswa.urutan), asc(jenisBeasiswa.nama));
  const nama = x?.namaLengkap ?? d.user.nama;
  const riwayatStatus = d.riwayat.filter((r) => r.status.startsWith("mhs:")).slice(0, 10);
  const hariIni = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <Link href="/admin/master-mahasiswa" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Master Mahasiswa
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{nama}</h1>
          <StatusMahasiswaBadge status={d.statusMahasiswa} />
        </div>
        <p className="mt-0.5 text-sm text-slate-600">
          <span className="break-all">{d.user.email}</span>
          {d.statusMahasiswa !== "aktif" && d.statusMahasiswaTanggal && <> · sejak {tanggalPanjang(d.statusMahasiswaTanggal)}, akun nonaktif</>}
        </p>
      </div>

      <Card title="Status mahasiswa">
        <FormStatusMahasiswa
          action={ubahStatusMahasiswa.bind(null, d.id)}
          nama={nama}
          status={d.statusMahasiswa}
          tanggal={d.statusMahasiswaTanggal}
          keterangan={d.statusMahasiswaKeterangan}
          hariIni={hariIni}
        />
        {riwayatStatus.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800">Riwayat perubahan status</h3>
            <ol className="mt-2 divide-y divide-slate-100 text-sm">
              {riwayatStatus.map((r) => (
                <li key={r.id} className="py-2.5">
                  <p className="font-medium text-slate-900">{STATUS_MAHASISWA_LABEL[r.status.slice(4) as StatusMahasiswa] ?? r.status}</p>
                  {r.catatan && <p className="text-slate-700">{r.catatan}</p>}
                  <p className="text-xs text-slate-500">
                    {tanggal(r.createdAt)}
                    {r.oleh && <> · oleh {r.oleh}</>}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Card>

      <Card title="Data akademik">
        <ActionForm action={simpanAkademikAdmin.bind(null, d.id)} className="space-y-5">
          <Dl items={[["Jurusan diterima", d.jurusanDiterima]]} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="nim" label="NIM" defaultValue={d.nim} maxLength={30} hint="Dapat juga diisi mahasiswa sendiri dari menu Mahasiswa di akunnya." contoh="2026101001" />
            <Field name="kelas" label="Kelas" defaultValue={d.kelas} maxLength={30} contoh="TI-1A" />
            <Select
              name="jenisBeasiswaId"
              label="Jenis beasiswa"
              defaultValue={d.jenisBeasiswaId}
              options={beasiswa}
              placeholder="Belum ditetapkan"
              hint="Hanya terlihat admin."
            />
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
