import "server-only";
import { cache } from "react";
import { requirePendaftar } from "./auth";
import { belumDikirim, cekKelengkapan, muatLengkap, pendaftaranSaya } from "./pendaftaran";

/** Data lengkap pendaftaran milik pendaftar yang sedang login (di-cache per request). */
export const konteksPendaftar = cache(async () => {
  const user = await requirePendaftar();
  const p = await pendaftaranSaya(user.id);
  const d = (await muatLengkap(p.id))!;
  // Setelah dikirim, semua data tetap bisa diubah kecuali pilihan jurusan.
  return { user, d, cek: cekKelengkapan(d), sudahDikirim: !belumDikirim(d.status) };
});
