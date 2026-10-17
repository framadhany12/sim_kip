import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, Dl } from "@/components/ui";
import { tanggal } from "@/lib/constants";
import { detailPelaporanMahasiswa, ringkasSemester } from "@/lib/pelaporan-akademik";

export const metadata = { title: "Laporan IPK Mahasiswa" };

const ipkFmt = (v: string | number) => Number(v).toFixed(2).replace(".", ",");

export default async function DetailPelaporanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await detailPelaporanMahasiswa(id);
  if (!m) notFound();
  const lapor = m.laporan.map((l) => l.semester);
  const terakhir = m.laporan.at(-1);
  // Semester yang terlewat di antara semester pertama dan terakhir yang dilaporkan.
  const terlewat = lapor.length ? Array.from({ length: lapor[lapor.length - 1] }, (_, i) => i + 1).filter((s) => !lapor.includes(s)) : [];

  return (
    <div className="space-y-5">
      <Link href="/admin/pelaporan" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Pelaporan IPK & Transkrip
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{m.nama}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{m.email}</p>
      </div>

      <Card title="Data mahasiswa">
        <Dl
          items={[
            ["NIM", m.nim],
            ["Kelas", m.kelas],
            ["Jurusan", m.jurusan],
            ["Angkatan", m.angkatan],
            ["Nomor HP/WhatsApp", m.kontak],
            ["Laporan masuk", m.laporan.length ? `${ringkasSemester(lapor.join(","))} (${m.laporan.length} semester)` : "Belum ada"],
            ...(terakhir ? ([["IPK terakhir", `${ipkFmt(terakhir.ipk)} (Semester ${terakhir.semester})`]] as [string, string][]) : []),
          ]}
        />
        {terlewat.length > 0 && <p className="mt-3 text-sm text-amber-800">Belum melapor: Semester {terlewat.join(", ")}.</p>}
      </Card>

      <Card title="Laporan IPK per semester">
        {m.laporan.length === 0 ? (
          <p className="text-sm text-slate-500">Mahasiswa ini belum melaporkan IPK.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold sm:px-5">Semester</th>
                  <th className="px-4 py-2.5 font-semibold">IPK</th>
                  <th className="px-4 py-2.5 font-semibold">Dilaporkan</th>
                  <th className="px-4 py-2.5 font-semibold">Transkrip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {m.laporan.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 sm:px-5">Semester {l.semester}</td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-slate-900">{ipkFmt(l.ipk)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{tanggal(l.updatedAt)}</td>
                    <td className="px-4 py-2.5">
                      <a href={`/api/laporan-akademik/${l.id}`} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">
                        Buka
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
