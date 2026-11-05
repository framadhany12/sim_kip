// Dipakai `npm run start` di hosting yang hanya menjalankan satu perintah:
// build produksi dibuat otomatis bila belum ada, migrasi database diterapkan, lalu server `next start` dijalankan.
// Paksa build ulang dengan FORCE_BUILD=1 (mis. setelah deploy kode baru).
import { existsSync } from "node:fs";
import { spawnSync, spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const distDir = process.env.NEXT_DIST_DIR || ".next";

process.env.NODE_ENV = "production";

const perluBuild = process.env.FORCE_BUILD === "1" || !existsSync(`${distDir}/BUILD_ID`);
if (perluBuild) {
  console.log("[start] Build produksi belum ada, menjalankan next build...");
  const hasil = spawnSync(process.execPath, [nextBin, "build"], { stdio: "inherit", env: process.env });
  if (hasil.status !== 0) {
    console.error("[start] next build gagal.");
    process.exit(hasil.status ?? 1);
  }
}

// Terapkan migrasi database (aman diulang; yang sudah diterapkan dilewati). Gagal tidak menghentikan server.
const migrasi = spawnSync(process.execPath, ["scripts/migrasi.mjs"], { stdio: "inherit", env: process.env });
if (migrasi.status !== 0) console.error("[start] Migrasi database gagal; periksa DATABASE_URL. Server tetap dijalankan.");

const port =process.env.PORT || "3000";
const anak = spawn(process.execPath, [nextBin, "start", "-p", port], { stdio: "inherit", env: process.env });
for (const sinyal of ["SIGINT", "SIGTERM"]) process.on(sinyal, () => anak.kill(sinyal));
anak.on("exit", (kode) => process.exit(kode ?? 0));
