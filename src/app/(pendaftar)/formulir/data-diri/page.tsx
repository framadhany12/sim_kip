import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { AGAMA, DESIL, wilayahKabupaten } from "@/db/schema";
import { simpanDataDiri } from "@/app/actions/formulir";
import { ActionForm, Field, Select, TextArea } from "@/components/form";
import { FormFooter } from "@/components/form-footer";
import { Alert, Card } from "@/components/ui";
import { WilayahSelect } from "@/components/wilayah-select";
import { DESIL_LABEL, MAX_UMUR, STATUS_NIKAH_LABEL, hitungUmur } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";

export const metadata = { title: "Data Diri" };

function Subjudul({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h3>;
}

export default async function DataDiriPage({ searchParams }: { searchParams: Promise<{ peringatan?: string }> }) {
  const { d, sudahDikirim } = await konteksPendaftar();
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
      <ActionForm action={simpanDataDiri}>
        <Subjudul>Data KIP Kuliah</Subjudul>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            name="nomorPendaftaranKip"
            label="Nomor Pendaftaran KIP Kuliah"
            required
            maxLength={30}
            defaultValue={x?.nomorPendaftaranKip}
            hint="Nomor dari akun SIM KIP Kuliah Anda di kip-kuliah.kemdiktisaintek.go.id."
            className="sm:col-span-3"
          />
          <Select
            name="desil"
            label="Desil"
            required
            defaultValue={x?.desil}
            options={DESIL.map((v) => ({ value: v, label: DESIL_LABEL[v] }))}
            hint="Tingkat kesejahteraan keluarga di DTSEN. Cek di akun SIM KIP Kuliah atau dtsen-form.bps.go.id."
          />
          <Select
            name="penerimaPip"
            label="Penerima PIP"
            required
            defaultValue={x?.penerimaPip == null ? "" : x.penerimaPip ? "ya" : "tidak"}
            options={[
              { value: "ya", label: "Ya" },
              { value: "tidak", label: "Tidak" },
            ]}
            hint="Program Indonesia Pintar saat SD/SMP/SMA."
          />
        </div>

        <Subjudul>Identitas</Subjudul>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="namaLengkap" label="Nama lengkap" required defaultValue={x?.namaLengkap ?? d.user.nama} hint="Tulis persis seperti di Akta Kelahiran/KTP, tanpa gelar." contoh="Siti Nurhaliza" />
          <Field name="nik" label="NIK" required inputMode="numeric" maxLength={16} defaultValue={x?.nik} hint="16 digit, ada di KTP atau Kartu Keluarga." contoh="3277011201060001" />
          <Field name="nisn" label="NISN" required inputMode="numeric" maxLength={10} defaultValue={x?.nisn} hint="10 digit, ada di rapor/ijazah atau nisn.data.kemdikbud.go.id." contoh="0061234567" />
          <Field name="tempatLahir" label="Tempat lahir" required defaultValue={x?.tempatLahir} contoh="Cimahi" />
          <Field name="tanggalLahir" label="Tanggal lahir" type="date" required defaultValue={x?.tanggalLahir} hint={`Dipakai untuk memeriksa syarat umur maksimal ${MAX_UMUR} tahun.`} />
          <Select
            name="jenisKelamin"
            label="Jenis kelamin"
            required
            defaultValue={x?.jenisKelamin}
            options={[
              { value: "L", label: "Laki-laki" },
              { value: "P", label: "Perempuan" },
            ]}
          />
          <Select name="agama" label="Agama" required defaultValue={x?.agama} options={AGAMA.map((a) => ({ value: a, label: a }))} />
          <Select
            name="statusPernikahan"
            label="Status pernikahan"
            required
            defaultValue={x?.statusPernikahan}
            options={Object.entries(STATUS_NIKAH_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Field name="kontak" label="Nomor HP/WhatsApp" required inputMode="tel" defaultValue={x?.kontak} hint="Nomor aktif agar admin bisa menghubungi Anda." contoh="081234567890" />
        </div>

        <Subjudul>Alamat (sesuai Kartu Keluarga)</Subjudul>
        <TextArea name="alamatLengkap" label="Alamat lengkap" required rows={2} defaultValue={x?.alamatLengkap} hint="Nama jalan/kampung/perumahan, nomor rumah, dan patokan." contoh="Jl. Pesantren No. 12, dekat Masjid Al-Ikhlas" />
        <div className="grid gap-5 sm:grid-cols-3">
          <Field name="rt" label="RT" required inputMode="numeric" maxLength={3} defaultValue={x?.rt} contoh="005" />
          <Field name="rw" label="RW" required inputMode="numeric" maxLength={3} defaultValue={x?.rw} contoh="003" />
          <Field name="desaKelurahan" label="Desa/Kelurahan" required defaultValue={x?.desaKelurahan} contoh="Cibabat" />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <WilayahSelect kabupaten={kabupaten} defaultKab={x?.kabupatenId} defaultKec={x?.kecamatanId} />
        </div>
        <FormFooter sudahDikirim={sudahDikirim} />
      </ActionForm>
    </Card>
  );
}
