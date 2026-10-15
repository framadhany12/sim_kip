"use client";

import { startTransition, useActionState, useState } from "react";
import { aturAktifAkun } from "@/app/actions/pengguna";

/** Saklar aktif/nonaktif langsung di baris daftar; menonaktifkan meminta konfirmasi dulu. */
export function TombolAktif({ userId, nama, aktif, dilarang }: { userId: string; nama: string; aktif: boolean; dilarang?: boolean }) {
  const [state, aksi, pending] = useActionState(aturAktifAkun.bind(null, userId), undefined);
  const [konfirmasi, setKonfirmasi] = useState(false);

  const kirim = () => {
    const fd = new FormData();
    fd.set("aktif", aktif ? "0" : "1");
    setKonfirmasi(false);
    startTransition(() => aksi(fd));
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        {aktif ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-300">Aktif</span>
        ) : (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-rose-300">Nonaktif</span>
        )}
        {!dilarang &&
          (konfirmasi ? (
            <span className="flex items-center gap-1" role="alertdialog" aria-label={`Konfirmasi nonaktifkan ${nama}`}>
              <button type="button" onClick={kirim} disabled={pending} className="rounded-md bg-rose-700 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50">
                Ya
              </button>
              <button type="button" onClick={() => setKonfirmasi(false)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50">
                Batal
              </button>
            </span>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={aktif ? () => setKonfirmasi(true) : kirim}
              aria-label={`${aktif ? "Nonaktifkan" : "Aktifkan"} akun ${nama}`}
              className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 disabled:opacity-50 ${aktif ? "text-rose-700 ring-rose-300 hover:bg-rose-50" : "text-emerald-700 ring-emerald-300 hover:bg-emerald-50"}`}
            >
              {pending ? "…" : aktif ? "Nonaktifkan" : "Aktifkan"}
            </button>
          ))}
      </div>
      {state && !state.ok && state.message && <p className="max-w-56 text-xs text-rose-700">{state.message}</p>}
    </div>
  );
}
