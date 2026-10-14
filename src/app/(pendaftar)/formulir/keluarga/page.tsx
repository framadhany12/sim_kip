import { simpanKeluarga } from "@/app/actions/formulir";
import { ActionForm } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { FieldsKeluarga } from "@/components/pendaftaran-fields";
import { Card } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Data Keluarga" };

export default async function KeluargaPage() {
  const { d, sudahDikirim } = await konteksPendaftar();
  return (
    <Card title="2. Data Keluarga">
      <ActionForm action={simpanKeluarga}>
        <FieldsKeluarga x={d.keluarga} />
        <FormFooter back="/formulir/data-diri" sudahDikirim={sudahDikirim} />
      </ActionForm>
    </Card>
  );
}
