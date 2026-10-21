"use client";

import { importSekolah } from "@/app/actions/sekolah";
import { ActionForm, FieldShell, inputCls, SubmitButton, useFormErrors } from "@/components/form";

function IsianBerkas() {
  const error = useFormErrors()?.errors?.berkas;
  return (
    <FieldShell
      name="berkas"
      label="Berkas Excel/CSV"
      required
      error={error}
      hint="Kolom wajib: NPSN dan Nama Sekolah; Kabupaten/Kota opsional. Baris judul dikenali otomatis. Maksimal 900 KB."
    >
      <input
        id="berkas"
        name="berkas"
        type="file"
        accept=".xlsx,.csv"
        aria-invalid={!!error}
        className={inputCls}
      />
    </FieldShell>
  );
}

/** Isi master sekolah sekaligus dari daftar sekolah (mis. unduhan Dapodik/referensi Kemdikbud). */
export function FormImportSekolah() {
  return (
    <ActionForm action={importSekolah} resetOnSuccess className="space-y-4">
      <IsianBerkas />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="perbarui" className="size-4 accent-blue-700" />
          Perbarui nama/kota sekolah yang NPSN-nya sudah ada
        </label>
        <a href="/api/admin/template-sekolah" className="text-sm font-medium text-blue-700 hover:underline">
          Unduh templat Excel
        </a>
        <SubmitButton className="ml-auto">Import Sekolah</SubmitButton>
      </div>
    </ActionForm>
  );
}
