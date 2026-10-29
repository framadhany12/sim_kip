"use client";

import { hapusBukuTabungan } from "@/app/actions/buku-tabungan";

/** Hapus kiriman buku tabungan yang keliru; mahasiswa lalu bisa mengirim ulang. */
export function TombolHapusBukuTabungan({ id, nama }: { id: string; nama: string }) {
  return (
    <form
      action={hapusBukuTabungan.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`Hapus data buku tabungan ${nama}? Nomor rekening dan berkasnya dihapus, lalu ${nama} bisa mengirim ulang.`)) e.preventDefault();
      }}
    >
      <button className="min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">Hapus</button>
    </form>
  );
}
