import { simpanEkonomi } from "@/app/actions/formulir";
import { ActionForm } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { FieldsEkonomi } from "@/components/pendaftaran-fields";
import { Card } from "@/components/ui";
import { UploadBerkas } from "@/components/upload-berkas";
import { BERKAS_INFO } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";
import { ringkasBerkas } from "@/lib/berkas-view";

export const metadata = { title: "Ekonomi Orang Tua" };

export default async function EkonomiPage() {
  const { d, sudahDikirim, terkunci } = await konteksPendaftar();
  const info = BERKAS_INFO.surat_ekonomi;
  return (
    <div className="space-y-6">
      <Card title="3. Ekonomi Orang Tua/Wali">
        <ActionForm action={simpanEkonomi} disabled={terkunci}>
          <FieldsEkonomi x={d.ekonomi} />
          <FormFooter back="/formulir/keluarga" sudahDikirim={sudahDikirim} terkunci={terkunci} />
        </ActionForm>
      </Card>
      <UploadBerkas jenis="surat_ekonomi" label={info.label} tips={info.tips} wajib={false} berkas={ringkasBerkas(d.berkas.surat_ekonomi)} editable={!terkunci} />
    </div>
  );
}
