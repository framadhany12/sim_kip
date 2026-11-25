import "server-only";
import { and, asc, desc, eq, isNull, like, notExists, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { dataDiri, jurusan, laporanAkademik, pendaftaran, pengumumanMahasiswa, users } from "@/db/schema";
import { angkatanPendaftaran, angkatanSql } from "./angkatan";
import { syaratPengumumanBt } from "./buku-tabungan";
import { parseTahun } from "./tahun";

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
    c.push(sql`${angkatanSql} = ${angkatan}`);
  }
  const q = f.q?.trim();
  if (q) {
    const pola = `%${q}%`;
    c.push(or(like(dataDiri.namaLengkap, pola), like(users.nama, pola), like(pendaftaran.nim, pola), like(pendaftaran.kelas, pola))!);
  }
  return c;
}

const namaMhs = sql<string>`coalesce(${dataDiri.namaLengkap}, ${users.nama})`;
const angkatanMhs = angkatanSql;

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
  // Hanya mahasiswa aktif yang wajib melapor; yang lulus/dicabut/tidak aktif tidak ditagih.
  const where = and(...syaratMahasiswa(f), eq(pendaftaran.statusMahasiswa, "aktif"), belum);
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

const syaratAktif = () => and(eq(pendaftaran.status, "diterima"), eq(pendaftaran.hasil, "diterima"), eq(pendaftaran.statusMahasiswa, "aktif"))!;

/** Mahasiswa aktif per angkatan, beserta jumlah yang sudah melapor tiap semester. Untuk sasaran dan hitungan pengumuman. */
export async function ringkasPerAngkatan() {
  const db = await getDb();
  const [total, sudah] = await Promise.all([
    db
      .select({ angkatan: angkatanSql, n: sql<number>`count(*)` })
      .from(pendaftaran)
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .where(syaratAktif())
      .groupBy(angkatanSql),
    db
      .select({ angkatan: angkatanSql, semester: laporanAkademik.semester, n: sql<number>`count(*)` })
      .from(laporanAkademik)
      .innerJoin(pendaftaran, eq(pendaftaran.id, laporanAkademik.pendaftaranId))
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .where(syaratAktif())
      .groupBy(angkatanSql, laporanAkademik.semester),
  ]);
  return total
    .map((t) => {
      const angkatan = Number(t.angkatan);
      const perSemester: Record<number, number> = {};
      for (const r of sudah) if (Number(r.angkatan) === angkatan) perSemester[r.semester] = Number(r.n);
      return { angkatan, total: Number(t.n), sudah: perSemester };
    })
    .sort((x, y) => x.angkatan - y.angkatan);
}

/** Pengumuman mahasiswa (terbaru dulu) beserta jumlah mahasiswa sasaran yang belum melapor untuk semester terkait. */
export async function daftarPengumumanMahasiswa() {
  const db = await getDb();
  // Pengumuman buku tabungan dikelola di menu Buku Tabungan.
  const [rows, perAngkatan] = await Promise.all([
    db
      .select()
      .from(pengumumanMahasiswa)
      .where(and(isNull(pengumumanMahasiswa.jenis), isNull(pengumumanMahasiswa.pendaftaranId)))
      .orderBy(desc(pengumumanMahasiswa.createdAt))
      .limit(30),
    ringkasPerAngkatan(),
  ]);
  return rows.map((r) => {
    if (!r.semester) return { ...r, belum: null as number | null };
    const sasaran = r.angkatanSasaran ? new Set(r.angkatanSasaran.split(",").map(Number)) : null;
    const belum = perAngkatan.filter((a) => !sasaran || sasaran.has(a.angkatan)).reduce((n, a) => n + Math.max(0, a.total - (a.sudah[r.semester!] ?? 0)), 0);
    return { ...r, belum };
  });
}

/**
 * Pengumuman aktif yang masih relevan bagi satu mahasiswa: semester terkait belum dilaporkannya, dan buku tabungan (bila wajib) belum dikirimnya.
 * Termasuk pesan pribadi (`pendaftaranId` terisi), mis. catatan admin saat menghapus laporan IPK yang keliru.
 */
export async function pengumumanUntukMahasiswa(pendaftaranId: string) {
  const db = await getDb();
  const angkatan = await angkatanPendaftaran(pendaftaranId);
  // Sasaran angkatan kosong = semua angkatan; pesan pribadi tidak punya sasaran.
  const sasaran = angkatan === null ? isNull(pengumumanMahasiswa.angkatanSasaran) : or(isNull(pengumumanMahasiswa.angkatanSasaran), sql`find_in_set(${angkatan}, ${pengumumanMahasiswa.angkatanSasaran}) > 0`);
  const sudah = db
    .select({ x: sql`1` })
    .from(laporanAkademik)
    .where(and(eq(laporanAkademik.pendaftaranId, pendaftaranId), eq(laporanAkademik.semester, pengumumanMahasiswa.semester)));
  return db
    .select()
    .from(pengumumanMahasiswa)
    .where(
      and(
        eq(pengumumanMahasiswa.aktif, true),
        or(isNull(pengumumanMahasiswa.pendaftaranId), eq(pengumumanMahasiswa.pendaftaranId, pendaftaranId)),
        or(isNull(pengumumanMahasiswa.semester), notExists(sudah)),
        sasaran,
        await syaratPengumumanBt(pendaftaranId),
      ),
    )
    .orderBy(desc(pengumumanMahasiswa.createdAt))
    .limit(5);
}

/** "1,2,3" → "Semester 1–3"; bila tidak berurutan → "Semester 1, 3, 4". */
export function ringkasSemester(daftar: string | null) {
  const s = (daftar ?? "")
    .split(",")
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  if (s.length === 0) return "—";
  if (s.length === 1) return `Semester ${s[0]}`;
  const berurutan = s.every((n, i) => i === 0 || n === s[i - 1] + 1);
  return berurutan ? `Semester ${s[0]}–${s[s.length - 1]}` : `Semester ${s.join(", ")}`;
}

/**
 * Mahasiswa yang sudah pernah melapor, satu baris per mahasiswa (tanpa IPK; IPK ada di halaman detail).
 * Filter semester = hanya yang sudah melaporkan semester itu.
 */
export async function daftarMahasiswaMelapor(f: FilterPelaporan) {
  const db = await getDb();
  const c = syaratMahasiswa(f);
  const semester = semesterValid(f.semester);
  if (semester) c.push(sql`exists (select 1 from laporan_akademik x where x.pendaftaran_id = ${pendaftaran.id} and x.semester = ${semester})`);
  const where = and(...c);
  const halaman = Math.max(1, Number(f.page) || 1);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: pendaftaran.id,
        nama: namaMhs,
        nim: pendaftaran.nim,
        kelas: pendaftaran.kelas,
        jurusan: jurusan.nama,
        angkatan: angkatanMhs,
        semesterDilaporkan: sql<string>`group_concat(distinct ${laporanAkademik.semester} order by ${laporanAkademik.semester})`,
        terakhir: sql<Date>`max(${laporanAkademik.updatedAt})`,
      })
      .from(pendaftaran)
      .innerJoin(laporanAkademik, eq(laporanAkademik.pendaftaranId, pendaftaran.id))
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(jurusan, eq(jurusan.id, pendaftaran.jurusanDiterimaId))
      .where(where)
      .groupBy(pendaftaran.id, namaMhs, pendaftaran.nim, pendaftaran.kelas, jurusan.nama, angkatanMhs)
      .orderBy(asc(namaMhs))
      .limit(PER_HALAMAN_LAPORAN)
      .offset((halaman - 1) * PER_HALAMAN_LAPORAN),
    db
      .select({ total: sql<number>`count(distinct ${pendaftaran.id})` })
      .from(pendaftaran)
      .innerJoin(laporanAkademik, eq(laporanAkademik.pendaftaranId, pendaftaran.id))
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .where(where),
  ]);
  return { rows, total: Number(total), halaman };
}

/** Identitas satu mahasiswa beserta seluruh laporan IPK-nya, urut semester. null bila bukan mahasiswa. */
export async function detailPelaporanMahasiswa(pendaftaranId: string) {
  const db = await getDb();
  const [m] = await db
    .select({
      id: pendaftaran.id,
      nama: namaMhs,
      email: users.email,
      nim: pendaftaran.nim,
      kelas: pendaftaran.kelas,
      jurusan: jurusan.nama,
      angkatan: angkatanMhs,
      kontak: dataDiri.kontak,
    })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
    .leftJoin(jurusan, eq(jurusan.id, pendaftaran.jurusanDiterimaId))
    .where(and(eq(pendaftaran.id, pendaftaranId), eq(pendaftaran.status, "diterima"), eq(pendaftaran.hasil, "diterima")));
  if (!m) return null;
  const laporan = await db.select().from(laporanAkademik).where(eq(laporanAkademik.pendaftaranId, pendaftaranId)).orderBy(asc(laporanAkademik.semester));
  return { ...m, laporan };
}
