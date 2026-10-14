import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { wilayahKabupaten } from "@/db/schema";
import { simpanDataDiri } from "@/app/actions/formulir";
import { ActionForm } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { FieldsDataDiri } from "@/components/pendaftaran-fields";
import { Alert, Card } from "@/components/ui";
import { MAX_UMUR, hitungUmur } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Data Diri" };

export default async function DataDiriPage({ searchParams }: { searchParams: Promise<{ peringatan?: string }> }) {
  const { d, sudahDikirim, terkunci } = await konteksPendaftar();
  const { peringatan } = await searchParams;
  const db = await getDb();
  const kabupaten = await db.select().from(wilayahKabupaten).orderBy(asc(wilayahKabupaten.nama));
  const x = d.diri;
  const umur = x ? hitungUmur(x.tanggalLahir) : null;

  return (
    <Card title="1. Data Diri">
      {(peringatan === "umur" || (umur !== null && umur > MAX_UMUR)) && (
        <div className="mb-5">
          <Alert tone="warning" title="Umur melebihi syarat">
            Berdasarkan tanggal lahir, umur Anda {umur} tahun. Syarat KIP Kuliah adalah maksimal {MAX_UMUR} tahun, sehingga pendaftaran tidak dapat
            dikirim. Periksa kembali tanggal lahir bila ada salah ketik.
          </Alert>
        </div>
      )}
      <ActionForm action={simpanDataDiri} disabled={terkunci}>
        <FieldsDataDiri x={x} namaBawaan={d.user.nama} kabupaten={kabupaten} />
        <FormFooter sudahDikirim={sudahDikirim} terkunci={terkunci} />
      </ActionForm>
    </Card>
  );
}
