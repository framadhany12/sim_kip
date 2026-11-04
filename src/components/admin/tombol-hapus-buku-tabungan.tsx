"use client";

import { hapusBukuTabungan } from "@/app/actions/buku-tabungan";
import { DialogHapus } from "./dialog-hapus";

/** Hapus kiriman buku tabungan yang keliru; mahasiswa lalu bisa mengirim ulang. */
export function TombolHapusBukuTabungan({ id, nama }: { id: string; nama: string }) {
  return (
    <DialogHapus
      judul="Hapus buku tabungan?"
      pesan={`Nomor rekening dan berkas buku tabungan ${nama} akan dihapus, lalu ${nama} bisa mengirim ulang.`}
      aksi={() => hapusBukuTabungan(id)}
      className="min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
    />
  );
}
