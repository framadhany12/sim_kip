import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { jurusan } from "@/db/schema";
import { simpanSekolah } from "@/app/actions/formulir";
import { ActionForm } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { FieldsSekolah } from "@/components/pendaftaran-fields";
import { Card } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Sekolah & Pilihan Jurusan" };

export default async function SekolahPage() {
  const { d, sudahDikirim } = await konteksPendaftar();
  const db = await getDb();
  const daftar = await db.select().from(jurusan).where(eq(jurusan.aktif, true)).orderBy(asc(jurusan.nama));
  const opsi1 = daftar.filter((j) => j.bukaPilihan1).map((j) => ({ value: j.id, label: j.nama }));
  const opsi2 = daftar.filter((j) => j.bukaPilihan2).map((j) => ({ value: j.id, label: j.nama }));
  return (
    <Card title="4. Data Sekolah & Pilihan Jurusan">
      <ActionForm action={simpanSekolah}>
        <FieldsSekolah
          s={d.sekolah}
          pilihan={d.pilihan}
          jurusan={sudahDikirim ? { mode: "kunci", nama1: d.pilihan?.jurusan1, nama2: d.pilihan?.jurusan2 } : { mode: "edit", opsi1, opsi2 }}
        />
        <FormFooter back="/formulir/ekonomi" sudahDikirim={sudahDikirim} />
      </ActionForm>
    </Card>
  );
}
