import Link from "next/link";
import { TombolUnduh } from "@/components/admin/tombol-unduh";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { inputCls } from "@/lib/styles";
import { TAHAP_LABEL } from "@/lib/constants";
import { cariPendaftar, daftarTahun, FILTER_STATUS, PER_HALAMAN, type FilterPendaftar } from "@/lib/admin-query";
import type { Status } from "@/db/schema";
import { parseTahun, SEMUA_TAHUN, tahunBerjalan } from "@/lib/tahun";

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
  const [{ rows, total, page = 1 }, pilihanTahun] = await Promise.all([cariPendaftar(f), daftarTahun()]);
  const qs = (extra: Record<string, string | number>) =>
    new URLSearchParams(Object.entries({ ...f, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();
  const halaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const exportQs = qs({ page: "" });
  const tahunTampil = f.tahun === SEMUA_TAHUN ? "semua tahun" : `tahun ${parseTahun(f.tahun) ?? tahunBerjalan()}`;
  const otomatis = !f.tahun || parseTahun(f.tahun) === undefined ? f.tahun !== SEMUA_TAHUN : false;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daftar Pendaftar"
        desc={
          <>
            Menampilkan pendaftar yang mendaftar pada <b className="text-slate-800">{tahunTampil}</b>
            {otomatis && " (tahun berjalan, berpindah otomatis setiap 1 Januari)"}. Ubah lewat filter <i>Tahun daftar</i>.
          </>
        }
        action={
          <TombolUnduh qs={exportQs} total={total} />
        }
      />
      <Card>
        <form className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]">
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Cari pendaftar
            </label>
            <input id="q" name="q" defaultValue={f.q} placeholder="Nama, NIK, NISN, No. KIP, sekolah, email" className={inputCls} />
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-xs font-medium text-slate-600">
              Status
            </label>
            <select id="status" name="status" defaultValue={f.status ?? "semua"} className={inputCls}>
              {FILTER_STATUS.map((s) => (
                <option key={s} value={s}>
                  {LABEL_FILTER[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tahun" className="mb-1 block text-xs font-medium text-slate-600">
              Tahun daftar
            </label>
            <select id="tahun" name="tahun" defaultValue={f.tahun ?? String(tahunBerjalan())} className={inputCls}>
              <option value={SEMUA_TAHUN}>Semua tahun</option>
              {pilihanTahun.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
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
          <div className="flex items-center gap-2">
            <button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Terapkan</button>
            <Link href="/admin/pendaftar" className="rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Pendaftar</th>
              <th className="px-4 py-3 font-semibold">No. Pendaftaran KIP</th>
              <th className="px-4 py-3 font-semibold">NIK</th>
              <th className="px-4 py-3 font-semibold">Asal sekolah</th>
              <th className="px-4 py-3 font-semibold">Jurusan 1 / 2</th>
              <th className="px-4 py-3 font-semibold">NISN</th>
              <th className="px-4 py-3 font-semibold">Penerima PIP</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
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
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{r.nomorKip ?? <span className="font-sans text-amber-700">Belum diisi</span>}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{r.nik ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">
                  {r.sekolah ?? "-"}
                  {r.tahunLulus && <span className="block text-xs text-slate-500">Lulus {r.tahunLulus}</span>}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {r.jurusan1 ?? "-"}
                  <span className="block text-xs text-slate-500">{r.jurusan2 ?? ""}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{r.nisn ?? <span className="font-sans text-amber-700">Belum diisi</span>}</td>
                <td className="px-4 py-3">
                  {r.penerimaPip == null ? (
                    <span className="text-slate-400">-</span>
                  ) : r.penerimaPip ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-300">Ya</span>
                  ) : (
                    <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-300">Tidak</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status as Status} tahap={r.tahap} usulan={r.usulan} />
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
