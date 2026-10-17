"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_FILE_MB } from "@/lib/constants";
import { inputCls } from "@/lib/styles";

/** Kirim IPK satu semester + transkrip. Semester yang sama dikirim ulang akan menggantikan laporan lama. */
export function FormLaporanIpk() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk(false);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (file instanceof File && file.size > MAX_FILE_MB * 1024 * 1024) return setError(`Ukuran berkas maksimal ${MAX_FILE_MB} MB.`);
    setBusy(true);
    try {
      const res = await fetch("/api/laporan-akademik", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? "Gagal mengirim. Coba lagi.");
      else {
        setOk(true);
        form.current?.reset();
        router.refresh();
      }
    } catch {
      setError("Koneksi terputus. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={form} onSubmit={kirim} method="post" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="semester" className="mb-1 block text-sm font-medium text-slate-700">
            Semester
          </label>
          <select id="semester" name="semester" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              — Pilih —
            </option>
            {Array.from({ length: 14 }, (_, i) => i + 1).map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ipk" className="mb-1 block text-sm font-medium text-slate-700">
            IPK
          </label>
          <input id="ipk" name="ipk" required inputMode="decimal" placeholder="3,75" className={inputCls} />
        </div>
        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium text-slate-700">
            Transkrip nilai
          </label>
          <input id="file" name="file" type="file" required accept="application/pdf,image/png,image/jpeg" className={inputCls} />
        </div>
      </div>
      <p className="text-xs text-slate-500">PDF, JPG, atau PNG maksimal {MAX_FILE_MB} MB. Mengirim ulang semester yang sama akan menggantikan laporan sebelumnya.</p>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="text-sm text-emerald-700">
          Laporan berhasil dikirim.
        </p>
      )}
      <div className="flex justify-end">
        <button disabled={busy} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-b from-[#2563eb] to-[#1646a0] px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60">
          {busy ? "Mengirim…" : "Kirim Laporan"}
        </button>
      </div>
    </form>
  );
}
