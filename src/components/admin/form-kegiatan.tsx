"use client";

import { tambahKegiatan } from "@/app/actions/kegiatan";
import { ActionForm, Field, SubmitButton, TextArea } from "@/components/form";

export function FormKegiatan() {
  return (
    <ActionForm action={tambahKegiatan} resetOnSuccess className="space-y-4">
      <Field name="nama" label="Nama kegiatan" required maxLength={150} contoh="Seminar Pengembangan Karakter Mahasiswa" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="lokasi" label="Lokasi" maxLength={150} contoh="Aula Gedung A" />
        <Field name="mulai" label="Mulai (WIB)" type="datetime-local" required />
        <Field name="selesai" label="Selesai (WIB)" type="datetime-local" required />
      </div>
      <TextArea name="deskripsi" label="Deskripsi" rows={3} hint="Opsional. Tampil di daftar kegiatan mahasiswa." />
      <div className="flex justify-end">
        <SubmitButton>Tambah Kegiatan</SubmitButton>
      </div>
    </ActionForm>
  );
}
