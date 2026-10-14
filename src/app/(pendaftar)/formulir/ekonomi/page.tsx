import { simpanEkonomi } from "@/app/actions/formulir";
import { ActionForm, Field, Select, TextArea } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { Card } from "@/components/ui";
import { UploadBerkas } from "@/components/upload-berkas";
import { BERKAS_INFO } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";
import { ringkasBerkas } from "@/lib/berkas-view";

export const metadata = { title: "Ekonomi Orang Tua" };

const PEKERJAAN = [
  "Tidak bekerja",
  "Petani/Pekebun",
  "Nelayan",
  "Buruh harian lepas",
  "Buruh pabrik",
  "Pedagang kecil",
  "Wiraswasta",
  "Karyawan swasta",
  "PNS/TNI/Polri",
  "Pensiunan",
  "Sopir/Ojek",
  "Asisten rumah tangga",
  "Lainnya",
].map((p) => ({ value: p, label: p }));

export default async function EkonomiPage() {
  const { d, sudahDikirim } = await konteksPendaftar();
  const x = d.ekonomi;
  const info = BERKAS_INFO.surat_ekonomi;
  return (
    <div className="space-y-6">
      <Card title="3. Ekonomi Orang Tua/Wali">
        <ActionForm action={simpanEkonomi}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              name="penghasilanBulanan"
              label="Total penghasilan per bulan (Rp)"
              required
              inputMode="numeric"
              defaultValue={x?.penghasilanBulanan}
              hint="Gabungan penghasilan ayah, ibu/wali dalam sebulan. Tulis angka saja; isi 0 bila tidak ada."
              contoh="1500000"
            />
            <Select name="pekerjaan" label="Pekerjaan utama orang tua/wali" required defaultValue={x?.pekerjaan} options={PEKERJAAN} hint="Pekerjaan pencari nafkah utama keluarga." />
            <Field
              name="tanggungan"
              label="Jumlah tanggungan"
              type="number"
              inputMode="numeric"
              required
              defaultValue={x?.tanggungan}
              hint="Jumlah orang yang biayanya ditanggung orang tua/wali, termasuk Anda."
              contoh="4"
            />
          </div>
          <TextArea
            name="keteranganTambahan"
            label="Keterangan tambahan"
            defaultValue={x?.keteranganTambahan}
            hint="Kondisi khusus yang perlu diketahui: penerima PKH/KIP/KKS, orang tua sakit, yatim/piatu, dsb."
            contoh="Keluarga penerima PKH; ayah sudah meninggal sejak 2020."
          />
          <FormFooter back="/formulir/keluarga" sudahDikirim={sudahDikirim} />
        </ActionForm>
      </Card>
      <UploadBerkas jenis="surat_ekonomi" label={info.label} tips={info.tips} wajib={false} berkas={ringkasBerkas(d.berkas.surat_ekonomi)} editable />
    </div>
  );
}
