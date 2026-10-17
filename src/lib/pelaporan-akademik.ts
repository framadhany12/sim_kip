import "server-only";
import { and, asc, desc, eq, gte, isNull, like, lt, notExists, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { dataDiri, jurusan, laporanAkademik, pendaftaran, pengumumanMahasiswa, users } from "@/db/schema";
import { parseTahun, rentangTahun } from "./tahun";

/** `angkatan` = tahun pendaftar mendaftar (akun dibuat, WIB), sama dengan filter "Tahun daftar" di menu lain. */
export type FilterPelaporan = { q?: string; jurusan?: string; angkatan?: string; semester?: string; page?: string };
export const PER_HALAMAN_LAPORAN = 25;

const semesterValid = (s?: string) => {
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= 14 ? n : undefined;
};

/** Syarat umum mahasiswa (diterima) menurut filter jurusan, angkatan, dan pencarian. */
function syaratMahasiswa(f: FilterPelaporan): SQL[] {
  const c: SQL[] = [eq(pendaftaran.status, "diterima"), eq(pendaftaran.hasil, "diterima")];
  if (f.jurusan) c.push(eq(pendaftaran.jurusanDiterimaId, f.jurusan));
  const angkatan = parseTahun(f.angkatan);
  if (angkatan) {
    const { dari, sampai } = rentangTahun(angkatan);
    c.push(gte(users.createdAt, dari), lt(users.createdAt, sampai));
  }
  const q = f.q?.trim();
  if (q) {
    const pola = `%${q}%`;
    c.push(or(like(dataDiri.namaLengkap, pola), like(users.nama, pola), like(pendaftaran.nim, pola), like(pendaftaran.kelas, pola))!);
  }
  return c;
}

const namaMhs = sql<string>`coalesce(${dataDiri.namaLengkap}, ${users.nama})`;
const angkatanMhs = sql<number>`year(date_add(${users.createdAt}, interval 7 hour))`;

/** Laporan IPK & transkrip, terbaru dulu. `semua` = tanpa paginasi (untuk ekspor). */
export async function daftarPelaporan(f: FilterPelaporan, semua = false) {
  const db = await getDb();
  const c = syaratMahasiswa(f);
  const semester = semesterValid(f.semester);
  if (semester) c.push(eq(laporanAkademik.semester, semester));
  const where = and(...c);
  const halaman = Math.max(1, Number(f.page) || 1);
  const dasar = () =>
    db
      .select({
        id: laporanAkademik.id,
        nama: namaMhs,
        nim: pendaftaran.nim,
        kelas: pendaftaran.kelas,
        jurusan: jurusan.nama,
        angkatan: angkatanMhs,
        semester: laporanAkademik.semester,
        ipk: laporanAkademik.ipk,
        namaAsli: laporanAkademik.namaAsli,
        diperbarui: laporanAkademik.updatedAt,
      })
      .from(laporanAkademik)
      .innerJoin(pendaftaran, eq(pendaftaran.id, laporanAkademik.pendaftaranId))
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(jurusan, eq(jurusan.id, pendaftaran.jurusanDiterimaId))
      .where(where)
      .orderBy(desc(laporanAkademik.updatedAt));
  if (semua) return { rows: await dasar(), total: 0, halaman: 1 };
  const [rows, [{ total }]] = await Promise.all([
    dasar().limit(PER_HALAMAN_LAPORAN).offset((halaman - 1) * PER_HALAMAN_LAPORAN),
    db
      .select({ total: sql<number>`count(*)` })
      .from(laporanAkademik)
      .innerJoin(pendaftaran, eq(pendaftaran.id, laporanAkademik.pendaftaranId))
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .where(where),
  ]);
  return { rows, total: Number(total), halaman };
}

/** Mahasiswa yang belum melaporkan IPK untuk `semester` (wajib), urut nama. */
export async function daftarBelumMelapor(f: FilterPelaporan, semua = false) {
  const db = await getDb();
  const semester = semesterValid(f.semester) ?? 1;
  const belum = notExists(
    db
      .select({ x: sql`1` })
      .from(laporanAkademik)
      .where(and(eq(laporanAkademik.pendaftaranId, pendaftaran.id), eq(laporanAkademik.semester, semester))),
  );
  const where = and(...syaratMahasiswa(f), belum);
  const halaman = Math.max(1, Number(f.page) || 1);
  const dasar = () =>
    db
      .select({
        id: pendaftaran.id,
        nama: namaMhs,
        nim: pendaftaran.nim,
        kelas: pendaftaran.kelas,
        jurusan: jurusan.nama,
        angkatan: angkatanMhs,
        kontak: dataDiri.kontak,
        email: users.email,
      })
      .from(pendaftaran)
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(jurusan, eq(jurusan.id, pendaftaran.jurusanDiterimaId))
      .where(where)
      .orderBy(asc(namaMhs));
  if (semua) return { rows: await dasar(), total: 0, halaman: 1, semester };
  const [rows, [{ total }]] = await Promise.all([
    dasar().limit(PER_HALAMAN_LAPORAN).offset((halaman - 1) * PER_HALAMAN_LAPORAN),
    db
      .select({ total: sql<number>`count(*)` })
      .from(pendaftaran)
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .where(where),
  ]);
  return { rows, total: Number(total), halaman, semester };
}

export async function daftarJurusanFilter() {
  const db = await getDb();
  return db.select({ id: jurusan.id, nama: jurusan.nama }).from(jurusan).orderBy(asc(jurusan.nama));
}

/** Pengumuman mahasiswa (terbaru dulu) beserta jumlah mahasiswa yang belum melapor untuk semester terkait. */
export async function daftarPengumumanMahasiswa() {
  const db = await getDb();
  const rows = await db.select().from(pengumumanMahasiswa).orderBy(desc(pengumumanMahasiswa.createdAt)).limit(30);
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(pendaftaran)
    .where(and(eq(pendaftaran.status, "diterima"), eq(pendaftaran.hasil, "diterima")));
  const hasil = [];
  for (const r of rows) {
    let belum: number | null = null;
    if (r.semester) {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)` })
        .from(laporanAkademik)
        .innerJoin(pendaftaran, eq(pendaftaran.id, laporanAkademik.pendaftaranId))
        .where(and(eq(laporanAkademik.semester, r.semester), eq(pendaftaran.status, "diterima"), eq(pendaftaran.hasil, "diterima")));
      belum = Math.max(0, Number(total) - Number(n));
    }
    hasil.push({ ...r, belum });
  }
  return hasil;
}

/** Pengumuman aktif yang masih relevan bagi satu mahasiswa: semester terkait belum dilaporkannya. */
export async function pengumumanUntukMahasiswa(pendaftaranId: string) {
  const db = await getDb();
  const sudah = db
    .select({ x: sql`1` })
    .from(laporanAkademik)
    .where(and(eq(laporanAkademik.pendaftaranId, pendaftaranId), eq(laporanAkademik.semester, pengumumanMahasiswa.semester)));
  return db
    .select()
    .from(pengumumanMahasiswa)
    .where(and(eq(pengumumanMahasiswa.aktif, true), or(isNull(pengumumanMahasiswa.semester), notExists(sudah))))
    .orderBy(desc(pengumumanMahasiswa.createdAt))
    .limit(5);
}
