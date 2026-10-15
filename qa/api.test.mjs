// Tes tingkat HTTP tanpa browser: ketersediaan halaman, kontrol akses, dan batas unggah.
// Tidak butuh akun dan tidak mengubah data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE } from "./config.mjs";

const ambil = (path, opsi = {}) => fetch(BASE + path, { redirect: "manual", ...opsi });
const dialihkanKeMasuk = (r) => [301, 302, 303, 307, 308].includes(r.status) && /\/masuk/.test(r.headers.get("location") ?? "");
const ditolak = (r) => r.status === 401 || r.status === 403 || dialihkanKeMasuk(r);

test("[Major] Halaman publik dapat dibuka tanpa galat", async (t) => {
  for (const p of ["/", "/masuk", "/daftar", "/lupa-sandi", "/bantuan"]) {
    await t.test(p, async () => {
      const r = await ambil(p);
      assert.equal(r.status, 200, `${p} mengembalikan ${r.status}`);
      assert.match(r.headers.get("content-type") ?? "", /text\/html/);
    });
  }
});

test("[Major] Halaman pendaftar dan admin tidak bisa diakses tanpa login", async (t) => {
  const rute = ["/admin", "/admin/pendaftar", "/admin/user", "/admin/landing", "/admin/diterima", "/admin/ditolak", "/dashboard", "/formulir/data-diri", "/formulir/berkas", "/status", "/akun"];
  for (const p of rute) {
    await t.test(p, async () => {
      const r = await ambil(p);
      assert.ok(dialihkanKeMasuk(r), `${p} seharusnya dialihkan ke /masuk, malah ${r.status} ${r.headers.get("location") ?? ""}`);
    });
  }
});

test("[Major] Endpoint API tertutup bagi tamu", async (t) => {
  await t.test("ekspor admin (xlsx)", async () => {
    const r = await ambil("/api/admin/export?format=xlsx");
    assert.ok(ditolak(r), `ekspor terbuka untuk tamu: ${r.status}`);
  });
  await t.test("ekspor admin (csv)", async () => {
    const r = await ambil("/api/admin/export?format=csv");
    assert.ok(ditolak(r), `ekspor terbuka untuk tamu: ${r.status}`);
  });
  await t.test("statistik admin", async () => {
    const r = await ambil("/api/admin/statistik");
    assert.ok(ditolak(r), `statistik terbuka untuk tamu: ${r.status}`);
  });
  await t.test("unduh berkas pendaftar", async () => {
    const r = await ambil("/api/berkas/1");
    assert.notEqual(r.status, 200, "berkas bisa diunduh tanpa login");
    assert.ok(r.status < 500, `galat server: ${r.status}`);
  });
  await t.test("unggah berkas tanpa login", async () => {
    const fd = new FormData();
    fd.set("jenis", "ktp");
    fd.set("file", new Blob(["%PDF-1.4 uji"], { type: "application/pdf" }), "uji.pdf");
    const r = await ambil("/api/berkas", { method: "POST", body: fd });
    assert.equal(r.status, 401);
  });
});

test("[Minor] Unggah berkas di atas 2 MB ditolak lebih awal (413)", async () => {
  const fd = new FormData();
  fd.set("jenis", "ktp");
  fd.set("file", new Blob([new Uint8Array(3 * 1024 * 1024)], { type: "application/pdf" }), "besar.pdf");
  const r = await ambil("/api/berkas", { method: "POST", body: fd });
  assert.equal(r.status, 413);
  assert.match((await r.json()).error, /2 MB/);
});

test("[Minor] Token verifikasi dan reset yang tidak valid tidak menyebabkan galat server", async () => {
  for (const p of ["/verifikasi/token-ngawur", "/reset-sandi/token-ngawur"]) {
    const r = await ambil(p);
    assert.ok(r.status < 500, `${p} → ${r.status}`);
  }
});

test("[Minor] Rute tak dikenal menampilkan 404, bukan galat server", async () => {
  const r = await ambil("/halaman-yang-tidak-ada");
  assert.equal(r.status, 404);
});

test("[Major] Parameter berbahaya pada API wilayah tidak menimbulkan galat server", async () => {
  for (const q of ["", "?kabupatenId=abc", "?kabupatenId=1%27%20OR%201=1--", "?kabupatenId=-1"]) {
    const r = await ambil("/api/wilayah/kecamatan" + q);
    assert.ok(r.status < 500, `${q} → ${r.status}`);
  }
});

test("[Minor] Respons halaman tidak membocorkan header teknologi berlebih", async () => {
  const r = await ambil("/");
  assert.equal(r.headers.get("x-powered-by"), null, "header X-Powered-By sebaiknya dimatikan di produksi");
});
