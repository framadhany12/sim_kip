"use client";

import { hapusCalonMahasiswa } from "@/app/actions/hapus-pendaftar";
import { DialogHapus } from "./dialog-hapus";

/** Hapus satu akun dari Master Calon Mahasiswa beserta seluruh datanya; meminta konfirmasi lewat popup. */
export function TombolHapusCalon({ userId, nama }: { userId: string; nama: string }) {
  return (
    <DialogHapus
      judul="Hapus akun?"
      pesan={`Akun "${nama}" beserta seluruh data pendaftaran dan berkasnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
      aksi={() => hapusCalonMahasiswa([userId])}
      className="rounded-md px-2 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-300 hover:bg-rose-50"
    />
  );
}
