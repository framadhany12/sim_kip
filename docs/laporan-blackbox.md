# Laporan Pengujian Black Box — SIM KIP

Tanggal: 10 November 2026 · Penguji: Claude (otomatis) · Build: produksi (`next build` + `next start`, port 3120, SMTP dikosongkan)
Metode: black box, hanya dari sisi pengguna (HTTP dan tampilan), tanpa melihat logika internal saat menjalankan kasus uji.

## 0. Pembaruan: suite otomatis `qa/blackbox.mjs`
Setelah laporan ini pertama dibuat, uji dijadikan suite berulang (puppeteer-core + Chrome, build produksi, DB lokal; akun uji dihapus di akhir). Hasil terakhir: **104 kasus, 104 lulus, 0 gagal** (rincian: `qa/hasil-blackbox.md`, cara pakai: `qa/README.md`). Cakupannya melampaui tabel di bawah: daftar/masuk/keluar pendaftar (email dan NIK), 7 tahap formulir, area mahasiswa, lapor IPK (kirim, ganti, tolak IPK > 4), login admin 2 langkah (sandi salah, kode salah, kode benar), 22 menu admin, 6 ekspor/templat, hapus laporan IPK lewat dialog, service worker aktif, petunjuk pasang iPhone dan Android. Satu kegagalan awal (hapus laporan IPK) berasal dari selektor uji yang salah, bukan cacat aplikasi.
Bagian 2.3 dan 3 di bawah adalah catatan awal; yang masih belum tercakup ada di `qa/README.md`.

## 1. Ringkasan

| Kelompok | Kasus | Lulus | Gagal | Catatan |
|---|---|---|---|---|
| Halaman publik | 4 | 4 | 0 | `/faq` memang tidak ada (FAQ dikelola di `/admin/faq`) |
| PWA (aset, manifest, meta) | 12 | 12 | 0 | |
| PWA tampilan per platform | 3 | 3 | 0 | UA iPhone, Android, desktop (Chrome headless) |
| Proteksi akses tanpa login | 8 | 8 | 0 | semua dialihkan ke `/masuk` |
| API tanpa sesi | 6 | 6 | 0 | `GET /api/buku-tabungan` = 405 (hanya POST) |
| Header keamanan, 404 | 2 | 2 | 0 | |
| Lint, typecheck, build produksi | 3 | 3 | 0 | |

Dua kegagalan awal di skrip adalah salah asumsi uji, bukan cacat aplikasi: `/faq` bukan rute publik, dan tombol Pasang baru dirender di klien (tidak ada di HTML server, terkonfirmasi ada setelah JS jalan).

## 2. Kasus uji dan hasil

### 2.1 PWA
| ID | Skenario | Hasil yang diharapkan | Hasil |
|---|---|---|---|
| PWA-01 | Buka `/manifest.webmanifest` | JSON valid: display standalone, start_url `/`, ≥3 ikon termasuk maskable, 2 shortcut | Lulus |
| PWA-02 | Ikon 192, 512, maskable, apple-icon, logo | HTTP 200, tipe gambar | Lulus |
| PWA-03 | `/sw.js` | JavaScript, memuat handler fetch | Lulus |
| PWA-04 | `/offline.html` | HTTP 200 | Lulus |
| PWA-05 | Meta di `<head>` | manifest, theme-color, apple-touch-icon, mobile-web-app-capable, viewport-fit=cover | Lulus |
| PWA-06 | Tombol "Pasang aplikasi" di iPhone (UA Safari iOS 17) | Dialog petunjuk iPhone: Bagikan, Tambahkan ke Layar Utama | Lulus |
| PWA-07 | Tombol di Android (UA Chrome Android) | Dialog petunjuk Android (Chrome/Edge/Firefox, Samsung Internet) | Lulus |
| PWA-08 | Tombol di desktop | Dialog petunjuk Chrome/Edge, Safari Mac, Firefox | Lulus |

Perbaikan yang dilakukan pada pengujian ini:
- Petunjuk kini menyesuaikan platform (sebelumnya semua petunjuk non-iPhone tampil sekaligus).
- iPhone dengan Chrome/Edge/Firefox mendapat petunjuk tombol Bagikan (iOS 16.4+).
- Peringatan "buka di browser" bila dibuka dari dalam aplikasi lain (WhatsApp, Instagram, Facebook, Line, WebView Android).
- Manifest: `display_override`, `categories`, shortcut Dashboard dan Status.
- Tombol Pasang berdenyut singkat (mati bila pengguna memilih reduced-motion).

### 2.2 Akses dan keamanan
| ID | Skenario | Hasil |
|---|---|---|
| AUTH-01..08 | Buka `/dashboard`, `/formulir`, `/status`, `/mahasiswa`, `/admin`, `/admin/pendaftar`, `/admin/pelaporan`, `/admin/master-mahasiswa` tanpa login | Dialihkan ke `/masuk` — Lulus |
| API-01..05 | Ekspor IPK, ekspor buku tabungan, berkas laporan, buku tabungan, templat tanpa sesi | Ditolak/dialihkan (307/401/403/404/405) — Lulus |
| API-06 | `POST /api/presensi` tanpa sesi | Bukan 200 — Lulus |
| SEC-01 | Header | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(self)` — Lulus |
| ERR-01 | URL tidak ada | HTTP 404 — Lulus |

### 2.3 Fitur baru: hapus laporan IPK (admin)
Hanya diperiksa lewat typecheck, lint, dan tinjauan kode: aksi `hapusLaporanIpk` memakai `requireAdmin`, menghapus baris dan berkas transkrip. **Belum diuji dengan klik di browser** (login admin butuh authenticator).

## 3. Yang belum diuji (jujur)
- Alur login/daftar/verifikasi email, formulir multi-tahap, keputusan seleksi, pengumuman massal, Master Mahasiswa, pelaporan IPK, presensi QR, buku tabungan: butuh akun uji, DB, dan 2FA admin. Folder `qa/` yang disebut di CLAUDE.md tidak ada di repo ini, jadi suite otomatis tidak dijalankan.
- Pemasangan PWA di perangkat nyata (Android, iPhone, Samsung Internet): hanya tampilan dialog per user-agent yang diuji, bukan proses instal. Pendaftaran service worker dan mode offline belum diverifikasi di browser (ekstensi Chrome tidak bisa menjangkau server lokal).
- Pemasangan butuh HTTPS di server produksi; localhost dikecualikan.
- Email sungguhan, uji beban, browser selain Chrome (CLAUDE.md "Belum diuji").

## 4. Video tutorial (Remotion)
Animasi ditambahkan di `video-tutorial/src/Tutorial.tsx`: lingkaran latar melayang, bilah kemajuan, lencana langkah memantul (spring), centang pop, gelombang dan toast "Tersimpan" saat tombol ditekan, logo bergoyang, konfeti di penutup. Hasil render: `video-tutorial/out/tutorial-mahasiswa-lama-animasi.mp4` (berkas lama tidak ditimpa).

## 5. Kesimpulan
Tidak ada cacat ditemukan pada bagian yang diuji. Cakupan alur terautentikasi masih kosong dan perlu uji E2E dengan akun uji sebelum rilis.
