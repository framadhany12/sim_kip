"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { ActionForm, FieldShell, SubmitButton, inputCls, useFormErrors } from "@/components/form";
import { Alert } from "@/components/ui";
import type { FormAction } from "@/lib/form-state";

function Isi({ nama }: { nama: string }) {
  const state = useFormErrors();
  const [mode, setMode] = useState<"acak" | "manual">("acak");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [disalin, setDisalin] = useState(false);
  const hasil = state?.ok ? state.values?.sandi : undefined;

  // Setelah berhasil: tutup konfirmasi dan kosongkan isian agar sandi manual tidak tertinggal di formulir.
  useEffect(() => {
    if (state?.ok) {
      setKonfirmasi(false);
      setSandi("");
      setLihat(false);
    }
  }, [state]);

  const salin = async () => {
    if (!hasil) return;
    try {
      await navigator.clipboard.writeText(hasil);
      setDisalin(true);
      setTimeout(() => setDisalin(false), 2500);
    } catch {
      // Browser menolak akses clipboard: sandi tetap tampil dan bisa disalin manual.
    }
  };

  return (
    <>
      <Alert tone="info" title="Kata sandi lama tidak dapat dilihat">
        Kata sandi pendaftar disimpan terenkripsi satu arah sehingga tidak bisa dilihat siapa pun, termasuk admin. Yang bisa dilakukan adalah <b>mengatur kata sandi baru</b>:
        pendaftar otomatis keluar dari semua perangkat dan mendapat email pemberitahuan.
      </Alert>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium text-slate-800">Kata sandi baru</legend>
        {(
          [
            ["acak", "Buat sandi acak", "Sistem membuat sandi 12 karakter yang kuat dan menampilkannya sekali."],
            ["manual", "Tentukan sendiri", "Admin mengetik sandi baru (minimal 8 karakter, memuat huruf dan angka)."],
          ] as const
        ).map(([v, judul, ket]) => (
          <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${mode === v ? "border-blue-600 bg-blue-50/50" : "border-slate-200"}`}>
            <input type="radio" name="mode" value={v} checked={mode === v} onChange={() => setMode(v)} className="mt-1 size-4 accent-blue-700" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">{judul}</span>
              <span className="block text-[13px] text-slate-600">{ket}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {mode === "manual" && (
        <FieldShell name="password" label="Kata sandi baru" required error={state?.errors?.password}>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={lihat ? "text" : "password"}
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              autoComplete="new-password"
              aria-invalid={!!state?.errors?.password}
              className={`${inputCls} pr-11`}
            />
            <button type="button" onClick={() => setLihat((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label={lihat ? "Sembunyikan sandi" : "Tampilkan sandi"}>
              {lihat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </FieldShell>
      )}

      {!konfirmasi ? (
        <div>
          <button
            type="button"
            disabled={mode === "manual" && sandi.length < 8}
            onClick={() => setKonfirmasi(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound className="size-4" aria-hidden /> Atur ulang kata sandi
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4" role="alertdialog" aria-label="Konfirmasi atur ulang kata sandi">
          <p className="text-sm text-rose-950">
            Atur ulang kata sandi <b>{nama}</b>? Pendaftar akan <b>keluar dari semua perangkat</b> dan sandi lamanya tidak berlaku lagi.
          </p>
          <div className="flex flex-wrap gap-2">
            <SubmitButton variant="danger">Ya, atur ulang</SubmitButton>
            <button type="button" onClick={() => setKonfirmasi(false)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
              Batal
            </button>
          </div>
        </div>
      )}

      {hasil && (
        <div className="space-y-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4" role="status">
          <p className="text-sm font-semibold text-emerald-900">Kata sandi baru untuk {nama}</p>
          <div className="flex flex-wrap items-center gap-3">
            <code className="select-all rounded-lg bg-white px-4 py-2.5 font-mono text-xl font-semibold tracking-wider text-slate-900 ring-1 ring-emerald-200">{hasil}</code>
            <button type="button" onClick={salin} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
              {disalin ? <Check className="size-4 text-emerald-700" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {disalin ? "Tersalin" : "Salin"}
            </button>
          </div>
          <p className="text-[13px] text-emerald-900">
            Sandi ini <b>hanya tampil sekali</b>. Setelah halaman ditutup, sandi tidak bisa dilihat lagi. Sampaikan kepada pendaftar lewat saluran yang aman, dan sarankan menggantinya di menu Akun Saya setelah masuk.
          </p>
        </div>
      )}
    </>
  );
}

export function FormSandi({ nama, action }: { nama: string; action: FormAction }) {
  return (
    <ActionForm action={action} className="space-y-4">
      <Isi nama={nama} />
    </ActionForm>
  );
}
