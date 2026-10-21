import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { tahunAjaran, users } from "@/db/schema";
import { tahunBerjalan } from "./tahun";

/** Tahun-tahun yang ada datanya (menurut waktu akun dibuat, WIB) beserta jumlah pendaftarnya. */
export async function jumlahPendaftarPerTahun() {
  const db = await getDb();
  const rows = await db
    .select({ tahun: sql<number>`year(date_add(${users.createdAt}, interval 7 hour))`, jumlah: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.role, "pendaftar"), eq(users.mahasiswaLama, false)))
    .groupBy(sql`year(date_add(${users.createdAt}, interval 7 hour))`);
  return new Map(rows.map((r) => [Number(r.tahun), Number(r.jumlah)]));
}

/**
 * Pilihan "Tahun daftar" di panel admin (terurut naik): tahun ajaran yang ditambahkan admin, ditambah tahun berjalan
 * dan tahun yang sudah punya data, supaya tidak ada data yang tidak bisa difilter.
 */
export async function daftarPilihanTahun(): Promise<number[]> {
  const db = await getDb();
  const [terdaftar, perTahun] = await Promise.all([db.select({ tahun: tahunAjaran.tahun }).from(tahunAjaran), jumlahPendaftarPerTahun()]);
  const semua = new Set<number>([tahunBerjalan(), ...terdaftar.map((t) => t.tahun), ...perTahun.keys()]);
  return [...semua].sort((a, b) => a - b);
}
