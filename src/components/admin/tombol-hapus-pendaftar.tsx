"use client";

import { hapusPendaftar } from "@/app/actions/hapus-pendaftar";
import { DialogHapus } from "./dialog-hapus";

/** Hapus pendaftar beserta seluruh datanya; meminta konfirmasi lewat popup. */
export function TombolHapusPendaftar({ id, nama }: { id: string; nama: string }) {
  return (
    <DialogHapus
      judul="Hapus pendaftar?"
      pesan={`Akun "${nama}" beserta seluruh data dan berkasnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
      aksi={() => hapusPendaftar(id)}
      className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
    />
  );
}
