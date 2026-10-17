"use client";

import { hapusKegiatan } from "@/app/actions/kegiatan";

/** Hapus kegiatan + seluruh rekap kehadirannya; meminta konfirmasi dulu. */
export function TombolHapusKegiatan({ id, nama }: { id: string; nama: string }) {
  return (
    <form
      action={hapusKegiatan.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`Hapus kegiatan "${nama}" beserta seluruh rekap kehadirannya? Tindakan ini tidak dapat dibatalkan.`)) e.preventDefault();
      }}
    >
      <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">Hapus</button>
    </form>
  );
}
