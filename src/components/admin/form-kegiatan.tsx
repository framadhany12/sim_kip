"use client";

import { tambahKegiatan } from "@/app/actions/kegiatan";
import { PilihAngkatan, usePilihAngkatan } from "@/components/admin/pilih-angkatan";
import { ActionForm, Field, SubmitButton, TextArea } from "@/components/form";

type Angkatan = { angkatan: number; total: number };

export function FormKegiatan({ pilihan }: { pilihan: Angkatan[] }) {
  return (
    <ActionForm action={tambahKegiatan} resetOnSuccess className="space-y-4">
      <Field name="nama" label="Nama kegiatan" required maxLength={150} contoh="Seminar Pengembangan Karakter Mahasiswa" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="lokasi" label="Lokasi" maxLength={150} contoh="Aula Gedung A" />
        <Field name="mulai" label="Mulai (WIB)" type="datetime-local" required />
        <Field name="selesai" label="Selesai (WIB)" type="datetime-local" required />
      </div>
      <TextArea name="deskripsi" label="Deskripsi" rows={3} hint="Opsional. Tampil di daftar kegiatan mahasiswa." />
      <Sasaran pilihan={pilihan} />
    </ActionForm>
  );
}

function Sasaran({ pilihan }: { pilihan: Angkatan[] }) {
  const { dipilih, setDipilih } = usePilihAngkatan(pilihan.map((p) => p.angkatan));
  const jumlah = pilihan.filter((p) => dipilih.includes(p.angkatan)).reduce((n, p) => n + p.total, 0);
  return (
    <>
      <PilihAngkatan
        legend="Angkatan yang dijadwalkan"
        pilihan={pilihan.map((p) => ({ angkatan: p.angkatan, keterangan: `${p.total} mahasiswa aktif` }))}
        dipilih={dipilih}
        setDipilih={setDipilih}
        kosong="Belum ada mahasiswa aktif yang tercatat."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Kegiatan hanya tampil dan bisa dipresensi oleh <b>{jumlah}</b> mahasiswa aktif dari angkatan terpilih.
        </p>
        <SubmitButton>Tambah Kegiatan</SubmitButton>
      </div>
    </>
  );
}
