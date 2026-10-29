"use client";

import { useState } from "react";
import { inputCls } from "@/lib/styles";

/** No. Rek KIP-K + foto/scan buku tabungan. Sekali kirim; perbaikan lewat admin. */
export function FormBukuTabungan({ maxMb }: { maxMb: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [terkirim, setTerkirim] = useState(false);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (file instanceof File && file.size > maxMb * 1024 * 1024) return setError(`Ukuran berkas ${(file.size / 1024 / 1024).toFixed(1).replace(".", ",")} MB, maksimal ${maxMb} MB. Kecilkan foto lalu pilih lagi.`);
    if (!confirm("Kirim data buku tabungan? Setelah dikirim, data tidak bisa diubah sendiri. Bila ada kesalahan, hubungi admin.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/buku-tabungan", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? "Gagal mengirim. Coba lagi.");
      else {
        // Muat ulang penuh: tampilan berganti ke data terkirim dan menu/banner ikut diperbarui.
        setTerkirim(true);
        window.location.reload();
      }
    } catch {
      setError("Koneksi terputus. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={kirim} method="post" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="noRekening" className="mb-1 block text-sm font-medium text-slate-700">
            Nomor rekening KIP-K
          </label>
          <input id="noRekening" name="noRekening" required inputMode="numeric" autoComplete="off" maxLength={34} pattern="[0-9 .\-]{6,34}" aria-describedby="petunjuk-rek" className={`${inputCls} font-mono`} />
          <p id="petunjuk-rek" className="mt-1 text-xs text-slate-500">
            Salin persis dari buku tabungan, hanya angka.
          </p>
        </div>
        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium text-slate-700">
            Foto atau scan buku tabungan
          </label>
          <input id="file" name="file" type="file" required accept="application/pdf,image/png,image/jpeg" aria-describedby="petunjuk-file" className={inputCls} />
          <p id="petunjuk-file" className="mt-1 text-xs text-slate-500">
            Halaman depan yang memuat nama dan nomor rekening. JPG, PNG, atau PDF, maksimal {maxMb} MB.
          </p>
        </div>
      </div>
      {terkirim && (
        <p role="status" className="text-sm text-emerald-700">
          Terkirim. Memuat data Anda…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button disabled={busy || terkirim} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-b from-[#2563eb] to-[#1646a0] px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60">
          {busy ? "Mengirim…" : "Kirim Buku Tabungan"}
        </button>
      </div>
    </form>
  );
}
