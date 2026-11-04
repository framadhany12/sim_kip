import "server-only";
import { redirect } from "next/navigation";
import type { CurrentUser } from "./auth";
import { cariPendaftaranUser, cekKelengkapan, muatLengkap, type PendaftaranLengkap } from "./pendaftaran";

/** Bagian yang diisi mahasiswa lama hasil impor. Tanpa unggah berkas dan tanpa rekomendasi. */
export const BAGIAN_LENGKAPI = [
  { slug: "data-diri", label: "Data Diri" },
  { slug: "keluarga", label: "Keluarga" },
  { slug: "ekonomi", label: "Ekonomi Orang Tua" },
  { slug: "sekolah", label: "Sekolah & Jurusan" },
  { slug: "akademik", label: "NIM & Kelas" },
] as const;
export type SlugLengkapi = (typeof BAGIAN_LENGKAPI)[number]["slug"];

export function cekLengkapMahasiswaLama(d: PendaftaranLengkap) {
  const { langkah } = cekKelengkapan(d);
  const selesai: Record<SlugLengkapi, boolean> = {
    "data-diri": langkah["data-diri"],
    keluarga: langkah.keluarga,
    ekonomi: !!d.ekonomi, // mahasiswa lama tidak mengunggah berkas
    sekolah: !!d.sekolah && !!d.jurusanDiterimaId,
    akademik: !!d.nim && !!d.kelas,
  };
  const berikutnya = BAGIAN_LENGKAPI.find((b) => !selesai[b.slug])?.slug ?? null;
  return { selesai, berikutnya, semua: berikutnya === null };
}

/** Mahasiswa lama yang datanya belum lengkap diarahkan ke halaman Lengkapi Data. */
export async function arahkanBilaBelumLengkap(user: CurrentUser) {
  if (!user.mahasiswaLama) return;
  const p = await cariPendaftaranUser(user.id);
  const d = p && (await muatLengkap(p.id));
  if (d && !cekLengkapMahasiswaLama(d).semua) redirect("/lengkapi-data");
}
