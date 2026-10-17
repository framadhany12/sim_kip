import { AGAMA, DESIL } from "@/db/schema";
import { Field, Select, TextArea } from "@/components/form";
import { Alert } from "@/components/ui";
import { WilayahSelect } from "@/components/wilayah-select";
import { DESIL_LABEL, MAX_UMUR, STATUS_NIKAH_LABEL, tahunLulusBoleh } from "@/lib/constants";
import type { PendaftaranLengkap } from "@/lib/pendaftaran";

/**
 * Kelompok isian formulir yang dipakai bersama oleh halaman pendaftar dan halaman edit admin (Master Calon Mahasiswa).
 * Harus dirender di dalam <ActionForm>. `admin` mengganti beberapa petunjuk yang berbunyi "Anda".
 */
type Konteks = { admin?: boolean };
/** Akun yang belum mengisi bagian ini belum punya barisnya di database. */
type Maybe<T> = T | null | undefined;
const kata = (admin: boolean | undefined, pendaftar: string, untukAdmin: string) => (admin ? untukAdmin : pendaftar);

function Subjudul({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h3>;
}

export function FieldsDataDiri({
  x,
  namaBawaan,
  nikAkun,
  kabupaten,
  admin,
  tanpaKip,
}: { x: Maybe<PendaftaranLengkap["diri"]>; namaBawaan?: string; nikAkun?: string | null; kabupaten: { id: string; nama: string; provinsi: string }[]; tanpaKip?: boolean } & Konteks) {
  return (
    <>
      {tanpaKip ? (
        // Akun mahasiswa tidak mengubah data KIP; nilainya dikirim ulang agar validasi bagian ini tetap lengkap.
        <>
          <input type="hidden" name="nomorPendaftaranKip" value={x?.nomorPendaftaranKip ?? ""} />
          <input type="hidden" name="desil" value={x?.desil ?? ""} />
          <input type="hidden" name="penerimaPip" value={x?.penerimaPip == null ? "" : x.penerimaPip ? "ya" : "tidak"} />
        </>
      ) : (
        <>
      <Subjudul>Data KIP Kuliah</Subjudul>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          name="nomorPendaftaranKip"
          label="Nomor Pendaftaran KIP Kuliah"
          required
          maxLength={30}
          defaultValue={x?.nomorPendaftaranKip}
          hint={kata(admin, "Nomor dari akun SIM KIP Kuliah Anda di kip-kuliah.kemdiktisaintek.go.id.", "Nomor dari akun SIM KIP Kuliah pendaftar.")}
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
        </>
      )}

      <Subjudul>Identitas</Subjudul>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="namaLengkap" label="Nama lengkap" required defaultValue={x?.namaLengkap ?? namaBawaan} hint="Tulis persis seperti di Akta Kelahiran/KTP, tanpa gelar." contoh="Siti Nurhaliza" />
        <Field name="nik" label="NIK" required inputMode="numeric" maxLength={16} defaultValue={nikAkun ?? x?.nik} readOnly={!!nikAkun} hint={nikAkun ? "Sesuai NIK saat registrasi akun, tidak dapat diubah. Hubungi admin bila salah." : "16 digit, ada di KTP atau Kartu Keluarga."} contoh="3277011201060001" />
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
        <Field
          name="kontak"
          label="Nomor HP/WhatsApp"
          required
          inputMode="tel"
          defaultValue={x?.kontak}
          hint={kata(admin, "Nomor aktif agar admin bisa menghubungi Anda.", "Nomor aktif pendaftar.")}
          contoh="081234567890"
        />
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
    </>
  );
}

export function FieldsKeluarga({ x, admin }: { x: Maybe<PendaftaranLengkap["keluarga"]> } & Konteks) {
  return (
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
      <Field
        name="namaWali"
        label="Nama wali"
        defaultValue={x?.namaWali}
        hint={kata(admin, "Isi hanya bila Anda tinggal bersama wali (bukan orang tua kandung).", "Isi hanya bila pendaftar tinggal bersama wali (bukan orang tua kandung).")}
        contoh="Dedi Kurniawan (paman)"
      />
      <Field
        name="jumlahAnggotaKeluarga"
        label="Jumlah anggota keluarga serumah"
        type="number"
        inputMode="numeric"
        required
        defaultValue={x?.jumlahAnggotaKeluarga}
        hint={kata(admin, "Semua orang yang tinggal serumah, termasuk Anda.", "Semua orang yang tinggal serumah, termasuk pendaftar.")}
        contoh="5"
      />
    </div>
  );
}

export const PEKERJAAN = [
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

export function FieldsEkonomi({ x, admin }: { x: Maybe<PendaftaranLengkap["ekonomi"]> } & Konteks) {
  return (
    <>
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
          hint={kata(admin, "Jumlah orang yang biayanya ditanggung orang tua/wali, termasuk Anda.", "Jumlah orang yang biayanya ditanggung orang tua/wali, termasuk pendaftar.")}
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
    </>
  );
}

type OpsiJurusan = { value: string; label: string }[];
export type KontrolJurusan =
  | { mode: "edit"; opsi1: OpsiJurusan; opsi2: OpsiJurusan }
  | { mode: "kunci"; nama1?: string | null; nama2?: string | null };

export function FieldsSekolah({
  s,
  pilihan,
  jurusan,
  admin,
}: { s: Maybe<PendaftaranLengkap["sekolah"]>; pilihan: Maybe<{ jurusan1Id: string; jurusan2Id: string }>; jurusan: KontrolJurusan } & Konteks) {
  return (
    <>
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
          options={tahunLulusBoleh().map((t) => ({ value: String(t), label: String(t) }))}
          hint={`Hanya lulusan ${tahunLulusBoleh().join(", ")} yang dapat mendaftar.`}
        />
        <Field name="jurusanSekolah" label="Jurusan di sekolah" required defaultValue={s?.jurusanSekolah} hint="Jurusan/peminatan saat SMA/SMK/MA." contoh="IPA / Teknik Kendaraan Ringan" />
      </div>

      <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Pilihan jurusan kuliah</h3>
      {jurusan.mode === "kunci" ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Jurusan 1 (prioritas utama)", jurusan.nama1],
              ["Jurusan 2 (cadangan)", jurusan.nama2],
            ].map(([label, nama]) => (
              <div key={label}>
                <p className="mb-1.5 text-sm font-medium text-slate-800">{label}</p>
                <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-700">
                  <span aria-hidden>🔒</span>
                  {nama ?? "-"}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-slate-500">
            Pilihan jurusan dikunci setelah pendaftaran dikirim dan hanya dapat diubah oleh admin. Bila perlu mengganti, ajukan lewat menu Bantuan → Tanya
            Admin.
          </p>
        </div>
      ) : jurusan.opsi1.length === 0 ? (
        <Alert tone="warning">{kata(admin, "Belum ada jurusan yang dibuka. Silakan hubungi admin.", "Belum ada jurusan aktif. Tambahkan lewat menu Jurusan.")}</Alert>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Select name="jurusan1Id" label="Jurusan 1 (prioritas utama)" required defaultValue={pilihan?.jurusan1Id} options={jurusan.opsi1} />
          <Select name="jurusan2Id" label="Jurusan 2 (cadangan)" required defaultValue={pilihan?.jurusan2Id} options={jurusan.opsi2} hint="Harus berbeda dari Jurusan 1." />
        </div>
      )}
    </>
  );
}
