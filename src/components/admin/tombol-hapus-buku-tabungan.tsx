"use client";

import { hapusBukuTabungan } from "@/app/actions/buku-tabungan";
import { DialogHapus } from "./dialog-hapus";

/** Hapus kiriman buku tabungan yang keliru, dengan pesan opsional ke mahasiswa; mahasiswa lalu bisa mengirim ulang. */
export function TombolHapusBukuTabungan({ id, nama }: { id: string; nama: string }) {
  return (
    <DialogHapus
      judul="Hapus buku tabungan?"
      pesan={`Nomor rekening dan berkas buku tabungan ${nama} akan dihapus, lalu ${nama} bisa mengirim ulang.`}
      aksi={(pesan) => hapusBukuTabungan(id, pesan)}
      catatan={{
        label: "Pesan untuk mahasiswa",
        placeholder: "Contoh: Nomor rekening tidak sesuai dengan foto buku tabungan. Kirim ulang dengan nomor yang benar.",
        bantuan: "Tampil di akun mahasiswa sampai ia mengirim ulang buku tabungan.",
      }}
      className="min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
    />
  );
}
