"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { hapusLaporanIpk } from "@/app/actions/pelaporan";
import { MAKS_PESAN_HAPUS } from "@/lib/constants";
import { inputCls } from "@/lib/styles";

/**
 * Hapus laporan IPK satu semester yang salah input, dengan pesan opsional untuk mahasiswa.
 * `semester` = semester yang sudah dilaporkan mahasiswa ini; satu angka = tanpa pilihan, lebih dari satu = admin memilih.
 */
export function TombolHapusLaporanIpk({
  pendaftaranId,
  nama,
  semester,
  className = "min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50",
}: {
  pendaftaranId: string;
  nama: string;
  semester: number[];
  className?: string;
}) {
  const uid = useId();
  const [buka, setBuka] = useState(false);
  const [pilih, setPilih] = useState(semester[0]);
  const [pesan, setPesan] = useState("");
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

  if (semester.length === 0) return null;

  function bukaDialog() {
    setGalat("");
    setPesan("");
    setPilih(semester[semester.length - 1]);
    setBuka(true);
  }

  function hapus() {
    mulai(async () => {
      const r = await hapusLaporanIpk({
        pendaftaranId,
        semester: pilih,
        pesan,
      });
      if (!r.ok) setGalat(r.message);
      else setBuka(false);
    });
  }

  const sisa = MAKS_PESAN_HAPUS - pesan.length;

  return (
    <>
      <button type="button" onClick={bukaDialog} className={className}>
        Hapus
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
              className="dialog-kotak w-full max-w-md rounded-2xl bg-white p-5 text-left shadow-2xl ring-1 ring-slate-200"
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
                <div className="min-w-0">
                  <h2
                    id={`${uid}-judul`}
                    className="text-base font-semibold text-slate-900"
                  >
                    Hapus laporan IPK {nama}?
                  </h2>
                  <p
                    id={`${uid}-pesan`}
                    className="mt-1 text-sm text-slate-600"
                  >
                    IPK dan transkrip semester yang dipilih akan dihapus.
                    Mahasiswa bisa melapor ulang semester itu.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {semester.length > 1 ? (
                  <div>
                    <label
                      htmlFor={`${uid}-semester`}
                      className="mb-1 block text-sm font-medium text-slate-800"
                    >
                      Semester yang dihapus
                    </label>
                    <select
                      id={`${uid}-semester`}
                      value={pilih}
                      disabled={pending}
                      onChange={(e) => setPilih(Number(e.target.value))}
                      className={inputCls}
                    >
                      {semester.map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200">
                    Semester {semester[0]}
                  </p>
                )}

                <div>
                  <label
                    htmlFor={`${uid}-catatan`}
                    className="mb-1 block text-sm font-medium text-slate-800"
                  >
                    Pesan untuk mahasiswa{" "}
                    <span className="font-normal text-slate-500">
                      (opsional)
                    </span>
                  </label>
                  <textarea
                    id={`${uid}-catatan`}
                    rows={3}
                    value={pesan}
                    disabled={pending}
                    maxLength={MAKS_PESAN_HAPUS}
                    onChange={(e) => setPesan(e.target.value)}
                    placeholder="Contoh: Transkrip yang diunggah milik semester lain. Unggah transkrip Semester 3 yang benar."
                    aria-describedby={`${uid}-bantuan`}
                    className={inputCls}
                  />
                  <p
                    id={`${uid}-bantuan`}
                    className="mt-1 flex justify-between gap-3 text-xs text-slate-500"
                  >
                    <span>
                      Tampil di dashboard mahasiswa sampai ia melapor ulang
                      semester ini.
                    </span>
                    <span className="tabular-nums">{sisa}</span>
                  </p>
                </div>
              </div>

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
                  {pending ? "Menghapus…" : `Hapus Semester ${pilih}`}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
