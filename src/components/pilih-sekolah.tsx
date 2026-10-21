"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FieldShell, inputCls, useFormErrors } from "./form";

type Sekolah = { npsn: string; nama: string; kota: string | null };

/**
 * Isian Nama sekolah + NPSN dari master sekolah: ketik untuk mencari, pilih, NPSN terisi otomatis.
 * Bila sekolah tidak ditemukan, pengguna beralih ke isian manual; sekolah itu ditambahkan ke master saat disimpan.
 * Mengirim `namaSekolah`, `npsn`, dan `sekolahManual` (dipakai mengembalikan mode saat validasi gagal).
 */
export function PilihSekolah({ defaultNama, defaultNpsn }: { defaultNama?: string | null; defaultNpsn?: string | null }) {
  const state = useFormErrors();
  const errors = state?.errors;
  const awalNama = state?.values?.namaSekolah ?? defaultNama ?? "";
  const awalNpsn = state?.values?.npsn ?? defaultNpsn ?? "";
  const [manual, setManual] = useState(state?.values?.sekolahManual === "1");
  const [pilihan, setPilihan] = useState<Sekolah | null>(awalNama && awalNpsn && !manual ? { nama: awalNama, npsn: awalNpsn, kota: null } : null);
  const [nama, setNama] = useState(awalNama);
  const [npsn, setNpsn] = useState(awalNpsn);
  const [q, setQ] = useState("");
  const [hasil, setHasil] = useState<Sekolah[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState(0);
  const listId = useId();
  const cariRef = useRef<HTMLInputElement>(null);
  const namaRef = useRef<HTMLInputElement>(null);
  const npsnRef = useRef<HTMLInputElement>(null);

  // Sinkronkan ulang bila server mengembalikan nilai lain (validasi gagal).
  useEffect(() => {
    if (!state?.values) return;
    const m = state.values.sekolahManual === "1";
    setManual(m);
    setNama(state.values.namaSekolah ?? "");
    setNpsn(state.values.npsn ?? "");
    setPilihan(!m && state.values.namaSekolah && state.values.npsn ? { nama: state.values.namaSekolah, npsn: state.values.npsn, kota: null } : null);
  }, [state]);

  useEffect(() => {
    const kata = q.trim();
    if (kata.length < 2) {
      setHasil([]);
      setMemuat(false);
      return;
    }
    let batal = false;
    setMemuat(true);
    const t = setTimeout(() => {
      fetch(`/api/sekolah?q=${encodeURIComponent(kata)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rows: Sekolah[]) => {
          if (batal) return;
          setHasil(rows);
          setAktif(0);
        })
        .catch(() => !batal && setHasil([]))
        .finally(() => !batal && setMemuat(false));
    }, 250);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [q]);

  function pilih(s: Sekolah) {
    setPilihan(s);
    setNama(s.nama);
    setNpsn(s.npsn);
    setBuka(false);
    setQ("");
  }

  function ganti() {
    setPilihan(null);
    setNama("");
    setNpsn("");
    setTimeout(() => cariRef.current?.focus(), 0);
  }

  function keManual() {
    const kata = q.trim();
    const angka = /^\d+$/.test(kata);
    setManual(true);
    setPilihan(null);
    setNama(angka ? "" : kata);
    setNpsn(angka ? kata.slice(0, 8) : "");
    setBuka(false);
    // Nama sudah terbawa dari kata yang dicari: langsung lanjut mengisi NPSN.
    setTimeout(() => (kata && !angka ? npsnRef : namaRef).current?.focus(), 0);
  }

  function keCari() {
    setManual(false);
    setPilihan(null);
    setNama("");
    setNpsn("");
    setQ("");
  }

  const errNama = errors?.namaSekolah;
  const errNpsn = errors?.npsn;
  const cukup = q.trim().length >= 2;

  if (manual)
    return (
      <>
        <input type="hidden" name="sekolahManual" value="1" />
        <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-[13px] leading-snug text-blue-900 sm:col-span-2">
          <span className="font-semibold">Tambah sekolah baru.</span> Isi nama sekolah dan NPSN. Setelah disimpan, sekolah ini masuk ke daftar sehingga pendaftar lain
          dari sekolah yang sama tinggal memilihnya.
        </p>
        <FieldShell name="namaSekolah" label="Nama sekolah" required error={errNama} hint="Tulis lengkap sesuai ijazah." contoh="SMK Negeri 1 Cimahi">
          <input id="namaSekolah" ref={namaRef} name="namaSekolah" value={nama} onChange={(e) => setNama(e.target.value)} maxLength={150} aria-invalid={!!errNama} className={inputCls} />
        </FieldShell>
        <FieldShell
          name="npsn"
          label="NPSN sekolah"
          required
          error={errNpsn}
          hint="8 digit. Cari di referensi.data.kemdikbud.go.id atau tanyakan ke sekolah."
          contoh="20224021"
        >
          <input
            id="npsn"
            ref={npsnRef}
            name="npsn"
            inputMode="numeric"
            maxLength={8}
            value={npsn}
            onChange={(e) => setNpsn(e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!errNpsn}
            className={inputCls}
          />
        </FieldShell>
        <p className="-mt-2 text-[13px] text-slate-600 sm:col-span-2">
          <button type="button" onClick={keCari} className="font-medium text-blue-700 underline-offset-2 hover:underline">
            Kembali mencari dari daftar sekolah
          </button>
        </p>
      </>
    );

  return (
    <>
      <input type="hidden" name="namaSekolah" value={nama} />
      <FieldShell name="namaSekolah" label="Nama sekolah" required error={errNama} hint={pilihan ? undefined : "Ketik nama sekolah, kota, atau NPSN, lalu pilih dari daftar."}>
        {pilihan ? (
          <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-slate-900">{pilihan.nama}</p>
              {pilihan.kota && <p className="truncate text-xs text-slate-500">{pilihan.kota}</p>}
            </div>
            <button type="button" onClick={ganti} className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50">
              Ganti
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              id="namaSekolah"
              ref={cariRef}
              type="search"
              role="combobox"
              aria-expanded={buka && cukup}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={buka && hasil[aktif] ? `${listId}-${aktif}` : undefined}
              aria-invalid={!!errNama}
              autoComplete="off"
              placeholder="Mis. SMKN 1 Cimahi"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setBuka(true);
              }}
              onFocus={() => setBuka(true)}
              onBlur={() => setTimeout(() => setBuka(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setBuka(true);
                  setAktif((i) => Math.min(i + 1, hasil.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setAktif((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  // Enter di kolom cari memilih sekolah, bukan mengirim formulir.
                  e.preventDefault();
                  if (buka && hasil[aktif]) pilih(hasil[aktif]);
                } else if (e.key === "Escape") setBuka(false);
              }}
              className={inputCls}
            />
            {buka && cukup && (
              <ul
                id={listId}
                role="listbox"
                className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              >
                {hasil.map((s, i) => (
                  <li
                    key={s.npsn}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === aktif}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pilih(s)}
                    onMouseEnter={() => setAktif(i)}
                    className={`cursor-pointer px-3 py-2 ${i === aktif ? "bg-blue-50" : ""}`}
                  >
                    <p className="text-sm font-medium text-slate-900">{s.nama}</p>
                    <p className="text-xs text-slate-500">
                      NPSN {s.npsn}
                      {s.kota && ` · ${s.kota}`}
                    </p>
                  </li>
                ))}
                {!memuat && hasil.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Sekolah belum ada di daftar.</li>}
                {memuat && hasil.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Mencari…</li>}
                <li className="border-t border-slate-100 px-1 pt-1">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={keManual}
                    className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-blue-700 hover:bg-blue-50"
                  >
                    + Tambah sekolah baru (belum ada di daftar)
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </FieldShell>
      <FieldShell name="npsn" label="NPSN sekolah" required error={errNpsn} hint={pilihan ? "Terisi otomatis dari sekolah yang dipilih." : "Terisi otomatis setelah sekolah dipilih."}>
        <input id="npsn" name="npsn" value={npsn} readOnly tabIndex={-1} className={`${inputCls} cursor-not-allowed bg-slate-100 font-mono text-slate-600`} />
      </FieldShell>
      {!pilihan && (
        <p className="-mt-2 text-[13px] text-slate-600 sm:col-span-2">
          Sekolah tidak ada di daftar?{" "}
          <button type="button" onClick={keManual} className="font-medium text-blue-700 underline-offset-2 hover:underline">
            Tambah sekolah baru
          </button>
        </p>
      )}
    </>
  );
}
