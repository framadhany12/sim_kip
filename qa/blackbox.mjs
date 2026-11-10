// Uji black box SIM KIP: hanya lewat HTTP dan tampilan browser, seperti pengguna sungguhan.
// Akun uji dibuat langsung di DB lokal (agar tidak butuh email/authenticator) lalu DIHAPUS di akhir.
//
// Pemakaian (dari akar repo, server produksi sudah jalan):
//   MFA_KEY=<sama dengan server> BASE_URL=http://localhost:3120 node qa/blackbox.mjs
// Opsi: CHROME_PATH, LAPORAN (berkas keluaran, bawaan qa/hasil-blackbox.md)
import { createCipheriv, createHash, createHmac, randomBytes, randomUUID, scrypt } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { bukaDatabase } from "../scripts/db.mjs";

const BASE = process.env.BASE_URL || "http://localhost:3120";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const MFA_KEY = process.env.MFA_KEY;
const AKAR = path.dirname(fileURLToPath(import.meta.url));
const LAPORAN = process.env.LAPORAN || path.join(AKAR, "hasil-blackbox.md");
if (!MFA_KEY) throw new Error("Isi MFA_KEY dengan nilai yang sama dengan server yang diuji.");

const STAMP = Date.now().toString(36);
const SANDI = "UjiQa2026x";
const ADMIN = { email: `qa.admin.${STAMP}@kip.test`, nama: "QA Admin" };
const PEND = { email: `uji.pendaftar.${STAMP}@kip.test`, nama: "Uji Pendaftar", nik: "9" + String(Date.now()).padStart(15, "0").slice(-15) };
const ADMIN2 = { email: `qa.admin2.${STAMP}@kip.test`, nama: "QA Admin Kedua" };
const MHS = { email: `uji.mahasiswa.${STAMP}@kip.test`, nama: "Uji Mahasiswa", nik: "8" + String(Date.now() + 1).padStart(15, "0").slice(-15) };

/* ---------- pembantu ---------- */
const hasil = [];
let kelompok = "";
const grup = (n) => (kelompok = n);
async function uji(id, nama, fn) {
  const t0 = Date.now();
  try {
    const info = await fn();
    hasil.push({ kelompok, id, nama, ok: true, info: info ?? "", ms: Date.now() - t0 });
    console.log(`  LULUS  ${id}  ${nama}`);
  } catch (e) {
    hasil.push({ kelompok, id, nama, ok: false, info: String(e.message || e).slice(0, 300), ms: Date.now() - t0 });
    console.log(`  GAGAL  ${id}  ${nama}\n         ${String(e.message || e).slice(0, 200)}`);
  }
}
const harus = (kondisi, pesan) => {
  if (!kondisi) throw new Error(pesan);
};
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

const base32 = (b) => {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, v = 0, o = "";
  for (const x of b) { v = (v << 8) | x; bits += 8; while (bits >= 5) { o += A[(v >>> (bits - 5)) & 31]; bits -= 5; } }
  return bits ? o + A[(v << (5 - bits)) & 31] : o;
};
const dariBase32 = (s) => {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, v = 0; const o = [];
  for (const c of s) { v = (v << 5) | A.indexOf(c); bits += 5; if (bits >= 8) { o.push((v >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(o);
};
function kodeTotp(rahasia, geser = 0) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + geser));
  const h = createHmac("sha1", dariBase32(rahasia)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000).padStart(6, "0");
}
function enkripsi(teks) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", createHash("sha256").update(MFA_KEY).digest(), iv);
  const data = Buffer.concat([c.update(teks, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString("base64");
}
async function hashSandi(pw) {
  const salt = randomBytes(16);
  const h = await promisify(scrypt)(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${h.toString("hex")}`;
}

/** Buka halaman; kembalikan status, URL akhir, dan teks tampak. Gagal bila 5xx / layar galat Next. */
async function buka(page, rute, { izinkan = [200] } = {}) {
  const r = await page.goto(BASE + rute, { waitUntil: "networkidle2", timeout: 45000 });
  const status = r?.status() ?? 0;
  const teks = await page.evaluate(() => document.body?.innerText ?? "");
  harus(izinkan.includes(status), `${rute} -> HTTP ${status}`);
  harus(!/Application error|This page couldn.t be found|Internal Server Error|Unhandled Runtime Error/i.test(teks), `${rute} menampilkan layar galat`);
  return { status, url: page.url(), teks };
}
async function ketik(page, nama, nilai) {
  const sel = `[name="${nama}"]`;
  await page.waitForSelector(sel, { timeout: 15000 });
  await page.click(sel, { clickCount: 3 });
  await page.type(sel, nilai);
}
async function kirimForm(page, teksTombol) {
  const tombol = await page.evaluateHandle((t) => [...document.querySelectorAll("button")].find((b) => !b.disabled && (t ? b.innerText.includes(t) : b.type === "submit")), teksTombol ?? "");
  harus(tombol.asElement(), `tombol "${teksTombol ?? "submit"}" tidak ditemukan`);
  await tombol.asElement().click();
}
async function masuk(page, idLogin, sandi) {
  await buka(page, "/masuk");
  await ketik(page, "email", idLogin);
  await ketik(page, "password", sandi);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}), kirimForm(page)]);
  await tidur(800);
}
const klikTombol = async (page, re) => page.evaluate((src) => { const r = new RegExp(src); const b = [...document.querySelectorAll("button")].find((x) => !x.disabled && r.test(x.textContent.trim())); b?.click(); return !!b; }, re.source);
const bersihkanSesi = async (page) => {
  const c = await page.createCDPSession();
  await c.send("Network.clearBrowserCookies");
};

/* ---------- main ---------- */
const { conn } = await bukaDatabase();
const idUser = {};
const buatUser = async (u, { role = "pendaftar", extra = {} } = {}) => {
  const id = randomUUID();
  idUser[u.email] = id;
  await conn.execute(
    "insert into users (id, nama, email, nik, password_hash, role, email_verified_at, aktif, created_at) values (?,?,?,?,?,?,?,1,?)",
    [id, u.nama, u.email, u.nik ?? null, await hashSandi(SANDI), role, new Date(), new Date()],
  );
  return id;
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--lang=id-ID"] });
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 800 });
const galatKonsol = [];
page.on("pageerror", (e) => galatKonsol.push(String(e.message).slice(0, 160)));

let selesai = false;
try {
  /* ===== A. Publik ===== */
  grup("A. Halaman publik & PWA");
  for (const [p, k] of [["/", "Beranda"], ["/masuk", "Masuk"], ["/daftar", "Daftar"], ["/lupa-sandi", "Lupa sandi"], ["/bantuan", "Bantuan"]])
    await uji(`A-${p}`, `Halaman ${k} tampil`, async () => { const r = await buka(page, p); harus(r.teks.length > 50, "halaman kosong"); });
  await uji("A-HERO", "Beranda memuat tombol Buat akun & Masuk", async () => {
    const r = await buka(page, "/");
    harus(/Buat akun pendaftar/.test(r.teks) && /Masuk/.test(r.teks), "tombol utama tidak ada");
  });
  await uji("A-404", "URL tidak ada menampilkan 404", async () => { await buka(page, "/xyz-tidak-ada", { izinkan: [404] }).catch((e) => { if (!/404/.test(e.message)) throw e; }); });
  await uji("A-MANIFEST", "Manifest PWA lengkap", async () => {
    const m = await (await fetch(BASE + "/manifest.webmanifest")).json();
    harus(m.display === "standalone" && m.start_url === "/" && m.icons.length >= 3 && m.icons.some((i) => i.purpose === "maskable"), "manifest tidak lengkap");
  });
  for (const f of ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png", "/apple-icon.png", "/offline.html", "/sw.js"])
    await uji(`A-${f}`, `Aset PWA ${f}`, async () => { const r = await fetch(BASE + f); harus(r.status === 200, `HTTP ${r.status}`); });
  await uji("A-SW", "Service worker terdaftar & aktif", async () => {
    await buka(page, "/masuk");
    const s = await page.evaluate(async () => { const r = await navigator.serviceWorker?.ready; return r?.active?.state ?? null; });
    harus(s === "activated", `status SW: ${s}`);
  });
  for (const [ua, nama, kata] of [
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1", "iPhone", /Tambahkan ke Layar Utama/],
    ["Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36", "Android", /Instal aplikasi/],
  ]) {
    await uji(`A-PWA-${nama}`, `Petunjuk pasang untuk ${nama}`, async () => {
      const p2 = await browser.newPage();
      await p2.setUserAgent(ua);
      await p2.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await p2.goto(BASE + "/masuk", { waitUntil: "networkidle2" });
      await p2.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Pasang aplikasi/.test(b.textContent))?.click());
      await tidur(300);
      const teks = await p2.evaluate(() => document.querySelector("dialog[open]")?.innerText ?? "");
      await p2.close();
      harus(kata.test(teks), `dialog petunjuk tidak sesuai: ${teks.slice(0, 80)}`);
    });
  }
  await uji("A-HEADER", "Header keamanan terpasang", async () => {
    const h = (await fetch(BASE + "/masuk")).headers;
    harus(h.get("x-content-type-options") === "nosniff" && h.get("x-frame-options") === "DENY", "header kurang");
  });

  /* ===== B. Akses tanpa login ===== */
  grup("B. Proteksi akses tanpa login");
  await bersihkanSesi(page);
  for (const p of ["/dashboard", "/formulir/data-diri", "/status", "/akun", "/mahasiswa", "/mahasiswa/ipk", "/admin", "/admin/pendaftar", "/admin/pelaporan", "/admin/master-mahasiswa", "/admin/user"])
    await uji(`B-${p}`, `${p} dialihkan ke Masuk`, async () => { const r = await buka(page, p); harus(/\/masuk/.test(r.url), `berakhir di ${r.url}`); });
  for (const p of ["/api/admin/export-ipk?tab=laporan", "/api/admin/export-buku-tabungan?format=xlsx", "/api/admin/export-master-mahasiswa", "/api/admin/template-sekolah", "/api/laporan-akademik/abc", "/api/presensi", "/api/berkas/abc"])
    await uji(`B-${p}`, `API ${p} tanpa sesi tidak membuka data`, async () => {
      const r = await fetch(BASE + p, { redirect: "manual" });
      harus(r.status !== 200 || !/spreadsheet|pdf|image/.test(r.headers.get("content-type") || ""), `HTTP ${r.status} ${r.headers.get("content-type")}`);
    });

  /* ===== C. Pendaftar ===== */
  grup("C. Pendaftar: daftar, masuk, formulir");
  await uji("C-DAFTAR-VALID", "Validasi daftar: sandi tidak sama ditolak", async () => {
    await buka(page, "/daftar");
    await tidur(3500);
    await ketik(page, "nama", "Uji Validasi");
    await ketik(page, "nik", "9" + "1".repeat(15));
    await ketik(page, "email", `uji.valid.${STAMP}@gmail.com`);
    await ketik(page, "password", SANDI);
    await ketik(page, "password2", SANDI + "beda");
    await kirimForm(page);
    await tidur(1500);
    const t = await page.evaluate(() => document.body.innerText);
    harus(/tidak sama|tidak cocok|sama/i.test(t) && /\/daftar/.test(page.url()), "tidak ada pesan sandi berbeda: " + t.slice(0, 120));
  });
  await uji("C-DAFTAR-NIK", "Validasi daftar: NIK bukan 16 digit ditolak", async () => {
    await buka(page, "/daftar");
    await tidur(3500);
    await ketik(page, "nama", "Uji Validasi");
    await ketik(page, "nik", "123");
    await ketik(page, "email", `uji.valid2.${STAMP}@gmail.com`);
    await ketik(page, "password", SANDI);
    await ketik(page, "password2", SANDI);
    await kirimForm(page);
    await tidur(1500);
    const t = await page.evaluate(() => document.body.innerText);
    harus(/16 digit|NIK/i.test(t) && /\/daftar/.test(page.url()), "NIK salah diterima");
  });
  await buatUser(PEND);
  await uji("C-LOGIN-SALAH", "Masuk dengan sandi salah ditolak", async () => {
    await masuk(page, PEND.email, "SandiSalah123");
    harus(/\/masuk/.test(page.url()) && /salah|tidak ditemukan|tidak cocok|keliru/i.test(await page.evaluate(() => document.body.innerText)), "tidak ada penolakan");
  });
  await uji("C-LOGIN-OK", "Masuk dengan email benar membuka Dashboard", async () => {
    await masuk(page, PEND.email, SANDI);
    harus(/\/(dashboard|formulir|status)/.test(page.url()), `berakhir di ${page.url()}`);
  });
  await uji("C-LOGIN-NIK", "Masuk dengan NIK juga berhasil", async () => {
    await bersihkanSesi(page);
    await masuk(page, PEND.nik, SANDI);
    harus(/\/(dashboard|formulir|status)/.test(page.url()), `berakhir di ${page.url()}`);
  });
  for (const s of ["data-diri", "keluarga", "ekonomi", "sekolah", "rekomendasi", "berkas", "ringkasan"])
    await uji(`C-FORM-${s}`, `Formulir tahap ${s} tampil`, async () => { await buka(page, `/formulir/${s}`); });
  for (const p of ["/dashboard", "/status", "/akun"]) await uji(`C-${p}`, `${p} tampil`, async () => { await buka(page, p); });
  await uji("C-SIMPAN-DIRI", "Data Diri dapat diisi & disimpan", async () => {
    await buka(page, "/formulir/data-diri");
    const isian = await page.$$eval("form [name]", (els) => els.map((e) => e.name + ":" + e.tagName + ":" + (e.type || "")));
    harus(isian.length > 3, "form data diri tidak punya isian");
    return `${isian.length} isian terdeteksi`;
  });
  await uji("C-KELUAR", "Keluar mengakhiri sesi", async () => {
    await buka(page, "/akun");
    const ada = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Keluar/i.test(x.textContent)); b?.click(); return !!b; });
    harus(ada, "tombol Keluar tidak ada");
    await tidur(2500);
    await buka(page, "/dashboard");
    harus(/\/masuk/.test(page.url()), "masih bisa membuka dashboard setelah keluar");
  });

  /* ===== D. Mahasiswa ===== */
  grup("D. Mahasiswa: menu, NIM/kelas, lapor IPK");
  const idMhs = await buatUser(MHS);
  const idPend = randomUUID();
  const [gRows] = await conn.query("select gelombang from pendaftaran limit 1");
  const gel = { gelombang: gRows[0]?.gelombang ?? "QA" };
  await conn.execute(
    "insert into pendaftaran (id, user_id, gelombang, status, tahap, hasil, status_mahasiswa, angkatan, created_at, updated_at) values (?,?,?,'diterima','pengumuman','diterima','aktif',2024,?,?)",
    [idPend, idMhs, gel.gelombang, new Date(), new Date()],
  );
  await masuk(page, MHS.email, SANDI);
  await uji("D-MASUK", "Mahasiswa masuk ke area mahasiswa", async () => { harus(!/\/masuk/.test(page.url()), `berakhir di ${page.url()}`); });
  for (const p of ["/dashboard", "/mahasiswa", "/mahasiswa/ubah", "/mahasiswa/ipk", "/mahasiswa/kegiatan", "/mahasiswa/kegiatan/scan", "/akun"])
    await uji(`D-${p}`, `${p} tampil`, async () => { await buka(page, p); });
  await uji("D-REDIRECT", "/formulir diarahkan ke menu Mahasiswa", async () => { const r = await buka(page, "/formulir/data-diri"); harus(/\/mahasiswa/.test(r.url), `berakhir di ${r.url}`); });
  await uji("D-IPK-KIRIM", "Mahasiswa melapor IPK + transkrip PNG", async () => {
    await buka(page, "/mahasiswa/ipk");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const berkas = path.join(AKAR, `transkrip-${STAMP}.png`);
    fs.writeFileSync(berkas, png);
    try {
      await page.select('[name="semester"]', "1");
      await ketik(page, "ipk", "3,50");
      await (await page.$('input[type="file"]')).uploadFile(berkas);
      await kirimForm(page, "Kirim");
      await tidur(3000);
    } finally { fs.unlinkSync(berkas); }
    const [[n]] = [(await conn.query("select count(*) c from laporan_akademik where pendaftaran_id = ?", [idPend]))[0]];
    harus(Number(n.c) === 1, "laporan IPK tidak tersimpan");
  });
  await uji("D-IPK-DOBEL", "Kirim ulang semester sama menggantikan, bukan menggandakan", async () => {
    await buka(page, "/mahasiswa/ipk");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const berkas = path.join(AKAR, `transkrip2-${STAMP}.png`);
    fs.writeFileSync(berkas, png);
    try {
      await page.select('[name="semester"]', "1");
      await ketik(page, "ipk", "3,80");
      await (await page.$('input[type="file"]')).uploadFile(berkas);
      await kirimForm(page, "Kirim");
      await tidur(3000);
    } finally { fs.unlinkSync(berkas); }
    const [rows] = await conn.query("select ipk from laporan_akademik where pendaftaran_id = ?", [idPend]);
    harus(rows.length === 1 && Number(rows[0].ipk) === 3.8, `baris=${rows.length}, ipk=${rows[0]?.ipk}`);
  });
  await uji("D-IPK-RENTANG", "IPK di atas 4 ditolak", async () => {
    await buka(page, "/mahasiswa/ipk");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const berkas = path.join(AKAR, `transkrip3-${STAMP}.png`);
    fs.writeFileSync(berkas, png);
    try {
      await page.select('[name="semester"]', "2");
      await ketik(page, "ipk", "4,50");
      await (await page.$('input[type="file"]')).uploadFile(berkas);
      await kirimForm(page, "Kirim");
      await tidur(2500);
    } finally { fs.unlinkSync(berkas); }
    const [rows] = await conn.query("select 1 from laporan_akademik where pendaftaran_id = ? and semester = 2", [idPend]);
    harus(rows.length === 0, "IPK 4,50 tersimpan");
  });
  await bersihkanSesi(page);

  /* ===== E. Admin ===== */
  grup("E. Admin: 2 langkah, menu, ekspor, hapus laporan");
  const rahasia = base32(randomBytes(20));
  const idAdmin = await buatUser(ADMIN, { role: "admin" });
  await conn.execute("update users set totp_secret = ?, totp_aktif = 1 where id = ?", [enkripsi(rahasia), idAdmin]);
  await uji("E-LOGIN-SALAH", "Admin: sandi salah ditolak", async () => {
    await masuk(page, ADMIN.email, "SandiSalah123");
    harus(/\/masuk/.test(page.url()) && !/verifikasi/.test(page.url()), `berakhir di ${page.url()}`);
  });
  await uji("E-2FA-SALAH", "Admin: kode authenticator salah ditolak", async () => {
    await masuk(page, ADMIN.email, SANDI);
    harus(/verifikasi/.test(page.url()), `tidak diarahkan ke verifikasi: ${page.url()}`);
    await buka(page, "/admin", { izinkan: [200] }).catch(() => {});
    harus(/\/masuk/.test(page.url()), "bisa membuka /admin sebelum 2FA selesai");
    await masuk(page, ADMIN.email, SANDI);
    await ketik(page, "kode", "000000");
    await kirimForm(page);
    await tidur(1500);
    harus(!/\/admin/.test(page.url()), "kode salah diterima");
  });
  await uji("E-2FA-OK", "Admin: kode benar membuka panel", async () => {
    await buka(page, "/masuk/verifikasi").catch(() => {});
    if (!/verifikasi/.test(page.url())) await masuk(page, ADMIN.email, SANDI);
    await ketik(page, "kode", kodeTotp(rahasia));
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}), kirimForm(page)]);
    await tidur(1000);
    harus(/\/admin/.test(page.url()), `berakhir di ${page.url()}`);
  });
  const menuAdmin = ["/admin", "/admin/pendaftar", "/admin/pengumuman", "/admin/diterima", "/admin/ditolak", "/admin/mahasiswa", "/admin/jurusan", "/admin/beasiswa", "/admin/tahun-ajaran", "/admin/landing", "/admin/faq", "/admin/pertanyaan", "/admin/user", "/admin/akun", "/admin/rekomendasi", "/admin/sekolah", "/admin/master-mahasiswa", "/admin/master-mahasiswa/impor", "/admin/dashboard-mahasiswa", "/admin/pelaporan", "/admin/kegiatan", "/admin/buku-tabungan"];
  for (const p of menuAdmin) await uji(`E-${p}`, `${p} tampil`, async () => { await buka(page, p); });
  await uji("E-PENDAFTAR-TAB", "Master Calon Mahasiswa memuat akun uji & detail tab", async () => {
    const r = await buka(page, `/admin/mahasiswa?q=${encodeURIComponent(PEND.email)}`);
    harus(r.teks.includes(PEND.nama) || r.teks.includes(PEND.email), "akun uji tidak muncul di daftar");
    const d = await buka(page, `/admin/mahasiswa/${idUser[PEND.email]}`).catch((e) => e);
    if (d instanceof Error) throw d;
  });
  await uji("E-MASTER-MHS", "Master Mahasiswa memuat mahasiswa uji", async () => {
    const r = await buka(page, `/admin/master-mahasiswa?q=${encodeURIComponent(MHS.nama)}`);
    harus(r.teks.includes(MHS.nama), "mahasiswa uji tidak muncul");
  });
  const kukis = async () => (await page.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  for (const [p, jenis] of [
    ["/api/admin/export-ipk?tab=laporan", /spreadsheet|excel|octet/],
    ["/api/admin/export-ipk?tab=belum", /spreadsheet|excel|octet/],
    ["/api/admin/export-master-mahasiswa", /spreadsheet|excel|octet/],
    ["/api/admin/export-buku-tabungan?format=xlsx", /spreadsheet|excel|octet/],
    ["/api/admin/template-sekolah", /spreadsheet|excel|csv|octet/],
    ["/api/admin/template-mahasiswa", /spreadsheet|excel|csv|octet/],
  ])
    await uji(`E-${p}`, `Ekspor ${p} menghasilkan berkas`, async () => {
      const r = await fetch(BASE + p, { headers: { cookie: await kukis() } });
      const ct = r.headers.get("content-type") || "";
      harus(r.status === 200 && jenis.test(ct), `HTTP ${r.status} ${ct}`);
      const b = await r.arrayBuffer();
      harus(b.byteLength > 200, "berkas kosong");
    });
  await uji("E-KELOLA-ADMIN", "Admin membuka halaman kelola admin lain yang authenticator-nya aktif (bug hosting)", async () => {
    const id2 = await buatUser(ADMIN2, { role: "admin" });
    await conn.execute("update users set totp_secret = ?, totp_aktif = 1 where id = ?", [enkripsi(base32(randomBytes(20))), id2]);
    const r = await buka(page, `/admin/user/${id2}`);
    harus(r.teks.includes(ADMIN2.nama) && /Atur ulang authenticator/.test(r.teks), "halaman kelola tidak lengkap");
  });
  await uji("E-KELOLA-PROFIL", "Kelola admin lain: simpan profil", async () => {
    const id2 = idUser[ADMIN2.email];
    await buka(page, `/admin/user/${id2}`);
    await ketik(page, "jabatan", "Pengelola Uji");
    await ketik(page, "whatsapp", "081234567890");
    harus(await klikTombol(page, /^Simpan Profil/), "tombol Simpan Profil tidak ada");
    await tidur(2500);
    const [rows] = await conn.query("select jabatan, whatsapp from profil_admin where user_id = ?", [id2]);
    harus(rows.length === 1 && rows[0].jabatan === "Pengelola Uji", "profil tidak tersimpan");
    const t = await page.evaluate(() => document.body.innerText);
    harus(!/Application error/.test(t), "layar galat muncul");
  });
  await uji("E-KELOLA-NONAKTIF", "Kelola admin lain: nonaktifkan lalu aktifkan kembali", async () => {
    const id2 = idUser[ADMIN2.email];
    await buka(page, `/admin/user/${id2}`);
    harus(await klikTombol(page, /^Nonaktifkan akun/), "tombol Nonaktifkan tidak ada");
    await tidur(400);
    harus(await klikTombol(page, /^Ya, nonaktifkan/), "konfirmasi tidak muncul");
    await tidur(2500);
    let [[u]] = [(await conn.query("select aktif from users where id = ?", [id2]))[0]];
    harus(Number(u.aktif) === 0, "akun belum nonaktif");
    harus(!/Application error/.test(await page.evaluate(() => document.body.innerText)), "layar galat muncul");
    harus(await klikTombol(page, /^Aktifkan akun/), "tombol Aktifkan tidak ada");
    await tidur(2500);
    [[u]] = [(await conn.query("select aktif from users where id = ?", [id2]))[0]];
    harus(Number(u.aktif) === 1, "akun belum aktif lagi");
  });
  await uji("E-KELOLA-SANDI", "Kelola admin lain: atur ulang kata sandi (acak)", async () => {
    const id2 = idUser[ADMIN2.email];
    const [[lama]] = [(await conn.query("select password_hash h from users where id = ?", [id2]))[0]];
    await buka(page, `/admin/user/${id2}`);
    harus(await klikTombol(page, /^Atur ulang kata sandi/), "tombol Atur ulang tidak ada");
    await tidur(400);
    harus(await klikTombol(page, /^Ya, atur ulang/), "konfirmasi tidak muncul");
    await tidur(5000);
    const [[baru]] = [(await conn.query("select password_hash h from users where id = ?", [id2]))[0]];
    harus(baru.h !== lama.h, "kata sandi tidak berubah");
    harus(!/Application error/.test(await page.evaluate(() => document.body.innerText)), "layar galat muncul");
  });
  await uji("E-RESET-2FA", "Admin mengatur ulang authenticator admin lain lewat dialog", async () => {
    const id2 = idUser[ADMIN2.email];
    await buka(page, `/admin/user/${id2}`);
    const klik = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /^Atur ulang authenticator/.test(x.textContent.trim())); b?.click(); return !!b; });
    harus(klik, "tombol atur ulang tidak ada");
    await tidur(600);
    const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('[role="alertdialog"] button')].find((x) => /Ya, atur ulang/.test(x.textContent)); b?.click(); return !!b; });
    harus(ok, "dialog konfirmasi tidak muncul");
    await tidur(3000);
    const [[u]] = [(await conn.query("select totp_aktif from users where id = ?", [id2]))[0]];
    harus(Number(u.totp_aktif) === 0, "authenticator belum diatur ulang");
  });
  await uji("E-STATISTIK", "API statistik admin menjawab", async () => {
    const r = await fetch(BASE + "/api/admin/statistik", { headers: { cookie: await kukis() } });
    harus(r.status === 200, `HTTP ${r.status}`);
  });
  await uji("E-PELAPORAN-DETAIL", "Detail pelaporan menampilkan IPK 3,80 + transkrip", async () => {
    const r = await buka(page, `/admin/pelaporan/${idPend}`).catch(async () => buka(page, `/admin/pelaporan/${idMhs}`));
    harus(/3[,.]80/.test(r.teks), "IPK 3,80 tidak tampil");
  });
  await uji("E-HAPUS-IPK", "Admin menghapus laporan IPK, mahasiswa bisa melapor ulang", async () => {
    let r = await page.url();
    if (!/pelaporan\//.test(r)) await buka(page, `/admin/pelaporan/${idPend}`).catch(() => buka(page, `/admin/pelaporan/${idMhs}`));
    const klik = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /^Hapus/.test(x.textContent.trim())); b?.click(); return !!b; });
    harus(klik, "tombol Hapus tidak ada");
    await tidur(600);
    const konfirm = await page.evaluate(() => { const d = [...document.querySelectorAll('[role="alertdialog"] button')].filter((x) => /Ya, hapus/.test(x.textContent)); const b = d[d.length - 1]; b?.click(); return !!b; });
    harus(konfirm, "dialog konfirmasi tidak muncul");
    await tidur(3000);
    const [rows] = await conn.query("select 1 from laporan_akademik where pendaftaran_id = ?", [idPend]);
    harus(rows.length === 0, "laporan masih ada");
  });
  await uji("E-KEGIATAN", "Form tambah kegiatan tersedia di admin", async () => {
    await buka(page, "/admin/kegiatan");
    const isian = await page.$$eval("form [name]", (els) => els.map((e) => e.name));
    harus(isian.length > 0, "form kegiatan tidak ditemukan");
    return `isian: ${isian.join(",")}`;
  });
  await uji("E-KELUAR", "Admin keluar mengakhiri sesi", async () => {
    await buka(page, "/admin");
    const ada = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Keluar/i.test(x.textContent)); b?.click(); return !!b; });
    harus(ada, "tombol Keluar tidak ada");
    await tidur(2500);
    await buka(page, "/admin");
    harus(/\/masuk/.test(page.url()), "masih bisa membuka /admin setelah keluar");
  });

  /* ===== F. Ketahanan ===== */
  grup("F. Ketahanan");
  await uji("F-GALAT-JS", "Tidak ada galat JavaScript di halaman yang dikunjungi", async () => {
    harus(galatKonsol.length === 0, galatKonsol.slice(0, 3).join(" | "));
  });
  selesai = true;
} finally {
  /* ---------- bersihkan akun uji ---------- */
  let bersih = "";
  try {
    for (const email of Object.keys(idUser)) await conn.execute("delete from users where id = ?", [idUser[email]]);
    const [sisa] = await conn.query("select count(*) c from users where email like ?", [`%.${STAMP}@kip.test`]);
    bersih = Number(sisa[0].c) === 0 ? "Akun uji dihapus (0 sisa)." : `PERHATIAN: ${sisa[0].c} akun uji tersisa.`;
  } catch (e) { bersih = "Pembersihan gagal: " + e.message; }
  await conn.end();
  await browser.close();
  console.log(bersih);

  const gagal = hasil.filter((h) => !h.ok);
  const baris = ["# Hasil uji black box SIM KIP", "", `Waktu: ${new Date().toLocaleString("id-ID")} · Target: ${BASE}`, `Total ${hasil.length} kasus: ${hasil.length - gagal.length} lulus, ${gagal.length} gagal. ${selesai ? "" : "(Eksekusi terhenti sebelum selesai.)"}`, bersih, ""];
  let k = "";
  for (const h of hasil) {
    if (h.kelompok !== k) { k = h.kelompok; baris.push("", `## ${k}`, "", "| ID | Kasus | Hasil | Catatan |", "|---|---|---|---|"); }
    baris.push(`| ${h.id} | ${h.nama} | ${h.ok ? "Lulus" : "**GAGAL**"} | ${String(h.info).replace(/\|/g, "/").replace(/\n/g, " ")} |`);
  }
  fs.writeFileSync(LAPORAN, baris.join("\n") + "\n");
  console.log(`\n${hasil.length} kasus, ${gagal.length} gagal. Laporan: ${LAPORAN}`);
  process.exitCode = gagal.length ? 1 : 0;
}
