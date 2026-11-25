"use client";

import { useEffect, useState } from "react";
import { buatPengumumanMahasiswa } from "@/app/actions/pelaporan";
import { PilihAngkatan, usePilihAngkatan } from "@/components/admin/pilih-angkatan";
import { ActionForm, Field, FieldShell, SubmitButton, TextArea, inputCls, useFormErrors } from "@/components/form";

type Ringkas = { angkatan: number; total: number; sudah: Record<number, number> };

/** Form pengumuman ke mahasiswa angkatan terpilih (bawaan: semua); dikosongkan setelah terkirim. */
export function FormUmumkan({ ringkas }: { ringkas: Ringkas[] }) {
  return (
    <ActionForm action={buatPengumumanMahasiswa} resetOnSuccess className="space-y-4">
      <Field name="judul" label="Judul" required maxLength={150} defaultValue="Wajib melaporkan IPK dan transkrip" />
      <TextArea
        name="isi"
        label="Isi pengumuman"
        required
        rows={4}
        defaultValue="Seluruh mahasiswa penerima KIP Kuliah wajib melaporkan IPK beserta transkrip nilai semester berjalan melalui menu Laporan IPK."
        hint="Maksimal 2000 karakter. Tampil sebagai banner di dashboard mahasiswa, tanpa email."
      />
      <Sasaran ringkas={ringkas} />
    </ActionForm>
  );
}

function Sasaran({ ringkas }: { ringkas: Ringkas[] }) {
  const state = useFormErrors();
  const { dipilih, setDipilih } = usePilihAngkatan(ringkas.map((r) => r.angkatan));
  const [semester, setSemester] = useState(state?.values?.semester ?? "");
  useEffect(() => {
    if (state?.ok) setSemester("");
  }, [state]);
  // Banner hilang dari yang sudah melapor semester terpilih, jadi hitungan hanya yang belum melapor.
  const penerima = (r: Ringkas) => (semester ? Math.max(0, r.total - (r.sudah[Number(semester)] ?? 0)) : r.total);
  const jumlah = ringkas.filter((r) => dipilih.includes(r.angkatan)).reduce((n, r) => n + penerima(r), 0);
  const satuan = semester ? "belum melapor" : "mahasiswa aktif";

  return (
    <>
      <PilihAngkatan
        legend="Angkatan yang menerima pengumuman"
        pilihan={ringkas.map((r) => ({ angkatan: r.angkatan, keterangan: `${penerima(r)} ${satuan}` }))}
        dipilih={dipilih}
        setDipilih={setDipilih}
        kosong="Belum ada mahasiswa aktif yang tercatat."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell
          name="semester"
          label="Semester yang dilaporkan"
          error={state?.errors?.semester}
          hint="Jika dipilih, banner otomatis hilang dari mahasiswa yang sudah melapor semester itu."
        >
          <select id="semester" name="semester" value={semester} onChange={(e) => setSemester(e.target.value)} aria-invalid={!!state?.errors?.semester} className={inputCls}>
            <option value="">Tidak terkait semester (selalu tampil)</option>
            {Array.from({ length: 14 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Semester {i + 1}
              </option>
            ))}
          </select>
        </FieldShell>
        <Field name="tenggat" label="Batas waktu (opsional)" type="date" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Akan tampil di dashboard <b>{jumlah}</b> mahasiswa aktif{semester ? ` yang belum melapor Semester ${semester}` : ""}.
          {semester ? " Banner hilang sendiri setelah masing-masing melapor." : " Pengumuman tanpa semester tampil terus sampai ditutup."}
        </p>
        <SubmitButton>Umumkan ke Angkatan Terpilih</SubmitButton>
      </div>
    </>
  );
}
