"use client";

import { buatPengumumanMahasiswa } from "@/app/actions/pelaporan";
import { ActionForm, Field, Select, SubmitButton, TextArea } from "@/components/form";

/** Form pengumuman ke mahasiswa; dikosongkan setelah terkirim. */
export function FormUmumkan() {
  return (
    <ActionForm action={buatPengumumanMahasiswa} resetOnSuccess className="space-y-4">
      <Field name="judul" label="Judul" required maxLength={150} defaultValue="Wajib melaporkan IPK dan transkrip" />
      <TextArea
        name="isi"
        label="Isi pengumuman"
        required
        rows={4}
        defaultValue="Seluruh mahasiswa penerima KIP Kuliah wajib melaporkan IPK beserta transkrip nilai semester berjalan melalui menu Laporan IPK."
        hint="Maksimal 2000 karakter. Tampil sebagai banner di akun semua mahasiswa."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          name="semester"
          label="Semester yang dilaporkan"
          placeholder="Tidak terkait semester (selalu tampil)"
          options={Array.from({ length: 14 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }))}
          hint="Jika dipilih, banner otomatis hilang dari mahasiswa yang sudah melapor semester itu."
        />
        <Field name="tenggat" label="Batas waktu (opsional)" type="date" />
      </div>
      <div className="flex justify-end">
        <SubmitButton>Umumkan Sekarang</SubmitButton>
      </div>
    </ActionForm>
  );
}
