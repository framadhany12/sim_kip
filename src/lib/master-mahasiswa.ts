import "server-only";
import { and, asc, eq, gte, like, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { dataDiri, jenisBeasiswa, jurusan, pendaftaran, users } from "@/db/schema";
import { parseTahun, rentangTahun } from "./tahun";

export type FilterMasterMhs = { q?: string; jurusan?: string; tahun?: string; nim?: string; page?: string };
export const PER_HALAMAN_MASTER = 25;

/** Mahasiswa = pendaftar yang sudah diterima (status & hasil Diterima), lengkap dengan NIM dan kelas. */
export async function daftarMasterMahasiswa(f: FilterMasterMhs) {
  const db = await getDb();
  const c = [eq(pendaftaran.status, "diterima"), eq(pendaftaran.hasil, "diterima")];
  if (f.jurusan) c.push(eq(pendaftaran.jurusanDiterimaId, f.jurusan));
  const tahun = parseTahun(f.tahun);
  if (tahun) {
    const { dari, sampai } = rentangTahun(tahun);
    c.push(gte(users.createdAt, dari), lt(users.createdAt, sampai));
  }
  if (f.nim === "sudah") c.push(sql`${pendaftaran.nim} is not null`);
  if (f.nim === "belum") c.push(sql`${pendaftaran.nim} is null`);
  const q = f.q?.trim();
  if (q) {
    const pola = `%${q}%`;
    c.push(or(like(dataDiri.namaLengkap, pola), like(users.nama, pola), like(users.email, pola), like(dataDiri.nik, pola), like(pendaftaran.nim, pola), like(pendaftaran.kelas, pola))!);
  }
  const where = and(...c);
  const halaman = Math.max(1, Number(f.page) || 1);
  const [rows, [{ total }], daftarJurusan] = await Promise.all([
    db
      .select({
        id: pendaftaran.id,
        userId: users.id,
        nama: sql<string>`coalesce(${dataDiri.namaLengkap}, ${users.nama})`,
        email: users.email,
        nik: dataDiri.nik,
        kontak: dataDiri.kontak,
        jurusan: jurusan.nama,
        beasiswa: jenisBeasiswa.nama,
        nim: pendaftaran.nim,
        kelas: pendaftaran.kelas,
      })
      .from(pendaftaran)
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(jurusan, eq(jurusan.id, pendaftaran.jurusanDiterimaId))
      .leftJoin(jenisBeasiswa, eq(jenisBeasiswa.id, pendaftaran.jenisBeasiswaId))
      .where(where)
      .orderBy(asc(sql`coalesce(${dataDiri.namaLengkap}, ${users.nama})`))
      .limit(PER_HALAMAN_MASTER)
      .offset((halaman - 1) * PER_HALAMAN_MASTER),
    db
      .select({ total: sql<number>`count(*)` })
      .from(pendaftaran)
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .where(where),
    db.select({ id: jurusan.id, nama: jurusan.nama }).from(jurusan).orderBy(asc(jurusan.nama)),
  ]);
  return { rows, total: Number(total), halaman, daftarJurusan };
}
