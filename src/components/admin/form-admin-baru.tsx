"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { tambahAdmin } from "@/app/actions/pengguna";
import { ActionForm, Field, SubmitButton, useFormErrors } from "@/components/form";

function Hasil() {
  const state = useFormErrors();
  const [disalin, setDisalin] = useState(false);
  const sandi = state?.ok ? state.values?.sandi : undefined;
  const wadah = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sandi) wadah.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [sandi]);
  if (!sandi) return null;
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(sandi);
      setDisalin(true);
      setTimeout(() => setDisalin(false), 2500);
    } catch {
      // Clipboard ditolak: sandi tetap tampil dan bisa disalin manual.
    }
  };
  return (
    <div ref={wadah} className="space-y-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4" role="status">
      <p className="text-sm font-semibold text-emerald-900">Kata sandi awal untuk {state?.values?.email}</p>
      <div className="flex flex-wrap items-center gap-3">
        <code className="select-all rounded-lg bg-white px-4 py-2.5 font-mono text-xl font-semibold tracking-wider text-slate-900 ring-1 ring-emerald-200">{sandi}</code>
        <button type="button" onClick={salin} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
          {disalin ? <Check className="size-4 text-emerald-700" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {disalin ? "Tersalin" : "Salin"}
        </button>
      </div>
      <p className="text-[13px] text-emerald-900">
        Sandi ini <b>hanya tampil sekali</b>. Sampaikan lewat saluran yang aman dan minta admin baru menggantinya di menu Akun Saya setelah masuk.
      </p>
    </div>
  );
}

export function FormAdminBaru() {
  return (
    <ActionForm action={tambahAdmin} className="grid items-start gap-4 sm:grid-cols-2" resetOnSuccess>
      <Field name="nama" label="Nama lengkap" required contoh="Siti Nurhaliza" />
      <Field name="email" type="email" label="Email (untuk login)" required contoh="siti@poltektedc.ac.id" />
      <Field name="password" type="password" label="Kata sandi awal" hint="Kosongkan untuk dibuatkan sandi acak yang kuat. Bila diisi: minimal 8 karakter, huruf dan angka." autoComplete="off" />
      <div className="sm:col-span-2">
        <Hasil />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>Tambah Admin</SubmitButton>
      </div>
    </ActionForm>
  );
}
