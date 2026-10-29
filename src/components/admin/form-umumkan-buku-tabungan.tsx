"use client";

import { buatPengumumanBukuTabungan } from "@/app/actions/buku-tabungan";
import { ActionForm, Field, SubmitButton, TextArea } from "@/components/form";

export function FormUmumkanBukuTabungan({ belum }: { belum: number }) {
  return (
    <ActionForm action={buatPengumumanBukuTabungan} resetOnSuccess className="space-y-4">
      <Field name="judul" label="Judul" required maxLength={150} defaultValue="Wajib mengisi No. Rekening dan Buku Tabungan KIP-K" />
      <TextArea
        name="isi"
        label="Isi pengumuman"
        required
        rows={4}
        defaultValue="Mahasiswa penerima KIP Kuliah wajib mengisi nomor rekening KIP-K dan mengunggah foto halaman depan buku tabungan melalui menu Buku Tabungan."
        hint="Maksimal 2000 karakter. Tampil sebagai banner di akun, tanpa email."
      />
      <Field name="tenggat" label="Batas waktu" type="date" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Akan tampil di akun <b>{belum}</b> mahasiswa aktif yang belum mengisi. Yang sudah mengisi tidak menerima pengumuman ini.
        </p>
        <SubmitButton>Umumkan ke yang Belum Mengisi</SubmitButton>
      </div>
    </ActionForm>
  );
}
