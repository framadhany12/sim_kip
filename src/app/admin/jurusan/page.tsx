import { asc } from "drizzle-orm";
import { TabelCari } from "@/components/tabel-cari";
import { getDb } from "@/db";
import { jurusan } from "@/db/schema";
import { simpanJurusan, toggleJurusan } from "@/app/actions/admin";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Kelola Jurusan" };

type J = typeof jurusan.$inferSelect;

function Toggle({ j, field, label }: { j: J; field: "aktif" | "bukaPilihan1" | "bukaPilihan2"; label: string }) {
  const on = j[field];
  return (
    <form action={toggleJurusan}>
      <input type="hidden" name="id" value={j.id} />
      <input type="hidden" name="field" value={field} />
      <button
        role="switch"
        aria-checked={on}
        aria-label={`${label} ${j.nama}`}
        title={on ? "Klik untuk menutup" : "Klik untuk membuka"}
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

function FormJurusan({ j }: { j?: J }) {
  return (
    <ActionForm action={simpanJurusan} className="grid items-start gap-3 sm:grid-cols-[8rem_1fr]" resetOnSuccess={!j}>
      {j && <input type="hidden" name="id" value={j.id} />}
      <Field name="kode" label="Kode" required defaultValue={j?.kode} contoh="TM" />
      <Field name="nama" label="Nama jurusan/program studi" required defaultValue={j?.nama} contoh="D3 Teknik Mesin" />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700 sm:col-span-2">
        {(
          [
            ["bukaPilihan1", "Dibuka untuk pilihan 1"],
            ["bukaPilihan2", "Dibuka untuk pilihan 2"],
            ["aktif", "Aktif"],
          ] as const
        ).map(([k, l]) => (
          <label key={k} className="flex items-center gap-2">
            <input type="checkbox" name={k} defaultChecked={j ? j[k] : true} className="size-4 accent-blue-700" /> {l}
          </label>
        ))}
        <SubmitButton className="ml-auto">{j ? "Simpan Perubahan" : "Tambah Jurusan"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function JurusanPage() {
  const db = await getDb();
  const list = await db.select().from(jurusan).orderBy(asc(jurusan.nama));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Jurusan"
        desc="Hanya admin yang dapat mengubah daftar jurusan. Jurusan nonaktif tidak muncul di formulir; atur juga jurusan mana yang dibuka untuk pilihan 1 dan pilihan 2."
      />
      <TabelCari label="Cari jurusan">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Kode</th>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Pilihan 1</th>
                <th className="px-4 py-3 font-semibold">Pilihan 2</th>
                <th className="px-4 py-3 font-semibold">Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((j) => (
                <tr key={j.id} className={`align-top ${j.aktif ? "" : "text-slate-500"}`}>
                  <td className="px-4 py-3 font-mono font-semibold">{j.kode}</td>
                  <td className="px-4 py-3">
                    {j.nama}
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs font-medium text-blue-700">Ubah</summary>
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-900">
                        <FormJurusan j={j} />
                      </div>
                    </details>
                  </td>
                  <td className="px-4 py-3">
                    <Toggle j={j} field="bukaPilihan1" label="Pilihan 1" />
                  </td>
                  <td className="px-4 py-3">
                    <Toggle j={j} field="bukaPilihan2" label="Pilihan 2" />
                  </td>
                  <td className="px-4 py-3">
                    <Toggle j={j} field="aktif" label="Aktif" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabelCari>
      <Card title="Tambah jurusan baru">
        <FormJurusan />
      </Card>
    </div>
  );
}
