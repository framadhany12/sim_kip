"use client";

import { buatPengumumanBukuTabungan } from "@/app/actions/buku-tabungan";
import { PilihAngkatan, usePilihAngkatan } from "@/components/admin/pilih-angkatan";
import { ActionForm, Field, SubmitButton, TextArea } from "@/components/form";

type Angkatan = { angkatan: number; belum: number };

export function FormUmumkanBukuTabungan({ pilihan }: { pilihan: Angkatan[] }) {
  return (
    <ActionForm action={buatPengumumanBukuTabungan} resetOnSuccess className="space-y-4">
      <Field name="judul" label="Judul" required maxLength={150} defaultValue="Wajib mengisi No. Rekening dan Buku Tabungan KIP-K" />
      <TextArea
        name="isi"
        label="Isi pengumuman"
        required
        rows={4}
        defaultValue="Mahasiswa penerima KIP Kuliah wajib mengisi nomor rekening KIP-K dan mengunggah foto halaman depan buku tabungan melalui menu Buku Tabungan."
        hint="Maksimal 2000 karakter. Tampil sebagai banner di dashboard mahasiswa, tanpa email."
      />
      <Field name="tenggat" label="Batas waktu" type="date" />
      <Sasaran pilihan={pilihan} />
    </ActionForm>
  );
}

function Sasaran({ pilihan }: { pilihan: Angkatan[] }) {
  const { dipilih, setDipilih } = usePilihAngkatan(pilihan.map((p) => p.angkatan));
  const jumlah = pilihan.filter((p) => dipilih.includes(p.angkatan)).reduce((n, p) => n + p.belum, 0);

  return (
    <>
      <PilihAngkatan
        legend="Angkatan yang diminta mengisi"
        pilihan={pilihan.map((p) => ({ angkatan: p.angkatan, keterangan: `${p.belum} belum mengisi` }))}
        dipilih={dipilih}
        setDipilih={setDipilih}
        kosong="Belum ada mahasiswa angkatan wajib yang tercatat."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Akan tampil di dashboard <b>{jumlah}</b> mahasiswa aktif yang belum mengisi. Banner hilang sendiri setelah masing-masing mengirim buku tabungan.
        </p>
        <SubmitButton>Umumkan ke Angkatan Terpilih</SubmitButton>
      </div>
    </>
  );
}
