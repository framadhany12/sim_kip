"use client";

import { useEffect, useState } from "react";
import { jawabPengusulan } from "@/app/actions/formulir";
import { ActionForm, SubmitButton, TextArea, useFormErrors } from "@/components/form";

function Isi() {
  const s = useFormErrors();
  const [jawab, setJawab] = useState(s?.values?.jawaban ?? "");
  const [konfirmasi, setKonfirmasi] = useState(false);
  useEffect(() => {
    if (!konfirmasi) return;
    const tutup = (e: KeyboardEvent) => e.key === "Escape" && setKonfirmasi(false);
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
  }, [konfirmasi]);
  const pilihan = [
    { v: "bersedia", judul: "Ya, saya bersedia diusulkan", ket: "Data Anda akan kami usulkan sebagai penerima beasiswa dan Anda tidak bisa mengundurkan diri lagi." },
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
        {jawab === "bersedia" ? (
          <button
            type="button"
            onClick={() => setKonfirmasi(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98]"
          >
            Kirim Jawaban
          </button>
        ) : (
          <SubmitButton variant={jawab === "tidak" ? "danger" : "success"}>{jawab === "tidak" ? "Kirim: Tidak Bersedia" : "Kirim Jawaban"}</SubmitButton>
        )}
      </div>
      {konfirmasi && jawab === "bersedia" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setKonfirmasi(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="judul-konfirmasi" className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6" onClick={(e) => e.stopPropagation()}>
            <h3 id="judul-konfirmasi" className="text-lg font-bold text-slate-900">Yakin bersedia diusulkan?</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
              <li>Ketika memilih <b>Ya</b>, data dan jurusan tidak bisa diubah lagi.</li>
              <li>Setelah pengusulan, Anda tidak dapat mengundurkan diri.</li>
              <li>Jika mengundurkan diri setelah penetapan, akan dikenakan sanksi sebesar <b>Rp20.000.000</b> sesuai dengan yang diberitahukan saat wawancara.</li>
            </ol>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setKonfirmasi(false)} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-2.5 text-[15px] font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">
                Tidak, kembali
              </button>
              <SubmitButton variant="success">Ya, saya yakin</SubmitButton>
            </div>
          </div>
        </div>
      )}
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
