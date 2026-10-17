import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { daftarTahun } from "@/lib/admin-query";
import { daftarMasterMahasiswa, PER_HALAMAN_MASTER, type FilterMasterMhs } from "@/lib/master-mahasiswa";
import { inputCls } from "@/lib/styles";

export const metadata = { title: "Master Mahasiswa" };

export default async function MasterMahasiswaPage({ searchParams }: { searchParams: Promise<FilterMasterMhs> }) {
  const f = await searchParams;
  const [{ rows, total, halaman, daftarJurusan }, pilihanTahun] = await Promise.all([daftarMasterMahasiswa(f), daftarTahun()]);
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN_MASTER));
  const qs = (extra: Record<string, string | number>) =>
    new URLSearchParams(Object.entries({ ...f, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master Mahasiswa"
        desc="Pendaftar yang sudah diterima dan menjadi mahasiswa. Klik nama mahasiswa untuk mengisi atau mengoreksi NIM dan kelas; mahasiswa juga dapat mengisinya sendiri lewat menu Mahasiswa di akunnya."
      />
      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.2fr_1fr_1fr_auto]">
          <div>
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Cari nama, email, NIK, NIM, atau kelas
            </label>
            <input id="q" name="q" defaultValue={f.q} className={inputCls} />
          </div>
          <div>
            <label htmlFor="jurusan" className="mb-1 block text-xs font-medium text-slate-600">
              Jurusan diterima
            </label>
            <select id="jurusan" name="jurusan" defaultValue={f.jurusan ?? ""} className={inputCls}>
              <option value="">Semua jurusan</option>
              {daftarJurusan.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tahun" className="mb-1 block text-xs font-medium text-slate-600">
              Tahun daftar
            </label>
            <select id="tahun" name="tahun" defaultValue={f.tahun ?? ""} className={inputCls}>
              <option value="">Semua tahun</option>
              {pilihanTahun.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nim" className="mb-1 block text-xs font-medium text-slate-600">
              NIM
            </label>
            <select id="nim" name="nim" defaultValue={f.nim ?? ""} className={inputCls}>
              <option value="">Semua</option>
              <option value="sudah">Sudah terisi</option>
              <option value="belum">Belum terisi</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Terapkan</button>
            <Link href="/admin/master-mahasiswa" className="rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Mahasiswa</th>
              <th className="px-4 py-3 font-semibold">NIK / Kontak</th>
              <th className="px-4 py-3 font-semibold">Jurusan</th>
              <th className="px-4 py-3 font-semibold">Beasiswa</th>
              <th className="px-4 py-3 font-semibold">NIM</th>
              <th className="px-4 py-3 font-semibold">Kelas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Belum ada mahasiswa yang cocok dengan filter.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/master-mahasiswa/${r.id}`} className="font-semibold text-blue-700 hover:underline">
                    {r.nama}
                  </Link>
                  <span className="block break-all text-xs text-slate-500">{r.email}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">
                  {r.nik ?? "—"}
                  <span className="block text-slate-500">{r.kontak ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.jurusan ?? "—"}</td>
                <td className="px-4 py-3 text-slate-700">{r.beasiswa ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{r.nim ?? <span className="font-sans text-slate-400">Belum diisi</span>}</td>
                <td className="px-4 py-3 text-slate-700">{r.kelas ?? <span className="text-slate-400">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {jumlahHalaman > 1 ? (
        <nav className="flex items-center justify-between text-sm" aria-label="Halaman">
          <span className="text-slate-600">
            Halaman {halaman} dari {jumlahHalaman} · {total} mahasiswa
          </span>
          <span className="flex gap-2">
            {halaman > 1 && (
              <Link href={`?${qs({ page: halaman - 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                ← Sebelumnya
              </Link>
            )}
            {halaman < jumlahHalaman && (
              <Link href={`?${qs({ page: halaman + 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                Berikutnya →
              </Link>
            )}
          </span>
        </nav>
      ) : (
        total > 0 && <p className="text-sm text-slate-500">{total} mahasiswa</p>
      )}
    </div>
  );
}
