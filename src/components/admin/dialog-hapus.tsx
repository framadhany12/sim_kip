"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { MAKS_PESAN_HAPUS } from "@/lib/constants";
import { inputCls } from "@/lib/styles";

type Hasil = { ok: boolean; message: string } | void;

/**
 * Tombol Hapus dengan popup konfirmasi sendiri (pengganti confirm() bawaan browser).
 * `catatan` diisi = dialog memuat kolom pesan opsional untuk pengguna; isinya diteruskan ke `aksi`.
 */
export function DialogHapus({
  judul,
  pesan,
  aksi,
  className,
  labelTombol = "Hapus",
  labelKonfirmasi = "Ya, hapus",
  catatan,
}: {
  judul: string;
  pesan: string;
  aksi: (pesan: string) => Promise<Hasil>;
  className: string;
  labelTombol?: string;
  labelKonfirmasi?: string;
  catatan?: { label: string; placeholder: string; bantuan: string };
}) {
  const uid = useId();
  const [buka, setBuka] = useState(false);
  const [pesanPengguna, setPesanPengguna] = useState("");
  const [galat, setGalat] = useState("");
  const [pending, mulai] = useTransition();
  const batalRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!buka) return;
    batalRef.current?.focus();
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tutup = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setBuka(false);
    };
    document.addEventListener("keydown", tutup);
    return () => {
      document.removeEventListener("keydown", tutup);
      document.body.style.overflow = overflowLama;
    };
  }, [buka, pending]);

  function hapus() {
    mulai(async () => {
      const r = await aksi(pesanPengguna.trim());
      if (r && !r.ok) setGalat(r.message);
      else setBuka(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setGalat("");
          setPesanPengguna("");
          setBuka(true);
        }}
        className={className}
      >
        {labelTombol}
      </button>
      {buka &&
        // Portal ke body: di dalam tabel/kartu beranimasi, position:fixed ikut terkurung dan dialog tampak kecil.
        createPortal(
          <div
            className="dialog-latar fixed inset-0 z-[70] grid place-items-center bg-black/25 p-4 backdrop-blur-[2px]"
            onClick={() => !pending && setBuka(false)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={`${uid}-judul`}
              aria-describedby={`${uid}-pesan`}
              onClick={(e) => e.stopPropagation()}
              className={`dialog-kotak w-full ${catatan ? "max-w-md" : "max-w-sm"} rounded-2xl bg-white p-5 text-left shadow-2xl ring-1 ring-slate-200`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-700"
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
                  </svg>
                </span>
                <div>
                  <h2
                    id={`${uid}-judul`}
                    className="text-base font-semibold text-slate-900"
                  >
                    {judul}
                  </h2>
                  <p
                    id={`${uid}-pesan`}
                    className="mt-1 text-sm text-slate-600"
                  >
                    {pesan}
                  </p>
                </div>
              </div>
              {catatan && (
                <div className="mt-4">
                  <label htmlFor={`${uid}-catatan`} className="mb-1 block text-sm font-medium text-slate-800">
                    {catatan.label} <span className="font-normal text-slate-500">(opsional)</span>
                  </label>
                  <textarea
                    id={`${uid}-catatan`}
                    rows={3}
                    value={pesanPengguna}
                    disabled={pending}
                    maxLength={MAKS_PESAN_HAPUS}
                    onChange={(e) => setPesanPengguna(e.target.value)}
                    placeholder={catatan.placeholder}
                    aria-describedby={`${uid}-bantuan`}
                    className={inputCls}
                  />
                  <p id={`${uid}-bantuan`} className="mt-1 flex justify-between gap-3 text-xs text-slate-500">
                    <span>{catatan.bantuan}</span>
                    <span className="tabular-nums">{MAKS_PESAN_HAPUS - pesanPengguna.length}</span>
                  </p>
                </div>
              )}
              {galat && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"
                >
                  {galat}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  ref={batalRef}
                  type="button"
                  disabled={pending}
                  onClick={() => setBuka(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={hapus}
                  className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
                >
                  {pending ? "Memproses…" : labelKonfirmasi}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
