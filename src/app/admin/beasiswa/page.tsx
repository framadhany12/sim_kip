import { asc, count, eq } from "drizzle-orm";
import { TabelCari } from "@/components/tabel-cari";
import { getDb } from "@/db";
import { jenisBeasiswa, pendaftaran } from "@/db/schema";
import { hapusJenisBeasiswa, simpanJenisBeasiswa, toggleJenisBeasiswa } from "@/app/actions/admin";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Jenis Beasiswa" };

type B = typeof jenisBeasiswa.$inferSelect;

function FormBeasiswa({ b }: { b?: B }) {
  return (
    <ActionForm action={simpanJenisBeasiswa} className="grid items-start gap-3 sm:grid-cols-[1fr_7rem]" resetOnSuccess={!b}>
      {b && <input type="hidden" name="id" value={b.id} />}
      <Field name="nama" label="Nama jenis beasiswa" required defaultValue={b?.nama} contoh="LLDIKTI" />
      <Field name="urutan" label="Urutan" type="number" defaultValue={b?.urutan ?? 99} />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700 sm:col-span-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="aktif" defaultChecked={b ? b.aktif : true} className="size-4 accent-blue-700" /> Aktif (bisa dipilih saat pengumuman)
        </label>
        <SubmitButton className="ml-auto">{b ? "Simpan Perubahan" : "Tambah Jenis Beasiswa"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function BeasiswaAdminPage() {
  const db = await getDb();
  const list = await db
    .select({ b: jenisBeasiswa, n: count(pendaftaran.id) })
    .from(jenisBeasiswa)
    .leftJoin(pendaftaran, eq(pendaftaran.jenisBeasiswaId, jenisBeasiswa.id))
    .groupBy(jenisBeasiswa.id)
    .orderBy(asc(jenisBeasiswa.urutan), asc(jenisBeasiswa.nama));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jenis Beasiswa"
        desc="Daftar jenis beasiswa yang ditetapkan admin untuk mahasiswa saat mengumumkan hasil Diterima. Informasi ini hanya terlihat oleh admin, tidak ditampilkan ke pendaftar."
      />
      <TabelCari label="Cari jenis beasiswa">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Jenis beasiswa</th>
                <th className="px-4 py-3 font-semibold">Aktif</th>
                <th className="px-4 py-3 text-right font-semibold">Mahasiswa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Belum ada jenis beasiswa. Tambahkan lewat formulir di bawah.
                  </td>
                </tr>
              )}
              {list.map(({ b, n }) => (
                <tr key={b.id} className={`align-top ${b.aktif ? "" : "text-slate-500"}`}>
                  <td className="px-4 py-3">
                    <span className="mr-2 text-xs tabular-nums text-slate-400">#{b.urutan}</span>
                    <span className="font-medium">{b.nama}</span>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs font-medium text-blue-700">Ubah</summary>
                      <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-900">
                        <FormBeasiswa b={b} />
                        <form action={hapusJenisBeasiswa}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="text-sm font-medium text-rose-700 hover:underline">
                            {n > 0 ? "Nonaktifkan (sudah ditetapkan ke mahasiswa, tidak bisa dihapus)" : "Hapus jenis beasiswa ini"}
                          </button>
                        </form>
                      </div>
                    </details>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleJenisBeasiswa}>
                      <input type="hidden" name="id" value={b.id} />
                      <button
                        role="switch"
                        aria-checked={b.aktif}
                        aria-label={`Aktif ${b.nama}`}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          b.aktif ? "bg-emerald-50 text-emerald-800 ring-emerald-300" : "bg-slate-50 text-slate-500 ring-slate-300"
                        }`}
                      >
                        <span className={`size-2 rounded-full ${b.aktif ? "bg-emerald-600" : "bg-slate-400"}`} />
                        {b.aktif ? "Ya" : "Tidak"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabelCari>
      <Card title="Tambah jenis beasiswa baru">
        <FormBeasiswa />
      </Card>
    </div>
  );
}
