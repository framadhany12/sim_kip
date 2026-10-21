import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { pendaftaran, users } from "@/db/schema";
import { tahunBerjalan } from "./tahun";

/** Angkatan mahasiswa: kolom `angkatan` (mahasiswa lama hasil impor), selain itu tahun akun dibuat (WIB). Butuh join users. */
export const angkatanSql = sql<number>`coalesce(${pendaftaran.angkatan}, year(date_add(${users.createdAt}, interval 7 hour)))`;

/** Pilihan filter angkatan: semua angkatan yang punya mahasiswa, ditambah tahun berjalan. */
export async function daftarAngkatan(): Promise<number[]> {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ a: angkatanSql })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .where(and(eq(pendaftaran.status, "diterima"), eq(pendaftaran.hasil, "diterima")));
  return [...new Set([tahunBerjalan(), ...rows.map((r) => Number(r.a))])].sort((a, b) => a - b);
}
