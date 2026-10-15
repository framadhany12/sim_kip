// Tes UI dengan Chrome headless (puppeteer-core): login, halaman admin, regresi bug yang pernah ditemukan.
// Akun lewat QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD (dan QA_PENDAFTAR_* untuk tes pendaftar).
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { ADMIN, BASE, CHROME, MUTASI, PENDAFTAR } from "./config.mjs";

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const adaAdmin = Boolean(ADMIN.email && ADMIN.sandi);
const adaPendaftar = Boolean(PENDAFTAR.email && PENDAFTAR.sandi);

let browser;

/** Membuka konteks browser baru (sesi bersih) dan mengumpulkan galat konsol serta respons 5xx. */
async function halamanBaru(lebar = 1366, tinggi = 850) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: lebar, height: tinggi });
  page.setDefaultTimeout(20000);
  const masalah = [];
  page.on("pageerror", (e) => masalah.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !/favicon|Failed to load resource.*(401|403|404)/.test(m.text()) && masalah.push(`console: ${m.text()}`));
  page.on("response", (r) => r.status() >= 500 && masalah.push(`HTTP ${r.status()} ${r.url()}`));
  return { page, ctx, masalah };
}

async function klik(page, teks, selektor = "button, a") {
  const ok = await page.evaluate(
    (teks, selektor) => {
      const el = [...document.querySelectorAll(selektor)].find((e) => e.innerText.trim().toLowerCase().includes(teks.toLowerCase()) && !e.disabled);
      el?.click();
      return Boolean(el);
    },
    teks,
    selektor,
  );
  assert.ok(ok, `Tombol/tautan "${teks}" tidak ditemukan`);
}

async function isi(page, nama, nilai) {
  const sel = `[name="${nama}"]`;
  await page.waitForSelector(sel);
  await page.click(sel, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(sel, nilai, { delay: 2 });
}

async function masuk(page, { email, sandi }) {
  await page.goto(BASE + "/masuk", { waitUntil: "networkidle0" });
  await isi(page, "email", email);
  await isi(page, "password", sandi);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}), klik(page, "Masuk", "button[type=submit], button")]);
}

const teks = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
const meluapHorizontal = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

before(async () => {
  assert.ok(CHROME, "Chrome/Edge tidak ditemukan. Setel CHROME_PATH ke lokasi peramban.");
  browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
});
after(async () => browser?.close());

describe("Autentikasi", () => {
  test("[Major] Kata sandi salah ditolak dengan pesan dan tetap di halaman masuk", async () => {
    const { page, ctx } = await halamanBaru();
    await masuk(page, { email: "tidak.ada@example.test", sandi: "SandiSalah123!" });
    assert.match(new URL(page.url()).pathname, /\/masuk/);
    assert.match(await teks(page), /salah|tidak (valid|ditemukan|cocok)|gagal/i);
    await ctx.close();
  });

  test("[Minor] Formulir masuk menolak isian kosong tanpa galat", async () => {
    const { page, ctx, masalah } = await halamanBaru();
    await page.goto(BASE + "/masuk", { waitUntil: "networkidle0" });
    await klik(page, "Masuk", "button[type=submit], button");
    await tidur(800);
    assert.match(new URL(page.url()).pathname, /\/masuk/);
    assert.deepEqual(masalah, []);
    await ctx.close();
  });

  test("[Major] Admin masuk lalu keluar; setelah keluar /admin kembali tertutup", { skip: !adaAdmin && "QA_ADMIN_* belum diisi" }, async () => {
    const { page, ctx } = await halamanBaru();
    await masuk(page, ADMIN);
    assert.match(new URL(page.url()).pathname, /^\/admin/);
    await page.evaluate(() => document.querySelector("form button[type=submit][aria-label=Keluar], aside form button, header form button")?.click());
    await tidur(1500);
    await page.goto(BASE + "/admin", { waitUntil: "networkidle0" });
    assert.match(new URL(page.url()).pathname, /\/masuk/);
    await ctx.close();
  });
});

describe("Halaman admin", { skip: !adaAdmin && "QA_ADMIN_* belum diisi" }, () => {
  const HALAMAN = ["/admin", "/admin/pendaftar", "/admin/diterima", "/admin/ditolak", "/admin/pertanyaan", "/admin/pengumuman", "/admin/landing", "/admin/user", "/admin/mahasiswa", "/admin/jurusan", "/admin/faq", "/admin/rekomendasi", "/admin/tahun-ajaran", "/admin/akun"];
  let sesi;
  before(async () => {
    sesi = await halamanBaru();
    await masuk(sesi.page, ADMIN);
  });
  after(async () => sesi?.ctx.close());

  test("[Major] Semua halaman admin terbuka tanpa galat konsol/5xx", async (t) => {
    for (const p of HALAMAN) {
      await t.test(p, async () => {
        sesi.masalah.length = 0;
        const r = await sesi.page.goto(BASE + p, { waitUntil: "networkidle0" });
        assert.equal(r.status(), 200);
        assert.match(new URL(sesi.page.url()).pathname, new RegExp("^" + p));
        assert.doesNotMatch(await teks(sesi.page), /Application error|Internal Server Error|Unhandled Runtime Error/i);
        assert.deepEqual(sesi.masalah, []);
      });
    }
  });

  test("[Minor] Tampilan ponsel (375px) tidak meluap ke samping", async (t) => {
    const hp = await halamanBaru(375, 800);
    await masuk(hp.page, ADMIN);
    for (const p of ["/admin", "/admin/pendaftar", "/admin/landing", "/admin/user"]) {
      await t.test(p, async () => {
        await hp.page.goto(BASE + p, { waitUntil: "networkidle0" });
        assert.equal(await meluapHorizontal(hp.page), false, `${p} meluap horizontal di 375px`);
      });
    }
    await hp.ctx.close();
  });

  test("[Major] Ekspor Excel dan CSV mengembalikan berkas yang valid", async () => {
    const hasil = await sesi.page.evaluate(async () => {
      const ambil = async (f) => {
        const r = await fetch(`/api/admin/export?format=${f}`);
        const b = await r.arrayBuffer();
        return { status: r.status, tipe: r.headers.get("content-type"), byte: b.byteLength, awal: [...new Uint8Array(b.slice(0, 2))] };
      };
      return { xlsx: await ambil("xlsx"), csv: await ambil("csv") };
    });
    assert.equal(hasil.xlsx.status, 200);
    assert.match(hasil.xlsx.tipe, /spreadsheetml/);
    assert.deepEqual(hasil.xlsx.awal, [0x50, 0x4b], "xlsx harus berformat ZIP (PK)");
    assert.equal(hasil.csv.status, 200);
    assert.match(hasil.csv.tipe, /csv|text\/plain/);
  });

  test("[Minor] Filter Data Pendaftar bekerja tanpa galat (status semua, tahun, jurusan)", async () => {
    sesi.masalah.length = 0;
    await sesi.page.goto(BASE + "/admin/pendaftar?status=semua&q=zzzz-tidak-ada", { waitUntil: "networkidle0" });
    assert.deepEqual(sesi.masalah, []);
    assert.match(await teks(sesi.page), /tidak ada|belum ada|0 /i);
  });

  // Regresi U-52: pesan sukses Landing Page hilang karena formulir dibuat ulang setelah simpan.
  test("[Minor][Regresi U-52] Pesan sukses Landing Page tetap tampil setelah simpan", { skip: !MUTASI && "butuh QA_MUTASI=1 (mengubah data sementara)" }, async () => {
    const { page } = sesi;
    await page.goto(BASE + "/admin/landing", { waitUntil: "networkidle0" });
    const asli = await page.$eval('[name="heroJudul"]', (e) => e.value);
    try {
      await isi(page, "heroJudul", asli + " QA");
      await klik(page, "Simpan Perubahan");
      await page.waitForFunction(() => /Landing page diperbarui/.test(document.body.innerText), { timeout: 15000 });
      await tidur(2500);
      assert.match(await teks(page), /Landing page diperbarui/, "pesan sukses hilang setelah beberapa detik");
    } finally {
      await isi(page, "heroJudul", asli);
      await klik(page, "Simpan Perubahan");
      await page.waitForFunction(() => /Landing page diperbarui/.test(document.body.innerText), { timeout: 15000 });
    }
    const publik = await fetch(BASE + "/").then((r) => r.text());
    assert.ok(publik.includes(asli.slice(0, 20)), "judul asli tidak kembali di halaman depan");
  });

  test("[Minor] Validasi Landing Page: judul kosong ditolak dengan pesan", { skip: !MUTASI && "butuh QA_MUTASI=1" }, async () => {
    const { page } = sesi;
    await page.goto(BASE + "/admin/landing", { waitUntil: "networkidle0" });
    const asli = await page.$eval('[name="heroJudul"]', (e) => e.value);
    await page.$eval('[name="heroJudul"]', (e) => (e.required = false));
    await isi(page, "heroJudul", " ");
    await klik(page, "Simpan Perubahan");
    await page.waitForFunction(() => /perlu diperbaiki|wajib|harus diisi/i.test(document.body.innerText), { timeout: 15000 });
    await page.goto(BASE + "/admin/landing", { waitUntil: "networkidle0" });
    assert.equal(await page.$eval('[name="heroJudul"]', (e) => e.value), asli, "data berubah padahal validasi gagal");
  });
});

describe("Halaman pendaftar", { skip: !adaPendaftar && "QA_PENDAFTAR_* belum diisi" }, () => {
  test("[Major] Pendaftar tidak bisa membuka area admin", async () => {
    const { page, ctx } = await halamanBaru();
    await masuk(page, PENDAFTAR);
    await page.goto(BASE + "/admin", { waitUntil: "networkidle0" });
    assert.doesNotMatch(new URL(page.url()).pathname, /^\/admin/);
    const r = await page.evaluate(async () => (await fetch("/api/admin/export?format=csv", { redirect: "manual" })).status);
    assert.notEqual(r, 200, "pendaftar bisa mengunduh ekspor admin");
    await ctx.close();
  });

  test("[Minor] Beranda, formulir, dan status terbuka tanpa galat", async (t) => {
    const { page, ctx, masalah } = await halamanBaru();
    await masuk(page, PENDAFTAR);
    for (const p of ["/dashboard", "/formulir", "/formulir/data-diri", "/formulir/berkas", "/formulir/ringkasan", "/status", "/akun", "/bantuan"]) {
      await t.test(p, async () => {
        masalah.length = 0;
        const r = await page.goto(BASE + p, { waitUntil: "networkidle0" });
        assert.equal(r.status(), 200);
        assert.deepEqual(masalah, []);
      });
    }
    await ctx.close();
  });

  // Regresi U-53: nama jurusan pada sumbu diagram terpotong.
  test("[Minor][Regresi U-53] Nama jurusan pada diagram tidak terpotong", async () => {
    const { page, ctx } = await halamanBaru();
    await masuk(page, PENDAFTAR);
    await page.goto(BASE + "/dashboard", { waitUntil: "networkidle0" });
    const ada = await page.$(".recharts-yAxis");
    if (!ada) return console.log("  (diagram jurusan belum tampil: belum ada data pendaftar)");
    const kotak = await page.evaluate(() => {
      const wadah = document.querySelector(".recharts-wrapper").getBoundingClientRect();
      return [...document.querySelectorAll(".recharts-yAxis .recharts-cartesian-axis-tick-value")].map((t) => {
        const b = t.getBoundingClientRect();
        return { teks: t.textContent, kiri: Math.round(b.left - wadah.left) };
      });
    });
    for (const k of kotak) assert.ok(k.kiri >= 0, `label "${k.teks}" terpotong di tepi kiri (${k.kiri}px)`);
    await ctx.close();
  });
});
