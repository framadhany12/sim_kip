"use client";

import { hapusSekolah } from "@/app/actions/sekolah";

/** Hapus sekolah dari master; isian pendaftar yang sudah memakai sekolah ini tidak berubah. */
export function TombolHapusSekolah({ id, nama, dipakai }: { id: string; nama: string; dipakai: number }) {
  return (
    <form
      action={hapusSekolah}
      onSubmit={(e) => {
        const catatan = dipakai > 0 ? ` Sekolah ini dipakai ${dipakai} pendaftar; isian mereka tetap tersimpan.` : "";
        if (!confirm(`Hapus "${nama}" dari master sekolah?${catatan}`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-sm font-medium text-rose-700 hover:underline">Hapus dari master</button>
    </form>
  );
}
