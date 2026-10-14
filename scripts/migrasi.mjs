// Menerapkan semua migrasi (folder drizzle/) ke database MySQL di DATABASE_URL, tanpa menjalankan aplikasi.
// Pemakaian: npm run db:migrate
// Aman dijalankan berulang: migrasi yang sudah diterapkan dilewati.
import fs from "node:fs";
import path from "node:path";
import { bukaDatabase } from "./db.mjs";

const jurnal = JSON.parse(fs.readFileSync(path.join(process.cwd(), "drizzle", "meta", "_journal.json"), "utf8"));
const { conn, nama, host } = await bukaDatabase(); // membuat database bila belum ada + menjalankan migrasi
const [rows] = await conn.query("SELECT COUNT(*) AS n FROM __drizzle_migrations");
const [tabel] = await conn.query("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ?", [nama]);
console.log(`Database : ${host}/${nama}`);
console.log(`Migrasi  : ${rows[0].n} dari ${jurnal.entries.length} diterapkan`);
for (const e of jurnal.entries) console.log(`  ✓ ${e.tag}`);
console.log(`Tabel    : ${tabel[0].n}`);
await conn.end();
