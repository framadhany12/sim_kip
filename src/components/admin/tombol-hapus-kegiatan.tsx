"use client";

import { hapusKegiatan } from "@/app/actions/kegiatan";
import { DialogHapus } from "./dialog-hapus";

/** Hapus kegiatan + seluruh rekap kehadirannya; meminta konfirmasi lewat popup. */
export function TombolHapusKegiatan({ id, nama }: { id: string; nama: string }) {
  return (
    <DialogHapus
      judul="Hapus kegiatan?"
      pesan={`Kegiatan "${nama}" beserta seluruh rekap kehadirannya akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
      aksi={() => hapusKegiatan(id)}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
    />
  );
}
