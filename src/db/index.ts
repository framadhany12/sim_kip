import "server-only";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { count } from "drizzle-orm";
import * as schema from "./schema";
import { hashPassword } from "@/lib/password";

type DB = MySql2Database<typeof schema>;

export const DEFAULT_DATABASE_URL = "mysql://root@127.0.0.1:3306/kip_kuliah";

const g = globalThis as unknown as { __kipDb?: { pool: mysql.Pool; db: DB; ready: Promise<void> } };

/** Membuat database (bila belum ada) dengan charset utf8mb4 sebelum pool dibuka. */
async function pastikanDatabase(url: URL) {
  const nama = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!/^[A-Za-z0-9_]+$/.test(nama)) throw new Error(`Nama database tidak valid di DATABASE_URL: "${nama}"`);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${nama}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();
}

function create() {
  const url = new URL(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL);
  const pool = mysql.createPool({
    uri: url.toString(),
    connectionLimit: 10,
    charset: "utf8mb4_unicode_ci",
    // Semua waktu disimpan dalam UTC; tampilan dikonversi ke Asia/Jakarta.
    timezone: "Z",
  });
  const db = drizzle(pool, { schema, mode: "default" });
  const ready = (async () => {
    await pastikanDatabase(url);
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    await seed(db);
  })();
  // Bila gagal (mis. server MySQL mati), coba lagi pada permintaan berikutnya.
  ready.catch(() => {
    if (g.__kipDb?.ready === ready) g.__kipDb = undefined;
    void pool.end();
  });
  return { pool, db, ready };
}

/** Panggil `await getDb()` di setiap server action / halaman: memastikan migrasi & seed sudah jalan. */
export async function getDb(): Promise<DB> {
  g.__kipDb ??= create();
  await g.__kipDb.ready;
  return g.__kipDb.db;
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bDki\b/, "DKI")
    .replace(/\bDi\b/, "DI");
}

function readCsv(file: string): string[][] {
  const p = path.join(process.cwd(), "data", "wilayah", file);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => l.split(","));
}

async function seed(db: DB) {
  const [{ n: nUser }] = await db.select({ n: count() }).from(schema.users);
  if (nUser === 0) {
    await db.insert(schema.users).values({
      nama: "Administrator",
      email: (process.env.ADMIN_EMAIL ?? "admin@kip.local").toLowerCase(),
      passwordHash: await hashPassword(process.env.ADMIN_PASSWORD ?? "admin12345"),
      role: "admin",
      emailVerifiedAt: new Date(),
    });
  }

  const [{ n: nJurusan }] = await db.select({ n: count() }).from(schema.jurusan);
  if (nJurusan === 0) {
    // Data contoh — admin bisa mengubah/menonaktifkan lewat menu Kelola Jurusan.
    await db.insert(schema.jurusan).values([
      { kode: "TM", nama: "D3 Teknik Mesin" },
      { kode: "TO", nama: "D3 Teknik Otomotif" },
      { kode: "TE", nama: "D3 Teknik Elektronika" },
      { kode: "TI", nama: "D3 Teknik Informatika" },
      { kode: "KA", nama: "D3 Komputerisasi Akuntansi" },
      { kode: "TK", nama: "D3 Teknik Kimia" },
    ]);
  }

  const [{ n: nSumber }] = await db.select({ n: count() }).from(schema.sumberRekomendasi);
  if (nSumber === 0) {
    await db.insert(schema.sumberRekomendasi).values([
      { nama: "Mahasiswa", urutan: 1 },
      { nama: "Alumni", urutan: 2 },
      { nama: "Karyawan", urutan: 3 },
      { nama: "Media Sosial", urutan: 4, butuhKontak: false },
    ]);
  }

  const [{ n: nFaq }] = await db.select({ n: count() }).from(schema.faq);
  if (nFaq === 0) {
    await db.insert(schema.faq).values([
      { urutan: 1, pertanyaan: "Siapa saja yang boleh mendaftar KIP Kuliah?", jawaban: "Lulusan SMA/SMK/MA atau sederajat tahun 2024, 2025, atau 2026 yang berusia paling tinggi 21 tahun dan berasal dari keluarga yang membutuhkan dukungan ekonomi." },
      { urutan: 2, pertanyaan: "Berkas apa saja yang harus diunggah?", jawaban: "Ijazah SMA/SMK/MA atau sederajat, Akta Kelahiran, Kartu Keluarga (KK), KTP, dan Surat Permohonan kepada Direktur. Surat Keterangan Kebutuhan Ekonomi dapat diunggah sebagai bukti pendukung." },
      { urutan: 3, pertanyaan: "Bagaimana membuat Surat Permohonan kepada Direktur?", jawaban: "Unduh format resminya di s.id/permohonandirektur-kiptedc, isi dan tanda tangani, lalu pindai atau foto dengan jelas dan unggah dalam bentuk PDF/JPG/PNG." },
      { urutan: 4, pertanyaan: "Format dan ukuran berkas yang diterima?", jawaban: "PDF, JPG, atau PNG dengan ukuran maksimal 5 MB per berkas. Pastikan tulisan terbaca jelas dan tidak terpotong." },
      { urutan: 5, pertanyaan: "Apakah data bisa diubah setelah dikirim?", jawaban: "Setelah dikirim, data dikunci selama diperiksa admin. Jika admin meminta perbaikan, formulir akan terbuka kembali dan Anda bisa mengirim ulang." },
      { urutan: 6, pertanyaan: "Bagaimana cara mengetahui hasil seleksi?", jawaban: "Buka menu Status Pendaftaran setelah masuk ke akun. Di sana tertera status terkini, catatan admin, riwayat, dan hasil akhir seleksi." },
    ]);
  }

  const [{ n: nKab }] = await db.select({ n: count() }).from(schema.wilayahKabupaten);
  if (nKab === 0) {
    const prov = new Map(readCsv("provinces.csv").map(([id, nama]) => [id, titleCase(nama)]));
    const kab = readCsv("regencies.csv").map(([id, provId, nama]) => ({
      id,
      kode: id,
      nama: titleCase(nama),
      provinsi: prov.get(provId) ?? "-",
    }));
    const kec = readCsv("districts.csv").map(([id, kabId, nama]) => ({ id, kode: id, nama: titleCase(nama), kabupatenId: kabId }));
    const chunk = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
    await db.transaction(async (tx) => {
      for (const c of chunk(kab, 500)) await tx.insert(schema.wilayahKabupaten).values(c);
      for (const c of chunk(kec, 500)) await tx.insert(schema.wilayahKecamatan).values(c);
    });
  }
}
