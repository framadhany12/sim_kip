import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pengaturan } from "@/db/schema";
import { BERKAS_INFO, BERKAS_UTAMA, MAX_FILE_MB, MAX_UMUR, tahunLulusBoleh } from "@/lib/constants";
import { KAMPUS, KIP } from "@/lib/profil";

/** Isi landing page yang bisa diubah admin lewat Informasi → Landing Page. */
export type LandingKonten = {
  banner: { aktif: boolean; teks: string };
  hero: { judul: string; sorot: string; deskripsi: string };
  syarat: { judul: string; item: string[] };
  berkas: { judul: string; item: string[]; catatan: string };
  kip: { judul: string; ringkas: string; sasaran: string[]; manfaat: { judul: string; isi: string }[] };
  alur: { judul: string; langkah: { judul: string; isi: string }[] };
  kampus: { ringkas: string; alamat: string };
};

export const KUNCI_LANDING = "landing";

export const landingBawaan = (): LandingKonten => ({
  banner: { aktif: false, teks: "" },
  hero: {
    judul: "Kuliah vokasi di Politeknik TEDC,",
    sorot: "dibiayai KIP Kuliah.",
    deskripsi: "Daftar KIP Kuliah secara daring: formulir terpandu di setiap kolom, unggah berkas dari HP, dan pantau status pendaftaran Anda sendiri.",
  },
  syarat: {
    judul: "Siapa yang bisa mendaftar?",
    item: [`Lulusan SMA/SMK/MA atau sederajat tahun ${tahunLulusBoleh().join(", ")}`, `Berusia maksimal ${MAX_UMUR} tahun`, "Berasal dari keluarga dengan keterbatasan ekonomi"],
  },
  berkas: {
    judul: "Berkas yang disiapkan",
    item: [...BERKAS_UTAMA.map((j) => BERKAS_INFO[j].label), BERKAS_INFO.surat_ekonomi.label],
    catatan: `Format PDF, JPG, atau PNG, maksimal ${MAX_FILE_MB} MB per berkas.`,
  },
  kip: {
    judul: "Bantuan pemerintah agar biaya tidak menghalangi kuliah",
    ringkas: KIP.ringkas,
    sasaran: [...KIP.sasaran],
    manfaat: KIP.manfaat.map((m) => ({ ...m })),
  },
  alur: {
    judul: "Lima langkah, semuanya dari HP atau komputer",
    langkah: [
      { judul: "Buat akun", isi: "Daftar dengan email aktif, lalu buka tautan verifikasi yang dikirim ke email Anda." },
      { judul: "Isi formulir", isi: "Data diri, keluarga, ekonomi orang tua, sekolah, dan pilihan jurusan, dipandu di setiap kolom." },
      { judul: "Unggah berkas", isi: "Ijazah, Akta Kelahiran, KK, KTP, Surat Permohonan kepada Direktur, dan Surat Keterangan Kebutuhan Ekonomi." },
      { judul: "Kirim pendaftaran", isi: "Periksa ringkasan, lalu kirim dengan sekali klik." },
      { judul: "Pantau status", isi: "Lihat catatan admin, riwayat, dan hasil akhir seleksi kapan saja." },
    ],
  },
  kampus: { ringkas: KAMPUS.ringkas, alamat: KAMPUS.alamat },
});

const teks = (v: unknown, d: string) => (typeof v === "string" && v.trim() ? v : d);
const daftar = (v: unknown, d: string[]) => (Array.isArray(v) && v.length && v.every((x) => typeof x === "string") ? (v as string[]) : d);
const pasangan = (v: unknown, d: { judul: string; isi: string }[]) =>
  Array.isArray(v) && v.length && v.every((x) => x && typeof x.judul === "string" && typeof x.isi === "string") ? (v as { judul: string; isi: string }[]) : d;

/** Menggabungkan data tersimpan dengan bawaan; bagian yang rusak/hilang memakai bawaan agar landing page tidak pernah kosong. */
function gabung(mentah: unknown): LandingKonten {
  const b = landingBawaan();
  const m = (mentah && typeof mentah === "object" ? mentah : {}) as Record<string, Record<string, unknown> | undefined>;
  const x = (k: string) => m[k] ?? {};
  return {
    banner: { aktif: x("banner").aktif === true, teks: typeof x("banner").teks === "string" ? (x("banner").teks as string) : "" },
    hero: { judul: teks(x("hero").judul, b.hero.judul), sorot: typeof x("hero").sorot === "string" ? (x("hero").sorot as string) : b.hero.sorot, deskripsi: teks(x("hero").deskripsi, b.hero.deskripsi) },
    syarat: { judul: teks(x("syarat").judul, b.syarat.judul), item: daftar(x("syarat").item, b.syarat.item) },
    berkas: { judul: teks(x("berkas").judul, b.berkas.judul), item: daftar(x("berkas").item, b.berkas.item), catatan: typeof x("berkas").catatan === "string" ? (x("berkas").catatan as string) : b.berkas.catatan },
    kip: { judul: teks(x("kip").judul, b.kip.judul), ringkas: teks(x("kip").ringkas, b.kip.ringkas), sasaran: daftar(x("kip").sasaran, b.kip.sasaran), manfaat: pasangan(x("kip").manfaat, b.kip.manfaat) },
    alur: { judul: teks(x("alur").judul, b.alur.judul), langkah: pasangan(x("alur").langkah, b.alur.langkah) },
    kampus: { ringkas: teks(x("kampus").ringkas, b.kampus.ringkas), alamat: teks(x("kampus").alamat, b.kampus.alamat) },
  };
}

/** Isi landing page saat ini; bila belum pernah diubah atau database tidak bisa diakses, memakai bawaan. */
export async function ambilLanding(): Promise<{ konten: LandingKonten; diubah: boolean }> {
  try {
    const db = await getDb();
    const [row] = await db.select().from(pengaturan).where(eq(pengaturan.kunci, KUNCI_LANDING));
    if (!row) return { konten: landingBawaan(), diubah: false };
    return { konten: gabung(JSON.parse(row.nilai)), diubah: true };
  } catch {
    return { konten: landingBawaan(), diubah: false };
  }
}
