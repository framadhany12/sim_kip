"use client";

import { useState } from "react";
import { Power } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/form";
import { Alert } from "@/components/ui";
import type { FormAction } from "@/lib/form-state";

/** Tombol aktif/nonaktifkan akun; menonaktifkan meminta konfirmasi dulu. */
export function FormAktif({ nama, aktif, action, dilarang }: { nama: string; aktif: boolean; action: FormAction; dilarang?: string }) {
  const [konfirmasi, setKonfirmasi] = useState(false);
  return (
    <ActionForm action={action} className="space-y-4">
      <p className="text-sm text-slate-700">
        Status akun: {aktif ? <b className="text-emerald-700">Aktif</b> : <b className="text-rose-700">Nonaktif</b>}.{" "}
        {aktif
          ? "Akun nonaktif tidak bisa masuk dan langsung dikeluarkan dari semua perangkat. Datanya tetap tersimpan dan bisa diaktifkan kembali kapan saja."
          : "Akun ini tidak bisa masuk. Aktifkan kembali agar pemilik akun dapat masuk lagi."}
      </p>
      <input type="hidden" name="aktif" value={aktif ? "0" : "1"} />
      {dilarang ? (
        <Alert tone="info">{dilarang}</Alert>
      ) : !aktif ? (
        <SubmitButton variant="success">Aktifkan akun</SubmitButton>
      ) : !konfirmasi ? (
        <button type="button" onClick={() => setKonfirmasi(true)} className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-800">
          <Power className="size-4" aria-hidden /> Nonaktifkan akun
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4" role="alertdialog" aria-label="Konfirmasi nonaktifkan akun">
          <p className="text-sm text-rose-950">
            Nonaktifkan akun <b>{nama}</b>? Yang bersangkutan akan keluar dari semua perangkat dan tidak bisa masuk sampai diaktifkan kembali.
          </p>
          <div className="flex flex-wrap gap-2">
            <SubmitButton variant="danger">Ya, nonaktifkan</SubmitButton>
            <button type="button" onClick={() => setKonfirmasi(false)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
              Batal
            </button>
          </div>
        </div>
      )}
    </ActionForm>
  );
}
