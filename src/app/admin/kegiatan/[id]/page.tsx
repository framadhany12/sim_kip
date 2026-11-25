import Link from "next/link";
import { TabelCari } from "@/components/tabel-cari";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { BarcodeKegiatan } from "@/components/admin/barcode-kegiatan";
import { MuatUlangPresensi } from "@/components/admin/muat-ulang-presensi";
import { Card } from "@/components/ui";
import { tanggal } from "@/lib/constants";
import { ambilKegiatan, rekapKegiatan, STEP_DETIK } from "@/lib/kegiatan";

export const metadata = { title: "Detail Kegiatan" };

export default async function DetailKegiatan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const k = await ambilKegiatan(id);
  if (!k) notFound();
  const rekap = await rekapKegiatan(id);

  return (
    <div className="space-y-5">
      <MuatUlangPresensi kegiatanId={k.id} jumlahAwal={rekap.length} />
      <Link href="/admin/kegiatan" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Kegiatan
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{k.nama}</h1>
        <p className="mt-0.5 text-sm text-slate-600">
          {tanggal(k.mulai)} s.d. {tanggal(k.selesai)}
          {k.lokasi && <> · {k.lokasi}</>} · {k.angkatanSasaran ? `Angkatan ${k.angkatanSasaran.split(",").join(", ")}` : "Semua angkatan"}
        </p>
        {k.deskripsi && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{k.deskripsi}</p>}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[auto_1fr]">
        <Card title="Barcode presensi">
          <BarcodeKegiatan kegiatanId={k.id} stepDetik={STEP_DETIK} />
          <p className="mt-3 max-w-[320px] text-xs text-slate-500">Tampilkan di layar kegiatan. Kode berganti tiap {STEP_DETIK} detik sehingga tidak bisa dibagikan lewat foto.</p>
        </Card>

        <Card
          title={`Rekap kehadiran (${rekap.length})`}
          action={
            <a
              href={`/api/admin/export-kegiatan?id=${k.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <Download className="size-4" aria-hidden /> Export Excel
            </a>
          }
        >
          <TabelCari label="Cari mahasiswa (nama, NIM)">
            <div className="-mx-4 overflow-x-auto sm:-mx-5">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold sm:px-5">No</th>
                    <th className="px-4 py-2.5 font-semibold">Mahasiswa</th>
                    <th className="px-4 py-2.5 font-semibold">NIM / Kelas</th>
                    <th className="px-4 py-2.5 font-semibold">Jurusan</th>
                    <th className="px-4 py-2.5 font-semibold">Waktu hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rekap.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                        Belum ada yang presensi.
                      </td>
                    </tr>
                  )}
                  {rekap.map((r, i) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2.5 tabular-nums text-slate-500 sm:px-5">{i + 1}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{r.nama}</td>
                      <td className="px-4 py-2.5 font-mono text-[13px] text-slate-700">
                        {r.nim ?? "—"}
                        <span className="block font-sans text-slate-500">{r.kelas ?? "—"}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{r.jurusan ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{tanggal(r.waktu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabelCari>
        </Card>
      </div>
    </div>
  );
}
