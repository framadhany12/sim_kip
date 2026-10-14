// Koneksi MySQL bersama untuk skrip CLI (buat-admin, migrasi data).
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

export const DEFAULT_DATABASE_URL = "mysql://root@127.0.0.1:3306/kip_kuliah";

/** Baca DATABASE_URL dari environment atau .env.local / .env (tanpa dependensi tambahan). */
export function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const f of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, "utf8").match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
    if (m) return m[1].trim();
  }
  return DEFAULT_DATABASE_URL;
}

/** Buat database bila belum ada, jalankan migrasi, lalu kembalikan koneksi siap pakai. */
export async function bukaDatabase() {
  const url = new URL(databaseUrl());
  const nama = decodeURIComponent(url.pathname.slice(1));
  if (!/^[A-Za-z0-9_]+$/.test(nama)) throw new Error(`Nama database tidak valid: "${nama}"`);
  const opsi = { host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password) };
  const awal = await mysql.createConnection(opsi);
  await awal.query(`CREATE DATABASE IF NOT EXISTS \`${nama}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await awal.end();
  const conn = await mysql.createConnection({ ...opsi, database: nama, charset: "utf8mb4_unicode_ci", timezone: "Z" });
  await migrate(drizzle(conn), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return { conn, nama, host: `${opsi.host}:${opsi.port}` };
}
