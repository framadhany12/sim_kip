# KIP Kuliah — Politeknik TEDC Bandung

Aplikasi pendaftaran KIP Kuliah. Next.js 15 (App Router) + React 19, Drizzle ORM, MariaDB 10.4 (XAMPP), Tailwind. Bahasa UI dan komentar: Indonesia. Balas pengguna dalam bahasa Indonesia.

## Lingkungan
- Windows 11, Git Bash + PowerShell. **Python tidak ada**; pakai Node.
- `.env`: `DATABASE_URL=mysql://root@127.0.0.1:3306/kip_kuliah`, `SMTP_HOST/USER/PASS`. `.env.example` hanya berisi placeholder; **jangan commit sandi asli**. Saat uji lokal kosongkan `SMTP_*` agar tidak ada email terkirim.
- Berkas diabaikan git: `.env*`, `akun-uji.local.md`, `/storage/`, `database/backup`, `/qa/node_modules`. `qa.rar` bukan bagian repo.

## Perintah
- `npm run dev` / `build` / `start`, `npm run lint`, `npx tsc --noEmit`
- `npm run db:generate` (buat migrasi drizzle), `npm run db:migrate`, `npm run db:backup`
- `npm run admin:buat -- email sandi "Nama"` membuat akun admin
- Setelah deploy: `npm install` lalu `npm run db:migrate` (migrasi 0000–0012)

## Struktur
- `src/db/schema.ts` skema Drizzle (users, pendaftaran, data_diri, data_sekolah, pilihan_jurusan, jurusan, jenis_beasiswa, riwayat, dst). Migrasi di `drizzle/`.
- `src/app/(auth)` daftar/masuk/lupa sandi/verifikasi. `src/app/(pendaftar)` dashboard, formulir (multi-tahap), status, akun. `src/app/admin/*` panel admin (pendaftar, pengumuman, diterima, ditolak, mahasiswa, jurusan, beasiswa, tahun-ajaran, landing, faq, pertanyaan, user, akun, rekomendasi).
- `src/app/actions/*.ts` server actions: `formulir.ts` (kirim pendaftaran, `jawabPengusulan`), `admin.ts` (`umumkanMassal`, keputusan satuan, ekspor), `auth.ts`, `mahasiswa.ts`, dll.
- `src/lib/*`: `constants.ts` (label, alasan, desil), `pengumuman.ts` (kandidat pengumuman massal), `admin-query.ts`, `mail.ts`, `storage.ts` (berkas di `/storage`), `tahun.ts`.
- `src/components`: komponen UI; `admin/` dan `pendaftar/` untuk khusus peran.
- `qa/`: suite uji otomatis (API + puppeteer-core). Lihat `qa/README.md`.

## Alur seleksi
Tahap: administrasi → ujian → wawancara → pengusulan → pengumuman.
- Kirim formulir: desil 5, atau desil 6-10 tanpa PIP, otomatis "Tidak lolos Seleksi Administrasi" (+ email pengumuman).
- Menu Admin > Pengumuman: Lolos administrasi | Sudah ujian | Sudah wawancara | Pengusulan | Tidak diterima | Diterima.
  - "Sudah wawancara" hanya menandai `pendaftaran.wawancara_selesai` (tahap tetap Wawancara).
  - "Pengusulan" memindahkan yang ditandai ke tahap pengusulan dengan `usulan='menunggu'`.
  - Pendaftar menjawab di `/status` (`FormUsulan`): bersedia → `usulan='bersedia'` (status Diusulkan, tidak bisa mundur); tidak → ditolak, alasan "Tidak Bersedia Diusulkan", teks di `alasan_tidak_bersedia`.
  - Yang `menunggu` tidak muncul di pengumuman Diterima/Tidak diterima.
- Email hanya untuk pengumuman massal diterima/tidak diterima (dan tidak lolos administrasi otomatis).
- Diterima: wajib pilih jurusan (1 atau 2) dan **jenis beasiswa** (master `/admin/beasiswa`; hanya terlihat admin, jangan tampilkan ke pendaftar).
- Registrasi/login pakai email atau NIK (`users.nik` unik, terkunci di Data Diri untuk pendaftar). Akun belum terverifikasi >24 jam melepas NIK.

## Aturan kerja dengan pengguna
- Jangan menulis/menawarkan tes `qa/` untuk fitur baru kecuali diminta.
- Konfirmasi dulu sebelum tindakan sulit dibalik atau keluar (push, hapus data). Jangan ubah/hapus akun pengguna di DB lokal (admin@kip.local, frs@poltektedc.ac.id, ari@gmail.com, isal21@gmail.com).
- Akun uji buatan Claude (qa.admin@kip.test, uji.*) dihapus setelah uji.
- Atribusi commit: akhiri pesan dengan `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Remote GitHub tujuan: `https://github.com/framadhany12/kip_kuliah.git` (belum terpasang; pengguna menjalankan push sendiri).

## Uji E2E (pola)
Build produksi `NEXT_DIST_DIR=.next-uji npx next build`, `next start -p 3120`, skrip sementara di `qa/` dengan puppeteer-core, akun QA via `admin:buat`, lalu matikan server dan hapus `.next-uji`. `next dev` kurang andal untuk uji aksi server.

## Belum diuji
Email sungguhan (Gmail), uji beban, browser selain Chrome, tampilan visual manual perubahan terbaru.
