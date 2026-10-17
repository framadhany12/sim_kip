"use client";

import { simpanAkademikMahasiswa } from "@/app/actions/akun-mahasiswa";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Dl } from "@/components/ui";

/** NIM & kelas diisi mahasiswa sendiri setelah menerima informasinya dari bagian akademik; setelah keduanya terisi menjadi terkunci. */
export function FormAkademik({ nim, kelas }: { nim: string | null; kelas: string | null }) {
  if (nim && kelas)
    return (
      <div className="space-y-2">
        <Dl items={[["NIM", nim], ["Kelas", kelas]]} />
        <p className="text-xs text-slate-500">🔒 NIM dan kelas sudah tersimpan dan tidak dapat diubah lagi. Hubungi admin lewat halaman Bantuan bila ada yang salah.</p>
      </div>
    );
  return (
    <ActionForm action={simpanAkademikMahasiswa} className="space-y-4">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="nim" label="NIM" defaultValue={nim} maxLength={30} hint="Isi setelah Anda menerima NIM dari bagian akademik." contoh="2026101001" />
        <Field name="kelas" label="Kelas" defaultValue={kelas} maxLength={30} hint="Isi setelah pembagian kelas dari bagian akademik." contoh="TI-1A" />
      </div>
      <div className="flex justify-end">
        <SubmitButton>Simpan NIM & Kelas</SubmitButton>
      </div>
    </ActionForm>
  );
}
