import Link from "next/link";
import { TabelCari } from "@/components/tabel-cari";
import { FormKegiatan } from "@/components/admin/form-kegiatan";
import { TombolHapusKegiatan } from "@/components/admin/tombol-hapus-kegiatan";
import { Card, PageHeader } from "@/components/ui";
import { tanggal } from "@/lib/constants";
import { daftarKegiatan, statusKegiatan } from "@/lib/kegiatan";
import { ringkasPerAngkatan } from "@/lib/pelaporan-akademik";

export const metadata = { title: "Kegiatan" };

const BADGE = {
  akan: ["Akan datang", "bg-blue-50 text-blue-800 ring-blue-200"],
  berlangsung: ["Berlangsung", "bg-emerald-50 text-emerald-800 ring-emerald-200"],
  selesai: ["Selesai", "bg-slate-100 text-slate-700 ring-slate-300"],
} as const;

export default async function KegiatanPage() {
  const [daftar, ringkas] = await Promise.all([daftarKegiatan(), ringkasPerAngkatan()]);
  return (
    <div className="space-y-5">
      <PageHeader title="Kegiatan" desc="Kegiatan kemahasiswaan. Setiap kegiatan punya barcode presensi yang berganti otomatis; mahasiswa memindainya dari akunnya." />
      <Card title="Tambah kegiatan">
        <FormKegiatan pilihan={ringkas} />
      </Card>

      <TabelCari label="Cari kegiatan">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Kegiatan</th>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Lokasi</th>
                <th className="px-4 py-3 font-semibold">Angkatan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Hadir</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daftar.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Belum ada kegiatan.
                  </td>
                </tr>
              )}
              {daftar.map((k) => {
                const [label, cls] = BADGE[statusKegiatan(k)];
                return (
                  <tr key={k.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/kegiatan/${k.id}`} className="font-semibold text-blue-700 hover:underline">
                        {k.nama}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {tanggal(k.mulai)}
                      <span className="block text-xs text-slate-500">s.d. {tanggal(k.selesai)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{k.lokasi ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{k.angkatanSasaran ? k.angkatanSasaran.split(",").join(", ") : "Semua"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>{label}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">{Number(k.hadir)}</td>
                    <td className="px-4 py-3">
                      <TombolHapusKegiatan id={k.id} nama={k.nama} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TabelCari>
    </div>
  );
}
