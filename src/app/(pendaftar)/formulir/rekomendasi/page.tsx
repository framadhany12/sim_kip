import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sumberRekomendasi } from "@/db/schema";
import { simpanRekomendasi } from "@/app/actions/formulir";
import { ActionForm } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { RekomendasiFields } from "@/components/rekomendasi-fields";
import { Alert, Card } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Rekomendasi" };

export default async function RekomendasiPage() {
  const { d, sudahDikirim, terkunci } = await konteksPendaftar();
  const db = await getDb();
  const aktif = await db
    .select({ id: sumberRekomendasi.id, nama: sumberRekomendasi.nama, butuhKontak: sumberRekomendasi.butuhKontak })
    .from(sumberRekomendasi)
    .where(eq(sumberRekomendasi.aktif, true))
    .orderBy(asc(sumberRekomendasi.urutan), asc(sumberRekomendasi.nama));
  const r = d.rekomendasi;
  // Pilihan lama yang kini dinonaktifkan admin tetap ditampilkan agar data tersimpan tidak "hilang".
  const sumber = r && !aktif.some((s) => s.id === r.sumberId) ? [...aktif, { id: r.sumberId, nama: `${r.sumber} (tidak tersedia lagi)`, butuhKontak: r.butuhKontak }] : aktif;

  return (
    <Card title="5. Rekomendasi">
      {sumber.length === 0 ? (
        <Alert tone="warning">Pilihan rekomendasi belum disiapkan admin. Silakan hubungi admin lewat menu Bantuan.</Alert>
      ) : (
        <ActionForm action={simpanRekomendasi} disabled={terkunci}>
          <RekomendasiFields sumber={sumber} defaultSumber={r?.sumberId} defaultNama={r?.namaPerekomendasi} defaultTelepon={r?.teleponPerekomendasi} />
          <FormFooter back="/formulir/sekolah" sudahDikirim={sudahDikirim} terkunci={terkunci} />
        </ActionForm>
      )}
    </Card>
  );
}
