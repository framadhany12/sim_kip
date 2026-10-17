# KIP Kuliah — Politeknik TEDC Bandung

Aplikasi pendaftaran KIP Kuliah. Next.js 15 (App Router) + React 19, Drizzle ORM, MariaDB 10.4 (XAMPP), Tailwind. Bahasa UI dan komentar: Indonesia. Balas pengguna dalam bahasa Indonesia.

## Lingkungan
- Windows 11, Git Bash + PowerShell. **Python tidak ada**; pakai Node.
- `.env`: `DATABASE_URL=mysql://root@127.0.0.1:3306/sim_kip` (salinan dari kip_kuliah), `SMTP_HOST/USER/PASS`. `.env.example` hanya berisi placeholder; **jangan commit sandi asli**. Saat uji lokal kosongkan `SMTP_*` agar tidak ada email terkirim.
- Berkas diabaikan git: `.env*`, `akun-uji.local.md`, `/storage/`, `database/backup`, `/qa/node_modules`. `qa.rar` bukan bagian repo.

## Perintah
- `npm run dev` / `build` / `start`, `npm run lint`, `npx tsc --noEmit`
- `npm run db:generate` (buat migrasi drizzle), `npm run db:migrate`, `npm run db:backup`
- `npm run admin:buat -- email sandi "Nama"` membuat akun admin
- Setelah deploy: `npm install` lalu `npm run db:migrate` (migrasi 0000–0017)

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

## Akun mahasiswa (setelah diterima)
- Pendaftar dengan `status='diterima'` dan `hasil='diterima'` (`sudahMahasiswa` di `lib/pendaftaran.ts`) dianggap mahasiswa: menu Formulir diganti menu **Mahasiswa** (`/mahasiswa`), `/formulir/*` diarahkan ke sana. Role tetap `pendaftar`.
- Mahasiswa boleh mengubah Identitas & Alamat (`/mahasiswa/ubah`, tanpa data KIP/NIK/jurusan) dan mengisi NIM + kelas, terkunci setelah keduanya terisi (`pendaftaran.nim` unik, `pendaftaran.kelas`). Jurusan hanya admin. Aksi di `actions/akun-mahasiswa.ts`.
- Admin > Master Mahasiswa (`/admin/master-mahasiswa`) = daftar yang diterima. Master Calon Mahasiswa (`/admin/mahasiswa`) = semua akun pendaftar.
- Sidebar admin grup **SIM KIP**: Master Mahasiswa + Pelaporan IPK & Transkrip (`/admin/pelaporan`). Mahasiswa melapor di `/mahasiswa/ipk` (IPK per semester + transkrip PDF/JPG/PNG, tabel `laporan_akademik`, unik per semester; kirim ulang = ganti). Berkas lewat `/api/laporan-akademik[/id]`.
- Grafik rata-rata IPK per angkatan & jurusan (`lib/statistik-ipk.ts`, `components/grafik-ipk.tsx`): tab Grafik IPK di admin dan bagian "Perbandingan IPK" di `/mahasiswa/ipk`; tampilan mahasiswa menyembunyikan kelompok < 3 mahasiswa.
- `/admin/pelaporan` punya tab: Laporan masuk (satu baris per mahasiswa tanpa IPK; klik nama → `/admin/pelaporan/[id]` berisi IPK per semester + transkrip), Belum melapor (per semester), Umumkan. Filter angkatan = tahun akun dibuat (WIB). Export Excel: `/api/admin/export-ipk?tab=laporan|belum&...filter`. Pengumuman ke mahasiswa (`pengumuman_mahasiswa`) hanya banner di akun (tanpa email); yang terkait semester hilang otomatis setelah mahasiswa melapor semester itu.
- Kegiatan kemahasiswaan: admin `/admin/kegiatan` (tambah, hapus, detail dengan barcode QR berganti tiap 30 dtk + rekap + export Excel); mahasiswa `/mahasiswa/kegiatan` (daftar, status hadir) dan `/mahasiswa/kegiatan/scan` (kamera). Kode QR = HMAC(`kegiatan.rahasia`, jendela 30 dtk), jendela sebelumnya masih diterima; presensi hanya saat kegiatan berlangsung (`/api/presensi`). Kamera butuh HTTPS atau localhost.
- Mode gelap: kelas `dark` di `<html>` (skrip anti-kedip di `app/layout.tsx`, tombol `components/tombol-tema.tsx`: ikuti perangkat → terang → gelap, disimpan di localStorage `tema`). Cara kerja: di `globals.css` skala slate dibalik di `.dark` dan kelas berwarna (biru/hijau/merah/kuning/sky) ditimpa satu per satu. Pakai kelas berwarna baru (latar 50–200, teks 500–950, garis/ring 100–400)? tambahkan aturannya di blok MODE GELAP. Hindari `bg-slate-900/xx` untuk overlay (pakai `bg-black/xx`).
