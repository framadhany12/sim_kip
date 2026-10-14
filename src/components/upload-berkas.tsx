"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JenisBerkas } from "@/db/schema";
import { MAX_FILE_MB } from "@/lib/constants";

export type BerkasRingkas = {
  id: string;
  namaAsli: string;
  mimeType: string;
  ukuran: number;
  statusVerifikasi: "menunggu" | "valid" | "tidak_valid";
  uploadedAt: string;
};

const VERIF = {
  menunggu: { label: "Menunggu verifikasi", cls: "text-slate-600" },
  valid: { label: "✓ Valid", cls: "text-emerald-700" },
  tidak_valid: { label: "✕ Tidak valid — mohon ganti", cls: "text-rose-700" },
};

export function UploadBerkas({
  jenis,
  label,
  tips,
  wajib,
  berkas,
  editable,
  extra,
}: {
  jenis: JenisBerkas;
  label: string;
  tips: string;
  wajib: boolean;
  berkas?: BerkasRingkas;
  editable: boolean;
  extra?: React.ReactNode;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function unggah(file: File) {
    setError("");
    if (file.size > MAX_FILE_MB * 1024 * 1024) return setError(`Ukuran berkas maksimal ${MAX_FILE_MB} MB.`);
    setBusy(true);
    const fd = new FormData();
    fd.set("jenis", jenis);
    fd.set("file", file);
    try {
      const res = await fetch("/api/berkas", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? "Gagal mengunggah. Coba lagi.");
      else router.refresh();
    } catch {
      setError("Koneksi terputus. Coba lagi.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function hapus() {
    setBusy(true);
    await fetch(`/api/berkas?jenis=${jenis}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  const url = berkas ? `/api/berkas/${berkas.id}` : "";
  const isImage = berkas?.mimeType.startsWith("image/");

  return (
    <div className={`rounded-xl border p-4 ${berkas?.statusVerifikasi === "tidak_valid" ? "border-rose-300 bg-rose-50/40" : "border-slate-200 bg-white"}`}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 sm:flex-nowrap">
        <a
          href={url || undefined}
          target="_blank"
          rel="noreferrer"
          className={`grid size-16 shrink-0 place-items-center sm:size-20 overflow-hidden rounded-lg border ${
            berkas ? "border-slate-200 bg-slate-50 hover:ring-2 hover:ring-blue-600/30" : "border-dashed border-slate-300 bg-slate-50"
          }`}
          aria-label={berkas ? `Pratinjau ${label}` : undefined}
        >
          {berkas ? (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={`Pratinjau ${label}`} className="size-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-rose-700">PDF</span>
            )
          ) : (
            <span className="text-2xl text-slate-300">＋</span>
          )}
        </a>
        <div className="min-w-0 flex-1 basis-40">
          <p className="font-semibold text-slate-900">
            {label} {wajib ? <span className="text-rose-600">*</span> : <span className="text-sm font-normal text-slate-500">(opsional)</span>}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-500">{tips}</p>
          {extra}
          {berkas ? (
            <p className="mt-2 text-sm">
              <a href={url} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">
                {berkas.namaAsli}
              </a>{" "}
              <span className="text-slate-500">· {(berkas.ukuran / 1024).toFixed(0)} KB</span>
              <span className={`ml-2 text-[13px] font-medium ${VERIF[berkas.statusVerifikasi].cls}`}>{VERIF[berkas.statusVerifikasi].label}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-700">Belum diunggah</p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-rose-700">
              {error}
            </p>
          )}
        </div>
        {editable && (
          <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <input
              ref={input}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="sr-only"
              id={`file-${jenis}`}
              onChange={(e) => e.target.files?.[0] && unggah(e.target.files[0])}
            />
            <label
              htmlFor={`file-${jenis}`}
              className={`inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg px-5 py-2 text-[15px] font-semibold active:scale-[0.98] sm:flex-none ${
                berkas ? "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50" : "bg-blue-700 text-white hover:bg-blue-800"
              } ${busy ? "pointer-events-none opacity-60" : ""}`}
            >
              {busy ? "Mengunggah…" : berkas ? "Ganti" : "Unggah"}
            </label>
            {berkas && !wajib && (
              <button type="button" onClick={hapus} disabled={busy} className="min-h-11 rounded-lg px-4 py-2 text-[15px] font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">
                Hapus
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
