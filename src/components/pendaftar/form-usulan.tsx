"use client";

import { useState } from "react";
import { jawabPengusulan } from "@/app/actions/formulir";
import { ActionForm, SubmitButton, TextArea, useFormErrors } from "@/components/form";

function Isi() {
  const s = useFormErrors();
  const [jawab, setJawab] = useState(s?.values?.jawaban ?? "");
  const pilihan = [
    { v: "bersedia", judul: "Ya, saya bersedia diusulkan", ket: "Status berubah menjadi Diusulkan, lalu tinggal menunggu pengumuman. Setelah diusulkan, Anda tidak dapat membatalkan atau mengubah jawaban ini." },
    { v: "tidak", judul: "Tidak, saya tidak bersedia", ket: "Pendaftaran Anda berhenti dan masuk daftar tidak diterima. Tidak dapat dibatalkan sendiri." },
  ];
  return (
    <>
      {s?.errors?.jawaban && <p className="text-sm text-rose-700">{s.errors.jawaban}</p>}
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Kesediaan diusulkan">
        {pilihan.map((p) => (
          <label
            key={p.v}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${
              jawab === p.v ? (p.v === "bersedia" ? "border-emerald-500 bg-emerald-50" : "border-rose-400 bg-rose-50") : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <input type="radio" name="jawaban" value={p.v} checked={jawab === p.v} onChange={() => setJawab(p.v)} className="mt-0.5 size-4 shrink-0 accent-blue-700" />
            <span>
              <b className="block text-slate-900">{p.judul}</b>
              <span className="text-slate-600">{p.ket}</span>
            </span>
          </label>
        ))}
      </div>
      {jawab === "tidak" && (
        <TextArea name="alasan" label="Alasan tidak bersedia" required rows={3} defaultValue={s?.values?.alasan} hint="Tulis alasan Anda dengan jujur. Maksimal 500 karakter." />
      )}
      <div className="flex justify-end">
        <SubmitButton variant={jawab === "tidak" ? "danger" : "success"}>{jawab === "tidak" ? "Kirim: Tidak Bersedia" : "Kirim Jawaban"}</SubmitButton>
      </div>
    </>
  );
}

/** Pertanyaan di tahap Pengusulan: apakah pendaftar bersedia diusulkan sebagai penerima KIP Kuliah. */
export function FormUsulan() {
  return (
    <section className="rounded-xl border-2 border-blue-300 bg-blue-50 p-5 sm:p-6" aria-label="Kesediaan diusulkan">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">Perlu jawaban Anda</p>
      <h2 className="mt-1 text-lg font-bold text-slate-900">Apakah Anda bersedia diusulkan sebagai penerima KIP Kuliah?</h2>
      <p className="mt-1 text-sm text-slate-700">Jawaban hanya bisa diberikan satu kali dan tidak dapat dibatalkan. Jawab dengan teliti.</p>
      <div className="mt-4">
        <ActionForm action={jawabPengusulan} className="space-y-4">
          <Isi />
        </ActionForm>
      </div>
    </section>
  );
}
