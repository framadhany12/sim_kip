import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { pertanyaan, users } from "@/db/schema";
import { jawabPertanyaan } from "@/app/actions/admin";
import { ActionForm, SubmitButton, TextArea } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";
import { tanggal } from "@/lib/constants";

export const metadata = { title: "Pertanyaan Pendaftar" };

export default async function PertanyaanPage() {
  const db = await getDb();
  const list = await db
    .select({ q: pertanyaan, nama: users.nama, login: users.email })
    .from(pertanyaan)
    .innerJoin(users, eq(users.id, pertanyaan.userId))
    .orderBy(sql`${pertanyaan.jawaban} is not null`, desc(pertanyaan.createdAt));
  return (
    <div className="space-y-6">
      <PageHeader title="Tanya Admin" desc="Pertanyaan dari pendaftar. Yang belum dijawab tampil paling atas; jawaban langsung terlihat di halaman Bantuan pendaftar." />
      {list.length === 0 && <p className="text-sm text-slate-500">Belum ada pertanyaan.</p>}
      <div className="space-y-4">
        {list.map(({ q, nama, login }) => (
          <Card
            key={q.id}
            title={
              <span>
                {nama} <span className="font-normal text-slate-500">· {login}</span>
              </span>
            }
            action={<span className="text-xs text-slate-500">{tanggal(q.createdAt)}</span>}
          >
            <p className="whitespace-pre-line text-[15px] text-slate-900">{q.isi}</p>
            {q.jawaban && (
              <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm">
                <p className="text-xs font-semibold text-blue-800">Dijawab {tanggal(q.answeredAt)}</p>
                <p className="mt-1 whitespace-pre-line text-slate-800">{q.jawaban}</p>
              </div>
            )}
            <details className="mt-3" open={!q.jawaban}>
              <summary className="cursor-pointer text-sm font-medium text-blue-700">{q.jawaban ? "Ubah jawaban" : "Jawab"}</summary>
              <div className="mt-3">
                <ActionForm action={jawabPertanyaan.bind(null, q.id)} className="space-y-3">
                  <TextArea name="jawaban" label="Jawaban" required defaultValue={q.jawaban} rows={3} />
                  <div className="flex justify-end">
                    <SubmitButton>Kirim Jawaban</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
