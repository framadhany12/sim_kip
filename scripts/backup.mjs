// Membuat cadangan lengkap database (struktur + data) ke database/backup/<nama>-<waktu>.sql dengan mysqldump.
// Pemakaian: npm run db:backup
// File hasilnya bisa diimpor ke server MySQL/MariaDB lain (mis. lewat phpMyAdmin → Import).
// PERHATIAN: berisi data pribadi pendaftar — simpan dengan aman; folder ini tidak di-commit ke git.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { databaseUrl } from "./db.mjs";

const url = new URL(databaseUrl());
const nama = decodeURIComponent(url.pathname.slice(1));

// Cari mysqldump: PATH, lalu lokasi umum XAMPP/MySQL di Windows.
const kandidat = [
  process.env.MYSQLDUMP,
  "C:\\xampp\\mysql\\bin\\mysqldump.exe",
  "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
  "C:\\Program Files\\MariaDB 10.4\\bin\\mysqldump.exe",
].filter(Boolean);
const mysqldump = kandidat.find((p) => fs.existsSync(p)) ?? "mysqldump";

const dir = path.join(process.cwd(), "database", "backup");
fs.mkdirSync(dir, { recursive: true });
// Waktu lokal komputer (mis. WIB), format YYYY-MM-DD-HHmm.
const d = new Date();
const dua = (n) => String(n).padStart(2, "0");
const waktu = `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}-${dua(d.getHours())}${dua(d.getMinutes())}`;
const file = path.join(dir, `${nama}-${waktu}.sql`);

const args = [
  `--host=${url.hostname}`,
  `--port=${url.port || 3306}`,
  `--user=${decodeURIComponent(url.username)}`,
  "--single-transaction",
  "--routines",
  "--default-character-set=utf8mb4",
  "--databases",
  nama,
];
const env = { ...process.env, ...(url.password ? { MYSQL_PWD: decodeURIComponent(url.password) } : {}) };
const out = fs.createWriteStream(file);
const p = spawn(mysqldump, args, { env });
p.stdout.pipe(out);
p.stderr.on("data", (d) => process.stderr.write(d));
p.on("error", (e) => {
  console.error(`Gagal menjalankan mysqldump (${mysqldump}): ${e.message}. Atur variabel MYSQLDUMP ke lokasi mysqldump.exe.`);
  process.exit(1);
});
p.on("close", (code) => {
  if (code !== 0) {
    console.error(`mysqldump berhenti dengan kode ${code}.`);
    process.exit(code ?? 1);
  }
  console.log(`Cadangan tersimpan: ${path.relative(process.cwd(), file)} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
});
