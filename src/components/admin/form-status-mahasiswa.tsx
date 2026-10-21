"use client";

import { useState } from "react";
import { STATUS_MAHASISWA, type StatusMahasiswa } from "@/db/schema";
import { ActionForm, FieldShell, inputCls, SubmitButton, useFormErrors } from "@/components/form";
import { Alert } from "@/components/ui";
import { STATUS_MAHASISWA_AKIBAT, STATUS_MAHASISWA_LABEL } from "@/lib/constants";
import type { FormAction } from "@/lib/form-state";

type Props = { nama: string; status: StatusMahasiswa; tanggal: string | null; keterangan: string | null; hariIni: string };

function Isian({ nama, status, tanggal, keterangan, hariIni }: Props) {
  const state = useFormErrors();
  const e = state?.errors;
  const awal = (state?.values?.statusMahasiswa as StatusMahasiswa | undefined) ?? status;
  const [pilih, setPilih] = useState<StatusMahasiswa>(awal);
  const wajibKet = pilih === "dicabut" || pilih === "tidak_aktif";
  const berubah = pilih !== status;

  return (
    <>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-800">Status</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {STATUS_MAHASISWA.map((s) => (
            <label
              key={s}
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-600 ${
                pilih === s ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="statusMahasiswa"
                value={s}
                checked={pilih === s}
                onChange={() => setPilih(s)}
                className="mt-0.5 size-4 shrink-0 accent-blue-700"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">
                  {STATUS_MAHASISWA_LABEL[s]}
                  {s === status && <span className="ml-1.5 font-normal text-slate-500">(saat ini)</span>}
                </span>
                <span className="block text-[13px] leading-snug text-slate-600">{STATUS_MAHASISWA_AKIBAT[s]}</span>
              </span>
            </label>
          ))}
        </div>
        {e?.statusMahasiswa && <p className="mt-1.5 text-sm text-rose-700">{e.statusMahasiswa}</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
        <FieldShell name="tanggal" label="Berlaku sejak" required error={e?.tanggal} hint="Tanggal lulus, tanggal SK, atau tanggal berhenti.">
          <input
            id="tanggal"
            name="tanggal"
            type="date"
            max="2100-12-31"
            defaultValue={state?.values?.tanggal ?? (berubah ? hariIni : (tanggal ?? hariIni))}
            key={berubah ? "baru" : "lama"}
            aria-invalid={!!e?.tanggal}
            className={inputCls}
          />
        </FieldShell>
        <FieldShell
          name="keterangan"
          label="Keterangan"
          required={wajibKet}
          error={e?.keterangan}
          hint={wajibKet ? "Alasan atau dasar keputusan, misalnya nomor SK pencabutan." : "Misalnya nomor ijazah atau tanggal wisuda."}
        >
          <textarea
            id="keterangan"
            name="keterangan"
            rows={2}
            maxLength={255}
            defaultValue={state?.values?.keterangan ?? (berubah ? "" : (keterangan ?? ""))}
            key={berubah ? "baru" : "lama"}
            aria-invalid={!!e?.keterangan}
            className={inputCls}
          />
        </FieldShell>
      </div>

      {berubah && pilih !== "aktif" && (
        <Alert tone="warning">
          Setelah disimpan, akun {nama} dinonaktifkan: tidak bisa masuk dan langsung keluar dari semua perangkat. Datanya tetap tersimpan.
        </Alert>
      )}
      {berubah && pilih === "aktif" && <Alert tone="info">Setelah disimpan, akun {nama} aktif kembali dan bisa masuk seperti biasa.</Alert>}

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <SubmitButton>Simpan Status</SubmitButton>
      </div>
    </>
  );
}

export function FormStatusMahasiswa({ action, ...props }: Props & { action: FormAction }) {
  return (
    <ActionForm action={action} className="space-y-5">
      <Isian {...props} />
    </ActionForm>
  );
}
