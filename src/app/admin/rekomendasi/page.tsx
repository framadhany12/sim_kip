import { asc, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rekomendasi, sumberRekomendasi } from "@/db/schema";
import { hapusSumberRekomendasi, simpanSumberRekomendasi, toggleSumberRekomendasi } from "@/app/actions/admin";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Pilihan Rekomendasi" };

type S = typeof sumberRekomendasi.$inferSelect;

function Toggle({ s, field, label }: { s: S; field: "aktif" | "butuhKontak"; label: string }) {
  const on = s[field];
  return (
    <form action={toggleSumberRekomendasi}>
      <input type="hidden" name="id" value={s.id} />
      <input type="hidden" name="field" value={field} />
      <button
        role="switch"
        aria-checked={on}
        aria-label={`${label} ${s.nama}`}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
          on ? "bg-emerald-50 text-emerald-800 ring-emerald-300" : "bg-slate-50 text-slate-500 ring-slate-300"
        }`}
      >
        <span className={`size-2 rounded-full ${on ? "bg-emerald-600" : "bg-slate-400"}`} />
        {on ? "Ya" : "Tidak"}
      </button>
    </form>
  );
}

function FormSumber({ s }: { s?: S }) {
  return (
    <ActionForm action={simpanSumberRekomendasi} className="grid items-start gap-3 sm:grid-cols-[1fr_7rem]" resetOnSuccess={!s}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <Field name="nama" label="Nama pilihan" required defaultValue={s?.nama} contoh="Guru BK" />
      <Field name="urutan" label="Urutan" type="number" defaultValue={s?.urutan ?? 99} />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700 sm:col-span-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="butuhKontak" defaultChecked={s ? s.butuhKontak : true} className="size-4 accent-blue-700" /> Wajib isi nama &amp; HP perekomendasi
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="aktif" defaultChecked={s ? s.aktif : true} className="size-4 accent-blue-700" /> Aktif
        </label>
        <SubmitButton className="ml-auto">{s ? "Simpan Perubahan" : "Tambah Pilihan"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function RekomendasiAdminPage() {
  const db = await getDb();
  const list = await db
    .select({ s: sumberRekomendasi, n: count(rekomendasi.id) })
    .from(sumberRekomendasi)
    .leftJoin(rekomendasi, eq(rekomendasi.sumberId, sumberRekomendasi.id))
    .groupBy(sumberRekomendasi.id)
    .orderBy(asc(sumberRekomendasi.urutan), asc(sumberRekomendasi.nama));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pilihan Rekomendasi"
        desc="Daftar pilihan untuk kolom “Rekomendasi dari” di formulir pendaftar. Matikan “Wajib isi nama & HP” untuk pilihan seperti Media Sosial yang tidak punya perekomendasi perorangan."
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Pilihan</th>
              <th className="px-4 py-3 font-semibold">Wajib nama &amp; HP</th>
              <th className="px-4 py-3 font-semibold">Aktif</th>
              <th className="px-4 py-3 text-right font-semibold">Dipilih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Belum ada pilihan. Tambahkan lewat formulir di bawah.
                </td>
              </tr>
            )}
            {list.map(({ s, n }) => (
              <tr key={s.id} className={`align-top ${s.aktif ? "" : "text-slate-500"}`}>
                <td className="px-4 py-3">
                  <span className="mr-2 text-xs tabular-nums text-slate-400">#{s.urutan}</span>
                  <span className="font-medium">{s.nama}</span>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs font-medium text-blue-700">Ubah</summary>
                    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-900">
                      <FormSumber s={s} />
                      <form action={hapusSumberRekomendasi}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="text-sm font-medium text-rose-700 hover:underline">
                          {n > 0 ? "Nonaktifkan (sudah dipilih pendaftar, tidak bisa dihapus)" : "Hapus pilihan ini"}
                        </button>
                      </form>
                    </div>
                  </details>
                </td>
                <td className="px-4 py-3">
                  <Toggle s={s} field="butuhKontak" label="Wajib kontak" />
                </td>
                <td className="px-4 py-3">
                  <Toggle s={s} field="aktif" label="Aktif" />
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title="Tambah pilihan baru">
        <FormSumber />
      </Card>
    </div>
  );
}
