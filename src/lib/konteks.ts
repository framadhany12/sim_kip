import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { requirePendaftar } from "./auth";
import { cekLengkapMahasiswaLama } from "./mahasiswa-lama";
import { belumDikirim, cekKelengkapan, muatLengkap, pendaftaranSaya, terkunci } from "./pendaftaran";

/** Data lengkap pendaftaran milik pendaftar yang sedang login (di-cache per request). */
export const konteksPendaftar = cache(async () => {
  const user = await requirePendaftar();
  const p = await pendaftaranSaya(user.id);
  const d = (await muatLengkap(p.id))!;
  if (user.mahasiswaLama && !cekLengkapMahasiswaLama(d).semua) redirect("/lengkapi-data");
  // Setelah dikirim, data tetap bisa diubah kecuali pilihan jurusan; sejak tahap Pengusulan semuanya terkunci.
  return { user, d, cek: cekKelengkapan(d), sudahDikirim: !belumDikirim(d.status), terkunci: terkunci(d) };
});
