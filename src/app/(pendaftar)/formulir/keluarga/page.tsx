import { simpanKeluarga } from "@/app/actions/formulir";
import { ActionForm, Field } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { Card } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Data Keluarga" };

export default async function KeluargaPage() {
  const { d, sudahDikirim } = await konteksPendaftar();
  const x = d.keluarga;
  return (
    <Card title="2. Data Keluarga">
      <ActionForm action={simpanKeluarga}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="namaAyah" label="Nama ayah" required defaultValue={x?.namaAyah} hint="Sesuai Kartu Keluarga. Tetap diisi walau ayah sudah meninggal." contoh="Ahmad Sutisna" />
          <Field name="namaIbu" label="Nama ibu" required defaultValue={x?.namaIbu} hint="Sesuai Kartu Keluarga. Tetap diisi walau ibu sudah meninggal." contoh="Rina Marlina" />
          <Field
            name="teleponOrangTua"
            label="Nomor HP/WhatsApp orang tua/wali"
            required
            inputMode="tel"
            defaultValue={x?.teleponOrangTua}
            hint="Nomor aktif ayah, ibu, atau wali yang bisa dihubungi kampus."
            contoh="081298765432"
          />
          <Field name="namaWali" label="Nama wali" defaultValue={x?.namaWali} hint="Isi hanya bila Anda tinggal bersama wali (bukan orang tua kandung)." contoh="Dedi Kurniawan (paman)" />
          <Field
            name="jumlahAnggotaKeluarga"
            label="Jumlah anggota keluarga serumah"
            type="number"
            inputMode="numeric"
            required
            defaultValue={x?.jumlahAnggotaKeluarga}
            hint="Semua orang yang tinggal serumah, termasuk Anda."
            contoh="5"
          />
        </div>
        <FormFooter back="/formulir/data-diri" sudahDikirim={sudahDikirim} />
      </ActionForm>
    </Card>
  );
}
