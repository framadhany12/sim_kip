"use client";

import { hapusLaporanIpk } from "@/app/actions/pelaporan";
import { DialogHapus } from "./dialog-hapus";

/** Hapus laporan IPK satu semester yang salah input; mahasiswa lalu bisa melapor ulang. */
export function TombolHapusLaporanIpk({ id, nama, semester }: { id: string; nama: string; semester: number }) {
  return (
    <DialogHapus
      judul={`Hapus laporan Semester ${semester}?`}
      pesan={`IPK dan transkrip Semester ${semester} milik ${nama} akan dihapus, lalu ${nama} bisa melapor ulang.`}
      aksi={() => hapusLaporanIpk(id)}
      className="min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
    />
  );
}
