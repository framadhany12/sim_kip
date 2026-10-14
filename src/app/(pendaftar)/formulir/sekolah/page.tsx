import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { jurusan } from "@/db/schema";
import { simpanSekolah } from "@/app/actions/formulir";
import { ActionForm, Field, Select } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { Alert, Card } from "@/components/ui";
import { TAHUN_LULUS } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Sekolah & Pilihan Jurusan" };

export default async function SekolahPage() {
  const { d, editable } = await konteksPendaftar();
  const db = await getDb();
  const daftar = await db.select().from(jurusan).where(eq(jurusan.aktif, true)).orderBy(asc(jurusan.nama));
  const opsi1 = daftar.filter((j) => j.bukaPilihan1).map((j) => ({ value: j.id, label: j.nama }));
  const opsi2 = daftar.filter((j) => j.bukaPilihan2).map((j) => ({ value: j.id, label: j.nama }));
  const s = d.sekolah;
  return (
    <Card title="4. Data Sekolah & Pilihan Jurusan">
      <ActionForm action={simpanSekolah} disabled={!editable}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="namaSekolah" label="Nama sekolah" required defaultValue={s?.namaSekolah} hint="Nama SMA/SMK/MA atau sederajat sesuai ijazah." contoh="SMK Negeri 1 Cimahi" />
          <Field
            name="npsn"
            label="NPSN sekolah"
            required
            inputMode="numeric"
            maxLength={8}
            defaultValue={s?.npsn}
            hint="8 digit. Cari di referensi.data.kemdikbud.go.id atau tanyakan ke sekolah."
            contoh="20224021"
          />
          <Select
            name="tahunLulus"
            label="Tahun lulus"
            required
            defaultValue={s?.tahunLulus}
            options={TAHUN_LULUS.map((t) => ({ value: String(t), label: String(t) }))}
            hint="Hanya lulusan 2024, 2025, atau 2026 yang dapat mendaftar."
          />
          <Field name="jurusanSekolah" label="Jurusan di sekolah" required defaultValue={s?.jurusanSekolah} hint="Jurusan/peminatan saat SMA/SMK/MA." contoh="IPA / Teknik Kendaraan Ringan" />
        </div>

        <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Pilihan jurusan kuliah</h3>
        {opsi1.length === 0 ? (
          <Alert tone="warning">Belum ada jurusan yang dibuka. Silakan hubungi admin.</Alert>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Select name="jurusan1Id" label="Jurusan 1 (prioritas utama)" required defaultValue={d.pilihan?.jurusan1Id} options={opsi1} />
            <Select name="jurusan2Id" label="Jurusan 2 (cadangan)" required defaultValue={d.pilihan?.jurusan2Id} options={opsi2} hint="Harus berbeda dari Jurusan 1." />
          </div>
        )}
        <FormFooter back="/formulir/ekonomi" editable={editable} next="/formulir/berkas" />
      </ActionForm>
    </Card>
  );
}
