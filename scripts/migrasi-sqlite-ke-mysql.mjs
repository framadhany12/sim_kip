// Memindahkan seluruh data dari database SQLite lama ke MySQL/MariaDB.
// Pemakaian: npm run db:migrasi-sqlite [-- path/ke/kip.db]
// Aman dijalankan ulang: baris yang sudah ada (id sama) dilewati (INSERT IGNORE).
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { bukaDatabase } from "./db.mjs";

const sumber = path.resolve(process.argv[2] ?? path.join("data", "kip.db"));
if (!fs.existsSync(sumber)) {
  console.error(`Database SQLite tidak ditemukan: ${sumber}`);
  process.exit(1);
}

// Urutan mengikuti foreign key: tabel induk lebih dulu.
const TABEL = [
  "users",
  "sessions",
  "password_resets",
  "wilayah_kabupaten",
  "wilayah_kecamatan",
  "jurusan",
  "faq",
  "pendaftaran",
  "data_diri",
  "data_keluarga",
  "ekonomi_orangtua",
  "data_sekolah",
  "pilihan_jurusan",
  "berkas",
  "riwayat_status",
  "pertanyaan",
];
// SQLite menyimpan waktu sebagai milidetik; MySQL memakai DATETIME.
const KOLOM_WAKTU = new Set(["created_at", "expires_at", "submitted_at", "updated_at", "uploaded_at", "answered_at"]);

const lite = createClient({ url: `file:${sumber}` });
const { conn, nama, host } = await bukaDatabase();
console.log(`Sumber : ${sumber}\nTujuan : ${host}/${nama}\n`);

await conn.query("SET FOREIGN_KEY_CHECKS = 0");
try {
  for (const t of TABEL) {
    const ada = await lite.execute({ sql: "select name from sqlite_master where type='table' and name=?", args: [t] });
    if (!ada.rows.length) {
      console.log(`  ${t.padEnd(20)} (tidak ada di SQLite, dilewati)`);
      continue;
    }
    const res = await lite.execute(`select * from "${t}"`);
    const kolom = res.columns;
    const baris = res.rows.map((r) =>
      kolom.map((k) => {
        const v = r[k];
        if (v == null) return null;
        if (KOLOM_WAKTU.has(k)) return new Date(Number(v));
        return typeof v === "bigint" ? Number(v) : v;
      }),
    );
    let masuk = 0;
    for (let i = 0; i < baris.length; i += 500) {
      const potong = baris.slice(i, i + 500);
      const [hasil] = await conn.query(`INSERT IGNORE INTO \`${t}\` (${kolom.map((k) => `\`${k}\``).join(",")}) VALUES ?`, [potong]);
      masuk += hasil.affectedRows;
    }
    console.log(`  ${t.padEnd(20)} ${String(baris.length).padStart(5)} baris dibaca, ${String(masuk).padStart(5)} dimasukkan`);
  }
} finally {
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  await conn.end();
  lite.close();
}
console.log("\nSelesai. Berkas unggahan di folder storage/ tidak perlu dipindahkan.");
