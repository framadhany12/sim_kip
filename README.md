# Pendaftaran KIP Kuliah

Aplikasi web pengganti Google Form untuk pendaftaran KIP Kuliah, dibuat mengikuti `../pendaftaran-kip-kuliah-PRD.md`.
Ada dua peran: **Calon Mahasiswa** (pendaftar) dan **Admin** (verifikator).

## Menjalankan

Butuh MySQL atau MariaDB (dikembangkan dengan MariaDB 10.4.32 dari XAMPP).

```bash
npm install
cp .env.example .env.local   # atur DATABASE_URL (default: mysql://root@127.0.0.1:3306/kip_kuliah)
npm run dev                  # http://localhost:3000
```

Saat pertama kali dijalankan, aplikasi otomatis membuat database `kip_kuliah` (utf8mb4) bila belum ada, menjalankan
migrasi dari folder `drizzle/`, lalu mengisi data awal: akun admin (dari `ADMIN_EMAIL`/`ADMIN_PASSWORD`), contoh jurusan, FAQ,
serta dataset wilayah BPS (34 provinsi, 514 kabupaten/kota, 7.215 kecamatan) dari `data/wilayah/*.csv`.

Akun admin bawaan hanya dibuat bila database belum berisi akun sama sekali. Untuk membuat atau mengganti
kata sandi akun admin kapan saja:

```bash
npm run admin:buat -- <email> <kata-sandi> "Nama Admin"
```

Memindahkan data dari database SQLite versi lama (cadangannya ada di `data/sqlite-lama/kip.db`):

```bash
npm run db:migrasi-sqlite -- data/sqlite-lama/kip.db
```

Skrip ini aman dijalankan ulang (baris dengan id yang sama dilewati).

### Migrasi & cadangan database

| Perintah | Fungsi |
|---|---|
| `npm run db:migrate` | Membuat database (bila belum ada) dan menerapkan semua migrasi di `drizzle/` ke `DATABASE_URL`, tanpa menjalankan aplikasi. Aman diulang. Migrasi juga otomatis dijalankan saat aplikasi start. |
| `npm run db:generate` | Setelah mengubah `src/db/schema.ts`, membuat file migrasi baru di `drizzle/`. |
| `npm run db:backup` | Cadangan lengkap (struktur + data) ke `database/backup/kip_kuliah-<tanggal-jam>.sql` lewat `mysqldump`. Bisa diimpor ke server MySQL/MariaDB lain (phpMyAdmin → Import, atau `mysql -u root < file.sql`). Berisi data pribadi; folder ini tidak di-commit. |

Pindah ke server MySQL baru: atur `DATABASE_URL` ke server tersebut lalu jalankan `npm run db:migrate`
(database kosong + data referensi otomatis), **atau** impor file hasil `npm run db:backup` untuk ikut membawa data pendaftar.

Panduan pemakaian untuk pendaftar dan admin: https://claude.ai/artifact/AkwiSYQ4Q54dz1Un94NVrk

## Pendaftaran akun & verifikasi email

Pendaftar hanya bisa mendaftar dengan **email aktif**, dan akun baru bisa dipakai setelah tautan verifikasi
di email dibuka (berlaku 24 jam). Lapisan anti-bot:

- Domain email harus memiliki server email (cek MX); email sekali pakai (mailinator, yopmail, dll.) ditolak.
- Kolom jebakan tersembunyi (honeypot) dan penolakan formulir yang dikirim terlalu cepat.
- Pembatasan percobaan: daftar 8×/jam per IP, kirim ulang tautan 1×/menit & 5×/jam per email, masuk 10× per 15 menit.
- Pendaftar yang belum terverifikasi tidak bisa masuk; email yang sudah terverifikasi tidak bisa diganti sendiri.

Atur SMTP di `.env.local` (lihat `.env.example`). Tanpa SMTP, tautan hanya dicetak ke log server.
Akun yang sudah ada sebelum fitur ini dianggap terverifikasi.

## Alur

**Calon mahasiswa:** Daftar akun (email) → Verifikasi email → Data Diri → Data Keluarga → Ekonomi Orang Tua (+ Surat Keterangan
Kebutuhan Ekonomi) → Sekolah & Jurusan 1/2 → Unggah 5 berkas → Ringkasan & Kirim → Pantau status → (bila diminta) Perbaiki & kirim ulang.

**Admin:** Masuk → Ringkasan (progres & statistik) → Daftar pendaftar (cari/filter/unduh CSV) → Detail: periksa isian & berkas,
tandai berkas valid/tidak valid, lalu *Tandai Sedang Diperiksa / Minta Perbaikan / Terima / Tolak* → Master Mahasiswa (edit data & atur ulang kata sandi) → Manajemen User (tambah admin, reset sandi admin, profil kontak resmi di halaman Bantuan) → Tahun Ajaran → Kelola jurusan → Jawab pertanyaan → Kelola FAQ.

Status pendaftaran: `draft` → `terkirim` → `diperiksa` → `diterima` / `ditolak`, plus `perbaikan` (formulir dibuka lagi untuk pendaftar).
Setiap perubahan dicatat di `riwayat_status`.

## Aturan yang ditegakkan di server

- Tahun lulus hanya 2024/2025/2026; umur maksimal 21 tahun (diperingatkan saat simpan, pengiriman diblokir).
- Nama ayah & ibu wajib; wali opsional. NIK 16 digit, NPSN 8 digit, nomor HP diawali 08.
- Kecamatan harus milik kabupaten/kota yang dipilih.
- Jurusan 1 ≠ Jurusan 2, dan hanya jurusan aktif yang dibuka admin untuk pilihan tersebut.
- Berkas: PDF/JPG/PNG (dicek dari isi berkas, bukan ekstensi), maks. 2 MB; hanya pemilik & admin yang bisa melihat.
- Data & berkas terkunci setelah dikirim, kecuali admin meminta perbaikan.

## Struktur

```
src/db/schema.ts          skema Drizzle (sesuai PRD + sessions, password_resets, pertanyaan)
src/db/index.ts           koneksi MySQL (mysql2), pembuatan database, migrasi otomatis, seed
drizzle/                  file migrasi SQL MySQL (buat baru: npm run db:generate)
scripts/                  buat-admin, migrasi-sqlite-ke-mysql
src/lib/                  auth (sesi cookie + scrypt), aturan pendaftaran, query admin, storage berkas
src/lib/profil.ts          teks landing page (Tentang KIP Kuliah & Politeknik TEDC) — ubah di sini
public/logo-tedc.png      logo Politeknik TEDC Bandung (juga dipakai sebagai favicon: src/app/icon.png)
src/app/actions/          server actions (auth, formulir, admin, bantuan)
src/app/(auth)/           masuk, daftar, lupa & reset sandi
src/app/(pendaftar)/      dashboard, formulir/*, status, akun
src/app/admin/            panel admin
src/app/api/              unggah/lihat berkas, wilayah, ekspor CSV
```

## Catatan untuk produksi

- **Email:** isi `SMTP_*` dan `APP_URL` di `.env.local`; tanpa itu verifikasi email dan lupa kata sandi tidak terkirim.
- **Pembatas percobaan** disimpan di memori proses; bila aplikasi dijalankan di beberapa server, pindahkan ke Redis/database.
- **Penyimpanan berkas:** disimpan di folder `storage/` lokal. Untuk Vercel (filesystem tidak permanen), ganti fungsi di
  `src/lib/storage.ts` dengan R2/S3/Supabase Storage, dan arahkan `DATABASE_URL` ke server MySQL yang dapat dijangkau.
- **Database:** buat user MySQL khusus aplikasi (bukan `root` tanpa kata sandi) dan cantumkan di `DATABASE_URL`.
- Ganti `ADMIN_PASSWORD` default sebelum dipublikasikan.
- Daftar jurusan awal hanyalah contoh — sesuaikan lewat menu **Jurusan** di panel admin.
