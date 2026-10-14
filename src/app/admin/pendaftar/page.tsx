import Link from "next/link";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { inputCls } from "@/lib/styles";
import { TAHAP_LABEL, tanggal } from "@/lib/constants";
import { cariPendaftar, daftarGelombang, FILTER_STATUS, PER_HALAMAN, type FilterPendaftar } from "@/lib/admin-query";
import type { Status } from "@/db/schema";

export const metadata = { title: "Daftar Pendaftar" };

const LABEL_FILTER: Record<string, string> = {
  masuk: "Dalam proses seleksi",
  semua: "Semua status",
  ...Object.fromEntries(Object.entries(TAHAP_LABEL).map(([k, v]) => [`tahap:${k}`, `Tahap: ${v}`])),
  diterima: "Pengumuman: Diterima",
  ditolak: "Pengumuman: Tidak diterima",
  draft: "Belum dikirim",
};

export default async function DaftarPendaftar({ searchParams }: { searchParams: Promise<FilterPendaftar> }) {
  const f = await searchParams;
  const [{ rows, total, page = 1 }, gelombang] = await Promise.all([cariPendaftar(f), daftarGelombang()]);
  const qs = (extra: Record<string, string | number>) =>
    new URLSearchParams(Object.entries({ ...f, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();
  const halaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const exportQs = qs({ page: "" });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daftar Pendaftar"
        desc="Cari, saring, buka detail untuk memverifikasi, dan unduh data untuk laporan."
        action={
          <a href={`/api/admin/export?${exportQs}`} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            ⬇ Unduh CSV ({total})
          </a>
        }
      />
      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
          <div>
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Cari nama, NIK, sekolah, atau email/HP
            </label>
            <input id="q" name="q" defaultValue={f.q} placeholder="mis. Siti / 3277… / SMKN 1" className={inputCls} />
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-xs font-medium text-slate-600">
              Status
            </label>
            <select id="status" name="status" defaultValue={f.status ?? "masuk"} className={inputCls}>
              {FILTER_STATUS.map((s) => (
                <option key={s} value={s}>
                  {LABEL_FILTER[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gelombang" className="mb-1 block text-xs font-medium text-slate-600">
              Gelombang
            </label>
            <select id="gelombang" name="gelombang" defaultValue={f.gelombang ?? ""} className={inputCls}>
              <option value="">Semua</option>
              {gelombang.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dari" className="mb-1 block text-xs font-medium text-slate-600">
              Dari tanggal
            </label>
            <input id="dari" name="dari" type="date" defaultValue={f.dari} className={inputCls} />
          </div>
          <div>
            <label htmlFor="sampai" className="mb-1 block text-xs font-medium text-slate-600">
              Sampai tanggal
            </label>
            <input id="sampai" name="sampai" type="date" defaultValue={f.sampai} className={inputCls} />
          </div>
          <div className="flex items-end gap-2">
            <button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Terapkan</button>
            <Link href="/admin/pendaftar" className="rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Pendaftar</th>
              <th className="px-4 py-3 font-semibold">NIK</th>
              <th className="px-4 py-3 font-semibold">Asal sekolah</th>
              <th className="px-4 py-3 font-semibold">Jurusan 1 / 2</th>
              <th className="px-4 py-3 font-semibold">Dikirim</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Tidak ada pendaftar yang cocok dengan filter.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/pendaftar/${r.id}`} className="font-semibold text-blue-700 hover:underline">
                    {r.nama ?? r.akunNama}
                  </Link>
                  <span className="block text-xs text-slate-500">{r.kabupaten ?? r.akunLogin}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{r.nik ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">
                  {r.sekolah ?? "-"}
                  {r.tahunLulus && <span className="block text-xs text-slate-500">Lulus {r.tahunLulus}</span>}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {r.jurusan1 ?? "-"}
                  <span className="block text-xs text-slate-500">{r.jurusan2 ?? ""}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{tanggal(r.submittedAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status as Status} tahap={r.tahap} />
                  {r.hasil === "diterima" && r.jurusanDiterima && <span className="mt-1 block text-xs text-emerald-800">{r.jurusanDiterima}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {halaman > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Halaman">
          <span className="text-slate-600">
            Halaman {page} dari {halaman} · {total} pendaftar
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link href={`?${qs({ page: page - 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                ← Sebelumnya
              </Link>
            )}
            {page < halaman && (
              <Link href={`?${qs({ page: page + 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                Berikutnya →
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}
