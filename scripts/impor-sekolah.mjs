// Mengisi master sekolah dari CSV (npsn;nama;kota[;provinsi]).
// Pemakaian: npm run sekolah:impor [-- path/berkas.csv]   (bawaan: database/sekolah-sma-smk.csv)
// NPSN yang sudah ada di master tidak diubah, jadi aman dijalankan berulang dan tidak menimpa koreksi admin.
//
// database/sekolah-sma-smk.csv: SMA & SMK seluruh Indonesia dari salinan data Dapodik
// (api-sekolah-indonesia.vercel.app, diambil 21-10-2026). MA (Kemenag) tidak termasuk.
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { bukaDatabase } from "./db.mjs";

const berkas = process.argv[2] ?? "database/sekolah-sma-smk.csv";
if (!fs.existsSync(berkas)) {
  console.error(`Berkas tidak ditemukan: ${berkas}`);
  process.exit(1);
}

// Harus sama dengan kataCariSekolah() di src/lib/sekolah.ts.
const SINGKATAN = { sman: "sma negeri", smkn: "smk negeri", smas: "sma swasta", smks: "smk swasta", kab: "kabupaten" };
const kataCari = (nama, kota) =>
  [nama, kota ?? ""]
    .join(" ")
    .toLowerCase()
    .split(/[-.,/()\s]+/)
    .filter(Boolean)
    .map((k) => SINGKATAN[k] ?? k)
    .join(" ")
    .slice(0, 300);

const baris = fs.readFileSync(berkas, "utf8").replace(/^﻿/, "").split(/\r?\n/).slice(1).filter(Boolean);
const data = [];
for (const b of baris) {
  const [npsn = "", nama = "", kota = ""] = b.split(";").map((c) => c.replace(/\s+/g, " ").trim());
  if (!/^\d{8}$/.test(npsn) || nama.length < 3) continue;
  data.push([randomUUID(), npsn, nama.slice(0, 150), kota.slice(0, 100) || null, "admin", kataCari(nama, kota), new Date()]);
}

const { conn, nama: db } = await bukaDatabase();
const [[{ n: sebelum }]] = await conn.query("select count(*) n from sekolah");
for (let i = 0; i < data.length; i += 1000) {
  await conn.query("insert ignore into sekolah (id, npsn, nama, kota, sumber, kata_cari, created_at) values ?", [data.slice(i, i + 1000)]);
}
const [[{ n: sesudah }]] = await conn.query("select count(*) n from sekolah");
await conn.end();
console.log(`Database ${db}: ${sesudah - sebelum} sekolah ditambahkan, ${data.length - (sesudah - sebelum)} sudah ada (dilewati). Total master: ${sesudah}.`);
