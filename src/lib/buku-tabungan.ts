import "server-only";
import { and, asc, desc, eq, isNull, like, notExists, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { bukuTabungan, dataDiri, jurusan, pendaftaran, pengumumanMahasiswa, users } from "@/db/schema";
import { angkatanSql } from "./angkatan";
import { parseTahun } from "./tahun";

/** Buku tabungan wajib bagi mahasiswa angkatan ini dan sesudahnya. */
export const ANGKATAN_BUKU_TABUNGAN = 2026;
export const MAX_BUKU_TABUNGAN_MB = 1;
export const JENIS_PENGUMUMAN_BT = "buku_tabungan";
export const PER_HALAMAN_BT = 25;

/** Mahasiswa (diterima) angkatan 2026 ke atas. Butuh join users. */
const syaratWajib = () => and(eq(pendaftaran.status, "diterima"), eq(pendaftaran.hasil, "diterima"), sql`${angkatanSql} >= ${ANGKATAN_BUKU_TABUNGAN}`)!;

/** True bila pendaftaran ini sudah mahasiswa dan termasuk angkatan yang wajib mengisi buku tabungan. */
export async function wajibBukuTabungan(pendaftaranId: string) {
  const db = await getDb();
  const [r] = await db
    .select({ id: pendaftaran.id })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .where(and(eq(pendaftaran.id, pendaftaranId), syaratWajib()));
  return !!r;
}

export async function bukuTabunganSaya(pendaftaranId: string) {
  const db = await getDb();
  const [r] = await db.select().from(bukuTabungan).where(eq(bukuTabungan.pendaftaranId, pendaftaranId));
  return r ?? null;
}

export type FilterBukuTabungan = { q?: string; jurusan?: string; angkatan?: string; page?: string };

const namaMhs = sql<string>`coalesce(${dataDiri.namaLengkap}, ${users.nama})`;

function syaratFilter(f: FilterBukuTabungan): SQL[] {
  const c: SQL[] = [syaratWajib()];
  if (f.jurusan) c.push(eq(pendaftaran.jurusanDiterimaId, f.jurusan));
  const angkatan = parseTahun(f.angkatan);
  if (angkatan) c.push(sql`${angkatanSql} = ${angkatan}`);
  const q = f.q?.trim();
  if (q) {
    const pola = `%${q}%`;
    c.push(or(like(dataDiri.namaLengkap, pola), like(users.nama, pola), like(pendaftaran.nim, pola), like(bukuTabungan.noRekening, pola))!);
  }
  return c;
}

/**
 * `sudah`: mahasiswa yang sudah mengirim (terbaru dulu). `belum`: mahasiswa aktif yang belum mengirim (urut nama).
 * Yang lulus, dicabut, atau tidak aktif tidak dihitung sebagai "belum". `semua` = tanpa halaman (untuk ekspor).
 */
export async function daftarBukuTabungan(tab: "sudah" | "belum", f: FilterBukuTabungan, semua = false) {
  const db = await getDb();
  const c = syaratFilter(f);
  if (tab === "sudah") c.push(sql`${bukuTabungan.id} is not null`);
  else c.push(sql`${bukuTabungan.id} is null`, eq(pendaftaran.statusMahasiswa, "aktif"));
  const where = and(...c);
  const halaman = Math.max(1, Number(f.page) || 1);
  const dasar = () =>
    db
      .select({
        id: pendaftaran.id,
        nama: namaMhs,
        email: users.email,
        kontak: dataDiri.kontak,
        nim: pendaftaran.nim,
        kelas: pendaftaran.kelas,
        jurusan: jurusan.nama,
        angkatan: angkatanSql,
        btId: bukuTabungan.id,
        noRekening: bukuTabungan.noRekening,
        mimeType: bukuTabungan.mimeType,
        fileUrl: bukuTabungan.fileUrl,
        dikirim: bukuTabungan.createdAt,
      })
      .from(pendaftaran)
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(jurusan, eq(jurusan.id, pendaftaran.jurusanDiterimaId))
      .leftJoin(bukuTabungan, eq(bukuTabungan.pendaftaranId, pendaftaran.id))
      .where(where);
  const urut = tab === "sudah" ? desc(bukuTabungan.createdAt) : asc(namaMhs);
  if (semua) return { rows: await dasar().orderBy(urut), total: 0, halaman: 1 };
  const [rows, [{ total }]] = await Promise.all([
    dasar()
      .orderBy(urut)
      .limit(PER_HALAMAN_BT)
      .offset((halaman - 1) * PER_HALAMAN_BT),
    db
      .select({ total: sql<number>`count(*)` })
      .from(pendaftaran)
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(bukuTabungan, eq(bukuTabungan.pendaftaranId, pendaftaran.id))
      .where(where),
  ]);
  return { rows, total: Number(total), halaman };
}

/** Jumlah mahasiswa wajib (aktif) yang sudah dan belum mengirim. */
export async function ringkasanBukuTabungan() {
  const db = await getDb();
  const [r] = await db
    .select({
      sudah: sql<number>`sum(${bukuTabungan.id} is not null)`,
      belum: sql<number>`sum(${bukuTabungan.id} is null and ${pendaftaran.statusMahasiswa} = 'aktif')`,
    })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .leftJoin(bukuTabungan, eq(bukuTabungan.pendaftaranId, pendaftaran.id))
    .where(syaratWajib());
  return { sudah: Number(r?.sudah ?? 0), belum: Number(r?.belum ?? 0) };
}

export async function daftarPengumumanBukuTabungan() {
  const db = await getDb();
  return db.select().from(pengumumanMahasiswa).where(eq(pengumumanMahasiswa.jenis, JENIS_PENGUMUMAN_BT)).orderBy(desc(pengumumanMahasiswa.createdAt)).limit(30);
}

/** Syarat SQL pengumuman untuk satu mahasiswa: pengumuman buku tabungan tampil hanya bila ia wajib dan belum mengirim. */
export async function syaratPengumumanBt(pendaftaranId: string) {
  const db = await getDb();
  if (!(await wajibBukuTabungan(pendaftaranId))) return isNull(pengumumanMahasiswa.jenis);
  const sudah = db.select({ x: sql`1` }).from(bukuTabungan).where(eq(bukuTabungan.pendaftaranId, pendaftaranId));
  return or(isNull(pengumumanMahasiswa.jenis), and(eq(pengumumanMahasiswa.jenis, JENIS_PENGUMUMAN_BT), notExists(sudah)));
}
