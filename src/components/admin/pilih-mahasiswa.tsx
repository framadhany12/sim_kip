"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hapusCalonMahasiswa, hapusMahasiswaTerpilih } from "@/app/actions/hapus-pendaftar";
import { DialogHapus } from "./dialog-hapus";

type Ctx = { dipilih: Set<string>; ubah: (id: string, nilai: boolean) => void; ubahSemua: (nilai: boolean) => void; idHalaman: string[]; kosongkan: () => void };
const PilihCtx = createContext<Ctx | null>(null);
const usePilih = () => {
  const c = useContext(PilihCtx);
  if (!c) throw new Error("Harus di dalam PilihProvider");
  return c;
};

/** Menyimpan mahasiswa yang dicentang di halaman ini; pilihan dibuang otomatis saat pindah halaman atau filter. */
export function PilihProvider({ idHalaman, children }: { idHalaman: string[]; children: ReactNode }) {
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const kunci = idHalaman.join(",");
  useEffect(() => {
    setDipilih((s) => {
      const sisa = new Set([...s].filter((id) => kunci.split(",").includes(id)));
      return sisa.size === s.size ? s : sisa;
    });
  }, [kunci]);
  const nilai = useMemo<Ctx>(
    () => ({
      dipilih,
      idHalaman: kunci ? kunci.split(",") : [],
      ubah: (id, v) =>
        setDipilih((s) => {
          const n = new Set(s);
          if (v) n.add(id);
          else n.delete(id);
          return n;
        }),
      ubahSemua: (v) => setDipilih(v ? new Set(kunci ? kunci.split(",") : []) : new Set()),
      kosongkan: () => setDipilih(new Set()),
    }),
    [dipilih, kunci],
  );
  return <PilihCtx.Provider value={nilai}>{children}</PilihCtx.Provider>;
}

const kotak = "size-4 cursor-pointer rounded border-slate-300 accent-blue-700";

export function KotakPilih({ id, nama }: { id: string; nama: string }) {
  const { dipilih, ubah } = usePilih();
  return <input type="checkbox" className={kotak} checked={dipilih.has(id)} onChange={(e) => ubah(id, e.target.checked)} aria-label={`Pilih ${nama}`} />;
}

export function KotakPilihSemua({ satuan = "mahasiswa" }: { satuan?: string }) {
  const { dipilih, idHalaman, ubahSemua } = usePilih();
  const semua = idHalaman.length > 0 && idHalaman.every((id) => dipilih.has(id));
  return (
    <input
      type="checkbox"
      className={kotak}
      checked={semua}
      ref={(el) => {
        if (el) el.indeterminate = !semua && dipilih.size > 0;
      }}
      disabled={idHalaman.length === 0}
      onChange={(e) => ubahSemua(e.target.checked)}
      aria-label={`Pilih semua ${satuan} di halaman ini`}
    />
  );
}

const JENIS_HAPUS = {
  mahasiswa: { satuan: "mahasiswa", rincian: "Akun {n} mahasiswa terpilih beserta seluruh data, IPK, buku tabungan, dan berkasnya", hapus: hapusMahasiswaTerpilih },
  calon: { satuan: "akun", rincian: "{n} akun terpilih beserta seluruh data pendaftaran dan berkasnya (yang sudah menjadi mahasiswa dilewati)", hapus: hapusCalonMahasiswa },
};

/** Bilah aksi yang muncul bila ada baris yang dicentang. `calon` = Master Calon Mahasiswa (id = id akun). */
export function BarHapusMassal({ jenis = "mahasiswa" }: { jenis?: keyof typeof JENIS_HAPUS }) {
  const { dipilih, kosongkan } = usePilih();
  if (dipilih.size === 0) return null;
  const ids = [...dipilih];
  const { satuan, rincian, hapus } = JENIS_HAPUS[jenis];
  return (
    <div role="region" aria-label={`Aksi untuk ${satuan} terpilih`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
      <span className="font-medium text-blue-900">
        {ids.length} {satuan} dipilih
      </span>
      <span className="flex items-center gap-2">
        <button type="button" onClick={kosongkan} className="rounded-lg px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-white">
          Batal pilih
        </button>
        <DialogHapus
          judul={`Hapus ${ids.length} ${satuan}?`}
          pesan={`${rincian.replace("{n}", String(ids.length))} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
          aksi={async () => {
            const r = await hapus(ids);
            if (r.ok) kosongkan();
            return r;
          }}
          labelTombol={`Hapus terpilih (${ids.length})`}
          labelKonfirmasi={`Ya, hapus ${ids.length}`}
          className="rounded-lg bg-rose-700 px-3 py-1.5 font-semibold text-white hover:bg-rose-800"
        />
      </span>
    </div>
  );
}
