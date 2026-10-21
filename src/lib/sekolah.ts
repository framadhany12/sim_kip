import "server-only";
import { and, asc, like, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { sekolah } from "@/db/schema";

export type HasilSekolah = { npsn: string; nama: string; kota: string | null };

/** Nama sekolah dianggap sama bila hanya beda huruf besar/kecil dan spasi. */
export const samaNama = (a: string, b: string) => a.replace(/\s+/g, " ").trim().toLowerCase() === b.replace(/\s+/g, " ").trim().toLowerCase();

/** Singkatan yang disamakan agar "SMA Negeri 1" menemukan "SMAN 1" dan sebaliknya. */
const SINGKATAN: Record<string, string> = { sman: "sma negeri", smkn: "smk negeri", smas: "sma swasta", smks: "smk swasta", kab: "kabupaten" };

/**
 * Teks pencarian sekolah (kolom `kata_cari`), juga dipakai untuk menormalkan kata yang dicari.
 * Harus sama dengan backfill SQL di drizzle/0019 dan scripts/impor-sekolah.mjs.
 */
export function kataCariSekolah(nama: string, kota?: string | null) {
  return [nama, kota ?? ""]
    .join(" ")
    .toLowerCase()
    .split(/[-.,/()\s]+/)
    .filter(Boolean)
    .map((k) => SINGKATAN[k] ?? k)
    .join(" ")
    .slice(0, 300);
}

const pola = (k: string) => k.replace(/[%_\\]/g, "\\$&");

/**
 * Syarat pencarian teks: semua kata harus ada di nama/kota. Kata berupa angka harus utuh
 * agar "SMAN 3" tidak ikut menemukan "SMAN 13".
 */
export function syaratCariSekolah(q: string): SQL | undefined {
  const kata = kataCariSekolah(q).split(" ").filter(Boolean).slice(0, 8);
  if (!kata.length) return undefined;
  return and(
    ...kata.map((k) => (/^\d+$/.test(k) ? sql`concat(' ', ${sekolah.kataCari}, ' ') like ${`% ${k} %`}` : like(sekolah.kataCari, `%${pola(k)}%`))),
  );
}

/** Cari di master sekolah: angka saja dicocokkan ke awal NPSN; selain itu per kata (lihat `syaratCariSekolah`). */
export async function cariSekolah(q: string, batas = 20): Promise<HasilSekolah[]> {
  const kata = q.trim();
  if (kata.length < 2) return [];
  const db = await getDb();
  const awalan = kataCariSekolah(kata);
  return db
    .select({ npsn: sekolah.npsn, nama: sekolah.nama, kota: sekolah.kota })
    .from(sekolah)
    .where(/^\d+$/.test(kata) ? like(sekolah.npsn, `${kata}%`) : syaratCariSekolah(kata))
    // Yang diawali kata yang dicari tampil lebih dulu.
    .orderBy(sql`${sekolah.kataCari} like ${`${pola(awalan)}%`} desc`, asc(sekolah.nama))
    .limit(batas);
}
