import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { dataDiri, jurusan, kegiatan, pendaftaran, presensiKegiatan, users } from "@/db/schema";

/** Kode QR berganti setiap STEP_DETIK; kode jendela sebelumnya masih diterima agar pemindaian di ujung pergantian tidak gagal. */
export const STEP_DETIK = 30;
const STEP_MS = STEP_DETIK * 1000;

export const rahasiaBaru = () => randomBytes(24).toString("base64url");

const kode = (rahasia: string, jendela: number) => createHmac("sha256", rahasia).update(String(jendela)).digest("base64url").slice(0, 16);

/** Kode aktif beserta sisa waktunya (milidetik) sebelum berganti. */
export function kodeSekarang(rahasia: string, saat = Date.now()) {
  const jendela = Math.floor(saat / STEP_MS);
  return { token: kode(rahasia, jendela), sisaMs: (jendela + 1) * STEP_MS - saat };
}

export function kodeValid(rahasia: string, token: string, saat = Date.now()) {
  const jendela = Math.floor(saat / STEP_MS);
  const t = Buffer.from(token);
  return [jendela, jendela - 1].some((j) => {
    const k = Buffer.from(kode(rahasia, j));
    return k.length === t.length && timingSafeEqual(k, t);
  });
}

export type StatusKegiatan = "akan" | "berlangsung" | "selesai";
export const statusKegiatan = (k: { mulai: Date; selesai: Date }, saat = new Date()): StatusKegiatan =>
  saat < k.mulai ? "akan" : saat > k.selesai ? "selesai" : "berlangsung";

/** Waktu isian datetime-local (WIB, "YYYY-MM-DDTHH:mm") menjadi Date; null bila tidak valid. */
export function waktuWib(v: string | undefined) {
  if (!v || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00+07:00`);
  return isNaN(+d) ? null : d;
}

/** Semua kegiatan (terbaru dulu) beserta jumlah yang sudah presensi. */
export async function daftarKegiatan() {
  const db = await getDb();
  return db
    .select({
      id: kegiatan.id,
      nama: kegiatan.nama,
      deskripsi: kegiatan.deskripsi,
      lokasi: kegiatan.lokasi,
      mulai: kegiatan.mulai,
      selesai: kegiatan.selesai,
      hadir: sql<number>`(select count(*) from presensi_kegiatan p where p.kegiatan_id = ${kegiatan.id})`,
    })
    .from(kegiatan)
    .orderBy(desc(kegiatan.mulai));
}

export async function ambilKegiatan(id: string) {
  const db = await getDb();
  const [k] = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
  return k ?? null;
}

/** Rekap kehadiran satu kegiatan, urut waktu presensi. */
export async function rekapKegiatan(kegiatanId: string) {
  const db = await getDb();
  return db
    .select({
      id: presensiKegiatan.id,
      nama: sql<string>`coalesce(${dataDiri.namaLengkap}, ${users.nama})`,
      nim: pendaftaran.nim,
      kelas: pendaftaran.kelas,
      jurusan: jurusan.nama,
      waktu: presensiKegiatan.waktu,
    })
    .from(presensiKegiatan)
    .innerJoin(pendaftaran, eq(pendaftaran.id, presensiKegiatan.pendaftaranId))
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
    .leftJoin(jurusan, eq(jurusan.id, pendaftaran.jurusanDiterimaId))
    .where(eq(presensiKegiatan.kegiatanId, kegiatanId))
    .orderBy(asc(presensiKegiatan.waktu));
}

/** Kegiatan beserta status kehadiran satu mahasiswa. */
export async function kegiatanUntukMahasiswa(pendaftaranId: string) {
  const db = await getDb();
  return db
    .select({
      id: kegiatan.id,
      nama: kegiatan.nama,
      deskripsi: kegiatan.deskripsi,
      lokasi: kegiatan.lokasi,
      mulai: kegiatan.mulai,
      selesai: kegiatan.selesai,
      waktuHadir: presensiKegiatan.waktu,
    })
    .from(kegiatan)
    .leftJoin(presensiKegiatan, and(eq(presensiKegiatan.kegiatanId, kegiatan.id), eq(presensiKegiatan.pendaftaranId, pendaftaranId)))
    .orderBy(desc(kegiatan.mulai));
}
