"use client";

import { useActionState, useState } from "react";
import { aktifkanAuthenticator, masukDenganKode, selesaiAktivasi } from "@/app/actions/mfa";
import { inputCls } from "@/lib/styles";
import { ActionForm, Field, SubmitButton } from "./form";
import { Alert } from "./ui";

/** Langkah 2 login admin: kode 6 digit dari aplikasi authenticator atau satu kode pemulihan. */
export function FormKodeMasuk() {
  const [pemulihan, setPemulihan] = useState(false);
  return (
    <ActionForm action={masukDenganKode}>
      {pemulihan ? (
        <Field name="kode" label="Kode pemulihan" required autoComplete="off" placeholder="xxxxx-xxxxx" hint="Satu kode hanya bisa dipakai sekali." />
      ) : (
        <Field name="kode" label="Kode 6 digit" required inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="123456" hint="Buka aplikasi authenticator, lalu salin kode SIM KIP." />
      )}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setPemulihan((v) => !v)} className="text-sm font-medium text-blue-700 hover:underline">
          {pemulihan ? "Pakai aplikasi authenticator" : "Pakai kode pemulihan"}
        </button>
        <SubmitButton>Verifikasi</SubmitButton>
      </div>
    </ActionForm>
  );
}

/** Aktivasi pertama: konfirmasi kode, lalu tampilkan kode pemulihan sekali saja. */
export function FormAktivasi() {
  const [state, aksi, pending] = useActionState(aktifkanAuthenticator, undefined);
  const [salin, setSalin] = useState(false);
  const kode = state?.values?.pemulihan?.split(" ") ?? [];

  if (state?.ok)
    return (
      <div className="space-y-4">
        <Alert tone="success">Authenticator aktif. Simpan kode pemulihan ini sekarang; tidak akan ditampilkan lagi.</Alert>
        <ul className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 font-mono text-[15px] text-slate-900 ring-1 ring-slate-200">
          {kode.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
        <p className="text-[13px] text-slate-600">Tiap kode bisa dipakai sekali bila ponsel hilang. Simpan di tempat aman, bukan di ponsel yang sama.</p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(kode.join("\n")).then(() => setSalin(true), () => {});
          }}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          {salin ? "Tersalin ✓" : "Salin semua kode"}
        </button>
        <form action={selesaiAktivasi}>
          <button className="w-full rounded-lg bg-gradient-to-b from-[#2563eb] to-[#1646a0] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110">
            Sudah saya simpan, masuk ke panel admin
          </button>
        </form>
      </div>
    );

  return (
    <form action={aksi} className="space-y-4" noValidate>
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      <div>
        <label htmlFor="kode" className="mb-1.5 block text-sm font-medium text-slate-800">
          Kode 6 digit dari aplikasi <span className="text-rose-600">*</span>
        </label>
        <input id="kode" name="kode" inputMode="numeric" maxLength={6} autoComplete="one-time-code" placeholder="123456" className={inputCls} />
        {state?.errors?.kode && <p className="mt-1.5 text-sm text-rose-700">{state.errors.kode}</p>}
      </div>
      <button
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-b from-[#2563eb] to-[#1646a0] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Memeriksa…" : "Aktifkan authenticator"}
      </button>
    </form>
  );
}
