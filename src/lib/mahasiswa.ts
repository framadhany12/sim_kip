import "server-only";
import { and, desc, eq, gte, isNotNull, isNull, like, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { dataDiri, dataSekolah, pendaftaran, users } from "@/db/schema";
import { parseTahun, rentangTahun } from "./tahun";

export type FilterMahasiswa = { q?: string; tahun?: string; verifikasi?: string; akun?: string; page?: string };
export const PER_HALAMAN_MHS = 25;

/** Semua akun pendaftar (termasuk yang belum mengisi formulir). Bawaannya semua tahun; filter tahun memakai waktu akun dibuat (WIB). */
export async function daftarMahasiswa(f: FilterMahasiswa) {
  const db = await getDb();
  const c = [eq(users.role, "pendaftar")];
  const tahun = parseTahun(f.tahun);
  if (tahun) {
    const { dari, sampai } = rentangTahun(tahun);
    c.push(gte(users.createdAt, dari), lt(users.createdAt, sampai));
  }
  if (f.verifikasi === "terverifikasi") c.push(isNotNull(users.emailVerifiedAt));
  if (f.verifikasi === "belum") c.push(isNull(users.emailVerifiedAt));
  if (f.akun === "aktif") c.push(eq(users.aktif, true));
  if (f.akun === "nonaktif") c.push(eq(users.aktif, false));
  const q = f.q?.trim();
  if (q) {
    const pola = `%${q}%`;
    c.push(
      or(
        like(users.nama, pola),
        like(users.email, pola),
        like(dataDiri.namaLengkap, pola),
        like(dataDiri.nik, pola),
        like(dataDiri.nisn, pola),
        like(dataDiri.nomorPendaftaranKip, pola),
        like(dataSekolah.namaSekolah, pola),
      )!,
    );
  }
  const where = and(...c);
  // Satu baris per akun: yang diambil adalah pendaftaran terbarunya.
  const terbaru = sql`${pendaftaran.id} = (select p2.id from pendaftaran p2 where p2.user_id = ${users.id} order by p2.created_at desc limit 1)`;
  const halaman = Math.max(1, Number(f.page) || 1);

  const dasar = () =>
    db
      .select({
        id: users.id,
        nama: users.nama,
        email: users.email,
        terverifikasi: users.emailVerifiedAt,
        aktif: users.aktif,
        daftarPada: users.createdAt,
        pendaftaranId: pendaftaran.id,
        status: pendaftaran.status,
        tahap: pendaftaran.tahap,
        namaLengkap: dataDiri.namaLengkap,
        nomorKip: dataDiri.nomorPendaftaranKip,
        nik: dataDiri.nik,
        nisn: dataDiri.nisn,
        sekolah: dataSekolah.namaSekolah,
      })
      .from(users)
      .leftJoin(pendaftaran, terbaru)
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(dataSekolah, eq(dataSekolah.pendaftaranId, pendaftaran.id))
      .where(where);

  const [rows, [{ total }]] = await Promise.all([
    dasar()
      .orderBy(desc(users.createdAt))
      .limit(PER_HALAMAN_MHS)
      .offset((halaman - 1) * PER_HALAMAN_MHS),
    db
      .select({ total: sql<number>`count(*)` })
      .from(users)
      .leftJoin(pendaftaran, terbaru)
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(dataSekolah, eq(dataSekolah.pendaftaranId, pendaftaran.id))
      .where(where),
  ]);
  return { rows, total: Number(total), halaman };
}
