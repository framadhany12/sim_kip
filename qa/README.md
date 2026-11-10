# Uji black box SIM KIP

Menguji aplikasi hanya lewat HTTP dan browser (Chrome + puppeteer-core), tanpa memanggil kode aplikasi. Akun uji (`qa.admin.*@kip.test`, `uji.*@kip.test`) dibuat langsung di DB lokal lalu dihapus di akhir, jadi tidak perlu email atau authenticator.

```
cd qa && npm install            # sekali saja
cd ..
NEXT_DIST_DIR=.next-uji npx next build
MFA_KEY=kunci-uji SMTP_HOST= SMTP_USER= SMTP_PASS= NEXT_DIST_DIR=.next-uji npx next start -p 3120
MFA_KEY=kunci-uji node qa/blackbox.mjs      # nilai MFA_KEY harus sama dengan server
```

Opsi: `BASE_URL` (bawaan `http://localhost:3120`), `CHROME_PATH`, `LAPORAN`. Hasil ditulis ke `qa/hasil-blackbox.md`; kode keluar 1 bila ada yang gagal.
Gunakan DB lokal, bukan DB produksi. Matikan server dan hapus `.next-uji` setelah selesai.

Cakupan: halaman publik & PWA (manifest, aset, service worker, petunjuk pasang iPhone/Android), proteksi akses, daftar/masuk/keluar pendaftar, semua tahap formulir, area mahasiswa, lapor IPK + ganti + validasi, login admin 2 langkah, seluruh menu admin, ekspor Excel, hapus laporan IPK.
Belum: unggah berkas formulir pendaftaran, keputusan seleksi/pengumuman massal, email sungguhan, presensi QR dengan kamera, impor Excel.
