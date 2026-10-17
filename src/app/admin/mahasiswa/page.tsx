import Link from "next/link";
import { CheckCircle2, MailWarning } from "lucide-react";
import { TombolAktif } from "@/components/admin/tombol-aktif";
import { Card, PageHeader } from "@/components/ui";
import { daftarTahun } from "@/lib/admin-query";
import { labelProses, tanggal } from "@/lib/constants";
import { daftarMahasiswa, PER_HALAMAN_MHS, type FilterMahasiswa } from "@/lib/mahasiswa";
import { inputCls } from "@/lib/styles";

export const metadata = { title: "Master Calon Mahasiswa" };

export default async function MasterMahasiswa({ searchParams }: { searchParams: Promise<FilterMahasiswa> }) {
  const f = await searchParams;
  const [{ rows, total, halaman }, pilihanTahun] = await Promise.all([daftarMahasiswa(f), daftarTahun()]);
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN_MHS));
  const qs = (extra: Record<string, string | number>) =>
    new URLSearchParams(Object.entries({ ...f, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master Calon Mahasiswa"
        desc="Seluruh akun pendaftar, termasuk yang belum mengisi formulir. Buka satu akun untuk melihat data lengkap, mengedit data, dan mengatur ulang kata sandi."
      />
      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <div>
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Cari nama, email, NIK, NISN, No. Pendaftaran KIP, atau sekolah
            </label>
            <input id="q" name="q" defaultValue={f.q} placeholder="mis. Siti / siti@gmail.com / 3277…" className={inputCls} />
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
            <label htmlFor="verifikasi" className="mb-1 block text-xs font-medium text-slate-600">
              Verifikasi email
            </label>
            <select id="verifikasi" name="verifikasi" defaultValue={f.verifikasi ?? ""} className={inputCls}>
              <option value="">Semua</option>
              <option value="terverifikasi">Sudah terverifikasi</option>
              <option value="belum">Belum terverifikasi</option>
            </select>
          </div>
          <div>
            <label htmlFor="akun" className="mb-1 block text-xs font-medium text-slate-600">
              Status akun
            </label>
            <select id="akun" name="akun" defaultValue={f.akun ?? ""} className={inputCls}>
              <option value="">Semua</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Terapkan</button>
            <Link href="/admin/mahasiswa" className="rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Mahasiswa</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">No. KIP / NIK / NISN</th>
              <th className="px-4 py-3 font-semibold">Asal sekolah</th>
              <th className="px-4 py-3 font-semibold">Mendaftar</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Akun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Tidak ada akun yang cocok dengan filter.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/mahasiswa/${r.id}`} className="font-semibold text-blue-700 hover:underline">
                    {r.namaLengkap ?? r.nama}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <span className="block break-all">{r.email}</span>
                  {r.terverifikasi ? (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-700">
                      <CheckCircle2 className="size-3.5" aria-hidden /> Terverifikasi
                    </span>
                  ) : (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-700">
                      <MailWarning className="size-3.5" aria-hidden /> Belum verifikasi
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">
                  {r.nomorKip ?? <span className="font-sans text-slate-400">—</span>}
                  <span className="block text-slate-500">{r.nik ?? "—"}</span>
                  <span className="block text-slate-500">{r.nisn ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.sekolah ?? <span className="text-slate-400">—</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{tanggal(r.daftarPada)}</td>
                <td className="px-4 py-3">
                  {r.status ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">{labelProses(r.status, r.tahap, r.usulan)}</span>
                  ) : (
                    <span className="text-xs text-slate-400">Belum membuka formulir</span>
                  )}
                </td>
                <td className="px-4 py-3"><TombolAktif userId={r.id} nama={r.namaLengkap ?? r.nama} aktif={r.aktif} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {jumlahHalaman > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Halaman">
          <span className="text-slate-600">
            Halaman {halaman} dari {jumlahHalaman} · {total} akun
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
      )}
      {jumlahHalaman === 1 && total > 0 && <p className="text-sm text-slate-500">{total} akun</p>}
    </div>
  );
}
