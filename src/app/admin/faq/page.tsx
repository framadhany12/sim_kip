import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { faq } from "@/db/schema";
import { hapusFaq, simpanFaq } from "@/app/actions/admin";
import { ActionForm, Field, SubmitButton, TextArea } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Kelola FAQ" };

function FormFaq({ f }: { f?: typeof faq.$inferSelect }) {
  return (
    <ActionForm action={simpanFaq} className="space-y-3" resetOnSuccess={!f}>
      {f && <input type="hidden" name="id" value={f.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
        <Field name="pertanyaan" label="Pertanyaan" required defaultValue={f?.pertanyaan} />
        <Field name="urutan" label="Urutan" type="number" defaultValue={f?.urutan ?? 99} />
      </div>
      <TextArea name="jawaban" label="Jawaban" required defaultValue={f?.jawaban} rows={3} />
      <div className="flex justify-end">
        <SubmitButton>{f ? "Simpan" : "Tambah FAQ"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function FaqAdminPage() {
  const db = await getDb();
  const list = await db.select().from(faq).orderBy(asc(faq.urutan));
  return (
    <div className="space-y-6">
      <PageHeader title="Pertanyaan Umum (FAQ)" desc="Daftar ini tampil di halaman Bantuan untuk semua pengunjung." />
      <div className="space-y-3">
        {list.map((f) => (
          <details key={f.id} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="font-medium text-slate-900">
                <span className="mr-2 text-xs tabular-nums text-slate-400">#{f.urutan}</span>
                {f.pertanyaan}
              </span>
              <span className="text-sm text-blue-700">Ubah</span>
            </summary>
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <FormFaq f={f} />
              <form action={hapusFaq}>
                <input type="hidden" name="id" value={f.id} />
                <button className="text-sm font-medium text-rose-700 hover:underline">Hapus FAQ ini</button>
              </form>
            </div>
          </details>
        ))}
      </div>
      <Card title="Tambah FAQ">
        <FormFaq />
      </Card>
    </div>
  );
}
