"use client";

import { useEffect, useState } from "react";
import { useFormErrors } from "@/components/form";

export type PilihanAngkatan = { angkatan: number; keterangan: string };

/**
 * Pilihan angkatan sasaran pengumuman (kotak centang `angkatan`); harus di dalam <ActionForm>. Semua angkatan terpilih
 * sejak awal dan kembali begitu terkirim. `dipilih` dikembalikan ke induk untuk menghitung jumlah penerima.
 */
export function usePilihAngkatan(semua: number[]) {
  const state = useFormErrors();
  const [dipilih, setDipilih] = useState<number[]>(semua);
  useEffect(() => {
    if (state?.ok) setDipilih(semua);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return { dipilih, setDipilih };
}

export function PilihAngkatan({
  legend,
  pilihan,
  dipilih,
  setDipilih,
  kosong,
}: {
  legend: string;
  pilihan: PilihanAngkatan[];
  dipilih: number[];
  setDipilih: (v: number[]) => void;
  kosong: string;
}) {
  const state = useFormErrors();
  const error = state?.errors?.angkatan;
  const semua = pilihan.map((p) => p.angkatan);
  const [id] = useState(() => `angkatan-${Math.random().toString(36).slice(2, 8)}`);
  const ubah = (a: number) => setDipilih(dipilih.includes(a) ? dipilih.filter((x) => x !== a) : [...dipilih, a]);

  return (
    <fieldset className="min-w-0" aria-describedby={error ? id : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-slate-700">{legend}</legend>
      {pilihan.length === 0 ? (
        <p className="text-sm text-slate-500">{kosong}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {pilihan.map((p) => {
              const on = dipilih.includes(p.angkatan);
              return (
                <label
                  key={p.angkatan}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3.5 py-2 text-sm ring-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${on ? "bg-blue-50 text-blue-900 ring-blue-200" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50"}`}
                >
                  <input type="checkbox" name="angkatan" value={p.angkatan} checked={on} onChange={() => ubah(p.angkatan)} className="size-4 accent-blue-700" />
                  <span className="font-semibold">Angkatan {p.angkatan}</span>
                  <span className="tabular-nums text-slate-600">{p.keterangan}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-2 flex gap-3 text-sm">
            <button type="button" onClick={() => setDipilih(semua)} className="font-semibold text-blue-700 hover:underline">
              Pilih semua
            </button>
            <button type="button" onClick={() => setDipilih([])} className="text-slate-600 hover:underline">
              Kosongkan
            </button>
          </div>
        </>
      )}
      {error && (
        <p id={id} role="alert" className="mt-1.5 text-sm text-rose-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
