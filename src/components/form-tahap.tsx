"use client";

import { useState } from "react";
import type { Tahap } from "@/db/schema";
import { TAHAP_LABEL } from "@/lib/constants";
import { FieldShell, SubmitButton, TextArea, inputCls, useFormErrors } from "./form";

/** Isian admin: dropdown tahap seleksi, hasil & jurusan diterima (khusus Pengumuman), dan catatan untuk pendaftar. */
export function FormTahapFields({
  tahapSaatIni,
  hasilSaatIni,
  jurusanDiterimaId,
  pilihan,
  catatanSaatIni,
}: {
  tahapSaatIni: Tahap | null;
  hasilSaatIni: "diterima" | "ditolak" | null;
  jurusanDiterimaId: string | null;
  pilihan: { id: string; label: string }[];
  catatanSaatIni: string | null;
}) {
  const state = useFormErrors();
  const err = state?.errors;
  const [tahap, setTahap] = useState(state?.values?.tahap ?? tahapSaatIni ?? "administrasi");
  const [hasil, setHasil] = useState(state?.values?.hasil ?? hasilSaatIni ?? "");
  const [jurusan, setJurusan] = useState(state?.values?.jurusanDiterimaId ?? jurusanDiterimaId ?? pilihan[0]?.id ?? "");

  return (
    <>
      <FieldShell name="tahap" label="Tahap seleksi" required error={err?.tahap}>
        <select id="tahap" name="tahap" value={tahap} onChange={(e) => setTahap(e.target.value)} className={inputCls}>
          {(Object.keys(TAHAP_LABEL) as Tahap[]).map((t, i) => (
            <option key={t} value={t}>
              {i + 1}. {TAHAP_LABEL[t]}
            </option>
          ))}
        </select>
      </FieldShell>

      {tahap === "pengumuman" && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <FieldShell name="hasil" label="Hasil" required error={err?.hasil}>
            <div className="flex gap-2" role="radiogroup" aria-label="Hasil">
              {[
                ["diterima", "Diterima", "bg-emerald-700 text-white ring-emerald-700"],
                ["ditolak", "Tidak diterima", "bg-rose-700 text-white ring-rose-700"],
              ].map(([v, l, on]) => (
                <label
                  key={v}
                  className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-semibold ring-1 ring-inset ${
                    hasil === v ? on : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input type="radio" name="hasil" value={v} checked={hasil === v} onChange={() => setHasil(v)} className="sr-only" />
                  {l}
                </label>
              ))}
            </div>
          </FieldShell>
          {hasil === "diterima" && (
            <FieldShell name="jurusanDiterimaId" label="Diterima di jurusan" required error={err?.jurusanDiterimaId} hint="Hanya dari Jurusan 1 atau 2 pilihan pendaftar.">
              <select id="jurusanDiterimaId" name="jurusanDiterimaId" value={jurusan} onChange={(e) => setJurusan(e.target.value)} className={inputCls}>
                {pilihan.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </FieldShell>
          )}
        </div>
      )}

      <TextArea
        name="catatan"
        label="Catatan untuk pendaftar"
        rows={4}
        defaultValue={catatanSaatIni}
        required={hasil === "ditolak" && tahap === "pengumuman"}
        hint="Catatan yang berlaku saat ini ditampilkan di sini; ubah atau kosongkan sesuai tahap. Tampil di halaman Status pendaftar, mis. jadwal ujian/wawancara atau data yang perlu diperbaiki. Wajib bila tidak diterima."
      />
      <SubmitButton className="w-full">Simpan Status</SubmitButton>
    </>
  );
}
