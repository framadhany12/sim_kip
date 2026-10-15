import Link from "next/link";
import { TombolUnduh } from "@/components/admin/tombol-unduh";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import type { Status } from "@/db/schema";
import { cariPendaftar, daftarTahun, PER_HALAMAN, type FilterPendaftar } from "@/lib/admin-query";
import { ALASAN_TIDAK_DITERIMA, ALASAN_TIDAK_LOLOS_ADMINISTRASI } from "@/lib/constants";
import { inputCls } from "@/lib/styles";
import { SEMUA_TAHUN } from "@/lib/tahun";

const SEMUA_ALASAN = [...ALASAN_TIDAK_LOLOS_ADMINISTRASI, ...ALASAN_TIDAK_DITERIMA];

/** Daftar khusus pendaftar yang sudah diputuskan: Diterima, atau Ditolak (semua alasan, termasuk tidak lolos administrasi). */
export async function DaftarHasil({ jenis, f }: { jenis: "diterima" | "ditolak"; f: FilterPendaftar }) {
  const diterima = jenis === "diterima";
  const tahun = f.tahun ?? SEMUA_TAHUN; // master data: bawaannya semua tahun
  const filter: FilterPendaftar = { ...f, status: jenis, tahun, alasan: diterima ? undefined : f.alasan };
  const [{ rows, total, page = 1 }, pilihanTahun] = await Promise.all([cariPendaftar(filter), daftarTahun()]);
  const qs = (extra: Record<string, string | number>) =>
    new URLSearchParams(Object.entries({ ...filter, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();
  const halaman = Math.max(1, Math.ceil(total / PER_HALAMAN));

  return (
    <div className="space-y-5">
      <PageHeader
        title={diterima ? "Mahasiswa Diterima" : "Mahasiswa Ditolak"}
        desc={
          diterima
            ? "Pendaftar yang dinyatakan diterima di Pengumuman, lengkap dengan jurusan yang diterima."
            : "Pendaftar yang tidak lolos Seleksi Administrasi maupun tidak diterima di Pengumuman, beserta alasannya."
        }
        action={
          <TombolUnduh qs={qs({ page: "" })} total={total} />
        }
      />
      <Card>
        <form className={`grid gap-3 sm:grid-cols-2 ${diterima ? "lg:grid-cols-[2fr_1fr_auto]" : "lg:grid-cols-[2fr_1fr_1fr_auto]"}`}>
          <div>
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Cari nama, NIK, NISN, No. Pendaftaran KIP, sekolah, atau email
            </label>
            <input id="q" name="q" defaultValue={f.q} className={inputCls} />
          </div>
          <div>
            <label htmlFor="tahun" className="mb-1 block text-xs font-medium text-slate-600">
              Tahun daftar
            </label>
            <select id="tahun" name="tahun" defaultValue={tahun} className={inputCls}>
              <option value={SEMUA_TAHUN}>Semua tahun</option>
              {pilihanTahun.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {!diterima && (
            <div>
              <label htmlFor="alasan" className="mb-1 block text-xs font-medium text-slate-600">
                Alasan
              </label>
              <select id="alasan" name="alasan" defaultValue={f.alasan ?? ""} className={inputCls}>
                <option value="">Semua alasan</option>
                {SEMUA_ALASAN.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Terapkan</button>
            <Link href={`/admin/${jenis}`} className="rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Pendaftar</th>
              <th className="px-4 py-3 font-semibold">No. Pendaftaran KIP</th>
              <th className="px-4 py-3 font-semibold">NIK / NISN</th>
              <th className="px-4 py-3 font-semibold">Asal sekolah</th>
              <th className="px-4 py-3 font-semibold">{diterima ? "Jurusan diterima" : "Jurusan 1 / 2"}</th>
              <th className="px-4 py-3 font-semibold">{diterima ? "Status" : "Status / Alasan"}</th>
              <th className="px-4 py-3 font-semibold">Mendaftar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Belum ada data yang cocok dengan filter.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/pendaftar/${r.id}`} className="font-semibold text-blue-700 hover:underline">
                    {r.nama ?? r.akunNama}
                  </Link>
                  <span className="block break-all text-xs text-slate-500">{r.akunLogin}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{r.nomorKip ?? "-"}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">
                  {r.nik ?? "-"}
                  <span className="block text-slate-500">{r.nisn ?? "-"}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.sekolah ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">
                  {diterima ? (
                    <span className="font-semibold text-emerald-800">{r.jurusanDiterima ?? "-"}</span>
                  ) : (
                    <>
                      {r.jurusan1 ?? "-"}
                      <span className="block text-xs text-slate-500">{r.jurusan2 ?? ""}</span>
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status as Status} tahap={r.tahap} />
                  {!diterima && <span className="mt-1 block text-xs text-slate-600">{r.alasanDitolak ?? "Alasan belum dicatat"}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {r.daftarPada.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {halaman > 1 ? (
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
      ) : (
        total > 0 && <p className="text-sm text-slate-500">{total} pendaftar</p>
      )}
    </div>
  );
}
