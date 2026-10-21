"use client";

import { useActionState } from "react";
import { imporMahasiswa, type HasilImpor } from "@/app/actions/impor-mahasiswa";
import { Alert } from "@/components/ui";
import { inputCls } from "@/lib/styles";

export function FormImporMahasiswa() {
  const [hasil, aksi, memuat] = useActionState<HasilImpor, FormData>(imporMahasiswa, null);
  return (
    <div className="space-y-5">
      <form action={aksi} className="space-y-4">
        <div>
          <label htmlFor="berkas" className="mb-1.5 block text-sm font-medium text-slate-800">
            Berkas Excel/CSV <span className="text-rose-600">*</span>
          </label>
          <input id="berkas" name="berkas" type="file" accept=".xlsx,.csv" required className={inputCls} />
          <p className="mt-1.5 text-[13px] text-slate-500">Maksimal 900 KB atau 1.000 baris per impor.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href="/api/admin/template-mahasiswa" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:underline">
            Unduh templat Excel
          </a>
          <button
            disabled={memuat}
            className="inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70"
          >
            {memuat ? "Membuat akun…" : "Impor & Buat Akun"}
          </button>
        </div>
      </form>

      {hasil && "galat" in hasil && <Alert tone="error">{hasil.galat}</Alert>}
      {hasil && "dibuat" in hasil && (
        <div className="space-y-4">
          <Alert tone={hasil.dibuat > 0 ? "success" : "warning"} title={`${hasil.dibuat} akun dibuat${hasil.gagal.length ? `, ${hasil.gagal.length} baris dilewati` : ""}.`}>
            {hasil.dibuat > 0 &&
              "Mahasiswa masuk dengan NIK atau email, sandi awal = NIK. Saat login pertama mereka wajib mengganti sandi, lalu melengkapi data diri, keluarga, ekonomi, sekolah, jurusan, NIM, dan kelas."}
          </Alert>
          {hasil.gagal.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <caption className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm font-semibold text-slate-800">Baris yang dilewati</caption>
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Baris</th>
                    <th className="px-4 py-2.5 font-semibold">Nama</th>
                    <th className="px-4 py-2.5 font-semibold">Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hasil.gagal.map((g) => (
                    <tr key={g.baris} className="align-top">
                      <td className="px-4 py-2.5 tabular-nums text-slate-700">{g.baris}</td>
                      <td className="px-4 py-2.5 text-slate-900">{g.nama}</td>
                      <td className="px-4 py-2.5 text-rose-800">{g.alasan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
