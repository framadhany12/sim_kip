// Service worker SIM KIP. Sengaja minimal: halaman dan data akun TIDAK disimpan di perangkat
// (HP bisa dipakai bergantian), hanya halaman "tidak ada koneksi" untuk saat offline.
// Ubah CACHE bila offline.html diganti agar perangkat mengambil versi baru.
const CACHE = "simkip-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/logo-tedc.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nama) => Promise.all(nama.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)));
  // Logo dipakai halaman offline; saat online tetap diambil dari server.
  else if (new URL(e.request.url).pathname === "/logo-tedc.png") e.respondWith(fetch(e.request).catch(() => caches.match("/logo-tedc.png")));
});
