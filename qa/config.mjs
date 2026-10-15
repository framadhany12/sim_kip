// Konfigurasi suite QA. Semua nilai bisa diganti lewat variabel lingkungan.
import fs from "node:fs";

export const BASE = (process.env.QA_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const ADMIN = { email: process.env.QA_ADMIN_EMAIL ?? "", sandi: process.env.QA_ADMIN_PASSWORD ?? "" };
export const PENDAFTAR = { email: process.env.QA_PENDAFTAR_EMAIL ?? "", sandi: process.env.QA_PENDAFTAR_PASSWORD ?? "" };
/** Tes yang mengubah data (mis. simpan landing page) hanya jalan bila QA_MUTASI=1. Data dikembalikan setelahnya. */
export const MUTASI = process.env.QA_MUTASI === "1";

const KANDIDAT_CHROME = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];
export const CHROME = KANDIDAT_CHROME.find((p) => p && fs.existsSync(p));
