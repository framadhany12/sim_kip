import Link from "next/link";
import { and, asc, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { dataSekolah, sekolah } from "@/db/schema";
import { sahkanSekolah, simpanSekolahMaster } from "@/app/actions/sekolah";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { FormImportSekolah } from "@/components/admin/form-import-sekolah";
import { TombolHapusSekolah } from "@/components/admin/tombol-hapus-sekolah";
import { Card, PageHeader } from "@/components/ui";
import { syaratCariSekolah } from "@/lib/sekolah";
import { inputCls } from "@/lib/styles";

export const metadata = { title: "Master Sekolah" };

const PER_HALAMAN = 50;
type S = typeof sekolah.$inferSelect;
type Filter = { q?: string; sumber?: string; page?: string };

function FormSekolah({ s }: { s?: S }) {
  return (
    <ActionForm action={simpanSekolahMaster} className="grid items-start gap-3 sm:grid-cols-[2fr_9rem_1.2fr]" resetOnSuccess={!s}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <Field name="nama" label="Nama sekolah" required defaultValue={s?.nama} contoh="SMK Negeri 1 Cimahi" />
      <Field name="npsn" label="NPSN" required inputMode="numeric" maxLength={8} defaultValue={s?.npsn} contoh="20224021" />
      <Field name="kota" label="Kabupaten/kota" defaultValue={s?.kota} contoh="Kota Cimahi" />
      <div className="flex justify-end sm:col-span-3">
        <SubmitButton>{s ? "Simpan Perubahan" : "Tambah Sekolah"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function SekolahAdminPage({ searchParams }: { searchParams: Promise<Filter> }) {
  const f = await searchParams;
  const halaman = Math.max(1, Number(f.page) || 1);
  const syarat: SQL[] = [];
  const q = f.q?.trim();
  if (q) {
    // Sama dengan pencarian di formulir (SMAN = SMA Negeri), atau cocok dengan sebagian NPSN.
    const perKata = syaratCariSekolah(q);
    const npsn = like(sekolah.npsn, `%${q.replace(/[%_\\]/g, "\\$&")}%`);
    syarat.push(perKata ? or(perKata, npsn)! : npsn);
  }
  if (f.sumber === "admin" || f.sumber === "pendaftar") syarat.push(eq(sekolah.sumber, f.sumber));
  const where = syarat.length ? and(...syarat) : undefined;

  const db = await getDb();
  const [rows, [{ total }], [{ perluCek }]] = await Promise.all([
    db
      // Subquery, bukan JOIN + GROUP BY ke seluruh master: ~15x lebih cepat untuk 26 ribu sekolah.
      .select({ s: sekolah, dipakai: sql<number>`(select count(*) from ${dataSekolah} where ${dataSekolah.npsn} = ${sekolah.npsn})`.mapWith(Number) })
      .from(sekolah)
      .where(where)
      // Tambahan pendaftar yang belum diperiksa tampil paling atas.
      .orderBy(desc(sekolah.sumber), asc(sekolah.nama))
      .limit(PER_HALAMAN)
      .offset((halaman - 1) * PER_HALAMAN),
    db.select({ total: count() }).from(sekolah).where(where),
    db.select({ perluCek: count() }).from(sekolah).where(eq(sekolah.sumber, "pendaftar")),
  ]);
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const qs = (extra: Record<string, string | number>) =>
    new URLSearchParams(Object.entries({ ...f, ...extra }).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Master Sekolah"
        desc="Daftar SMA/SMK/MA yang dicari pendaftar di formulir Data Sekolah; NPSN terisi otomatis saat sekolah dipilih. Sekolah yang diketik manual oleh pendaftar masuk ke sini dengan tanda “Tambahan pendaftar” untuk diperiksa."
      />
      <Card>
        <form className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <div>
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
              Cari nama, NPSN, atau kota
            </label>
            <input id="q" name="q" defaultValue={f.q} className={inputCls} />
          </div>
          <div>
            <label htmlFor="sumber" className="mb-1 block text-xs font-medium text-slate-600">
              Asal data
            </label>
            <select id="sumber" name="sumber" defaultValue={f.sumber ?? ""} className={inputCls}>
              <option value="">Semua</option>
              <option value="pendaftar">Tambahan pendaftar ({perluCek})</option>
              <option value="admin">Sudah diperiksa admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 sm:w-auto">Terapkan</button>
          </div>
        </form>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Sekolah</th>
              <th className="px-4 py-3 font-semibold">NPSN</th>
              <th className="px-4 py-3 font-semibold">Asal data</th>
              <th className="px-4 py-3 text-right font-semibold">Pendaftar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  {q || f.sumber ? "Tidak ada sekolah yang cocok dengan filter." : "Belum ada sekolah. Tambahkan satu per satu atau import dari Excel lewat formulir di bawah."}
                </td>
              </tr>
            )}
            {rows.map(({ s, dipakai }) => (
              <tr key={s.id} className="align-top">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900">{s.nama}</span>
                  {s.kota && <span className="block text-xs text-slate-500">{s.kota}</span>}
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs font-medium text-blue-700">Ubah</summary>
                    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <FormSekolah s={s} />
                      {dipakai > 0 && (
                        <p className="text-xs text-slate-500">Mengubah nama atau NPSN ikut memperbarui data sekolah {dipakai} pendaftar yang memakai sekolah ini.</p>
                      )}
                      <TombolHapusSekolah id={s.id} nama={s.nama} dipakai={dipakai} />
                    </div>
                  </details>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{s.npsn}</td>
                <td className="px-4 py-3">
                  {s.sumber === "pendaftar" ? (
                    <div className="space-y-1.5">
                      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-300">
                        Tambahan pendaftar
                      </span>
                      <form action={sahkanSekolah}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="text-xs font-medium text-blue-700 hover:underline">Tandai sudah diperiksa</button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Admin</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{dipakai}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {jumlahHalaman > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Halaman {halaman} dari {jumlahHalaman} · {total} sekolah
          </span>
          <div className="flex gap-2">
            {halaman > 1 && (
              <Link href={`?${qs({ page: halaman - 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                Sebelumnya
              </Link>
            )}
            {halaman < jumlahHalaman && (
              <Link href={`?${qs({ page: halaman + 1 })}`} className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                Berikutnya
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Tambah sekolah">
          <FormSekolah />
        </Card>
        <Card title="Import dari Excel/CSV">
          <FormImportSekolah />
        </Card>
      </div>
    </div>
  );
}
