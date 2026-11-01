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
- `npm run sekolah:impor [-- berkas.csv]` mengisi master sekolah dari `database/sekolah-sma-smk.csv` (26.662 SMA/SMK se-Indonesia, salinan Dapodik; tanpa MA). NPSN yang sudah ada dilewati.
- Setelah deploy: `npm install` lalu `npm run db:migrate` (migrasi 0000–0023), lalu `npm run sekolah:impor` sekali untuk mengisi master sekolah

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
- Data Sekolah: nama sekolah dicari dari master `sekolah` (`/api/sekolah`, komponen `pilih-sekolah.tsx`), NPSN terisi otomatis. Pencarian per kata lewat kolom `kata_cari` (`kataCariSekolah`: SMAN=SMA Negeri, Kab.=kabupaten; aturannya juga ada di drizzle/0019 dan scripts/impor-sekolah.mjs, jaga tetap sama). Tidak ada di daftar → isi manual, saat disimpan masuk master dengan `sumber=pendaftar` (NPSN yang sudah ada wajib bernama sama). Admin > Master Sekolah (`/admin/sekolah`, import Excel/CSV kolom NPSN + Nama Sekolah [+ Kabupaten/Kota], templat `/api/admin/template-sekolah`); ubah nama/NPSN ikut memperbarui `data_sekolah` (terhubung lewat NPSN).
- Registrasi/login pakai email atau NIK (`users.nik` unik, terkunci di Data Diri untuk pendaftar). Akun belum terverifikasi >24 jam melepas NIK.
- Detail Master Calon Mahasiswa (`/admin/mahasiswa/[id]`): semua tab dirender sekaligus, pindah tab di klien (`components/admin/tab-detail.tsx`, `?tab=` lewat history). Navigasi RSC antar-`?tab=` di build produksi kadang macet selamanya (tab Data Diri); jangan kembalikan ke `<Link>` per tab.
- Bug React di build produksi (Next 15.5): navigasi/aksi server kadang tertahan selamanya walau respons sudah tiba ("ping" hilang; dev tidak terkena). `components/pemulih-transisi.tsx` di layout root memicu update state kecil 0,3–6 dtk setelah klik/submit/popstate agar React mencoba lagi. Jangan dihapus sebelum Next/React diperbarui dan diuji ulang.

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
- Admin > Master Mahasiswa (`/admin/master-mahasiswa`) = daftar yang diterima.
- Mahasiswa lama (angkatan sebelum aplikasi): admin impor Excel/CSV di `/admin/master-mahasiswa/impor` (kolom Nama, NIK, Email, Angkatan; templat `/api/admin/template-mahasiswa`; `actions/impor-mahasiswa.ts`). Akun: `users.mahasiswa_lama=1`, terverifikasi, sandi awal = NIK + `wajib_ganti_sandi=1` (layout pendaftar menampilkan `FormSandiAwal`); pendaftaran status/hasil diterima + `pendaftaran.angkatan`. Dikecualikan dari data pendaftar, Master Calon Mahasiswa, dan statistik seleksi. Login pertama: ganti sandi, lalu `/lengkapi-data/[bagian]` (data diri, keluarga, ekonomi, sekolah + 1 jurusan = `jurusan_diterima_id`, NIM & kelas; tanpa unggah berkas). Menu Mahasiswa/Dashboard/Status terkunci sampai lengkap (`lib/mahasiswa-lama.ts`, `konteksPendaftar`). Angkatan di Master/Pelaporan/grafik IPK = `angkatanSql` (`lib/angkatan.ts`). Jenis beasiswa diisi admin di detail Master Mahasiswa.
- Status mahasiswa (`pendaftaran.status_mahasiswa`: aktif | dicabut | tidak_aktif | lulus + tanggal + keterangan), hanya admin, di detail Master Mahasiswa (`ubahStatusMahasiswa`). Selain aktif: `users.aktif=false` + sesi dicabut; kembali aktif mengaktifkan akun. Riwayat `riwayat_status.status = "mhs:<status>"`. Akun nonaktif karena status ini tidak bisa diaktifkan dari Master Calon Mahasiswa. "Belum melapor" IPK hanya menghitung mahasiswa aktif. Master Calon Mahasiswa (`/admin/mahasiswa`) = semua akun pendaftar.
- Sidebar admin grup **SIM KIP**: Dashboard Mahasiswa (`/admin/dashboard-mahasiswa`, `lib/statistik-mahasiswa.ts`: total, per status, per angkatan & prodi, rata-rata IPK) + Master Mahasiswa + Pelaporan IPK & Transkrip (`/admin/pelaporan`) + Kegiatan + Buku Tabungan. Mahasiswa melapor di `/mahasiswa/ipk` (IPK per semester + transkrip PDF/JPG/PNG, tabel `laporan_akademik`, unik per semester; kirim ulang = ganti). Berkas lewat `/api/laporan-akademik[/id]`.
- `/dashboard` untuk mahasiswa = Dashboard Mahasiswa KIP (`components/pendaftar/dashboard-mahasiswa.tsx`), bukan ringkasan pendaftaran; menu "Beranda" jadi "Dashboard". Di bawahnya statistik seluruh mahasiswa KIP-K (`components/grafik-mahasiswa.tsx`, dipakai juga admin); IPK kelompok < 3 mahasiswa disembunyikan.
- Buku Tabungan (angkatan >= `ANGKATAN_BUKU_TABUNGAN` = 2026, `lib/buku-tabungan.ts`): mahasiswa kirim No. Rek KIP-K + foto/PDF maks 1 MB di `/mahasiswa/buku-tabungan` (`/api/buku-tabungan`, tabel `buku_tabungan`, satu per mahasiswa, terkunci). Keliru? admin hapus di `/admin/buku-tabungan` (tab Sudah/Belum/Umumkan) lalu mahasiswa kirim ulang. Export Excel/Word dengan foto tertempel: `/api/admin/export-buku-tabungan?format=xlsx|docx&...filter` (tab Sudah; foto diputar sesuai EXIF dan dikecilkan pakai `sharp`; PDF tidak bisa ditempel, diberi catatan). Pengumuman = `pengumuman_mahasiswa.jenis='buku_tabungan'`: banner hanya untuk yang wajib dan belum mengirim; tidak tampil di tab Umumkan IPK. Menu bawah HP tidak memuat Buku Tabungan (sudah 6 item); aksesnya lewat sidebar, kartu di `/mahasiswa`, dan peringatan di dashboard.
- Grafik rata-rata IPK per angkatan & jurusan (`lib/statistik-ipk.ts`, `components/grafik-ipk.tsx`): tab Grafik IPK di admin dan bagian "Perbandingan IPK" di `/mahasiswa/ipk`; tampilan mahasiswa menyembunyikan kelompok < 3 mahasiswa.
- `/admin/pelaporan` punya tab: Laporan masuk (satu baris per mahasiswa tanpa IPK; klik nama → `/admin/pelaporan/[id]` berisi IPK per semester + transkrip), Belum melapor (per semester), Umumkan. Filter angkatan = tahun akun dibuat (WIB). Export Excel: `/api/admin/export-ipk?tab=laporan|belum&...filter`. Pengumuman ke mahasiswa (`pengumuman_mahasiswa`) hanya banner di akun (tanpa email); yang terkait semester hilang otomatis setelah mahasiswa melapor semester itu.
- Kegiatan kemahasiswaan: admin `/admin/kegiatan` (tambah, hapus, detail dengan barcode QR berganti tiap 30 dtk + rekap + export Excel); mahasiswa `/mahasiswa/kegiatan` (daftar, status hadir) dan `/mahasiswa/kegiatan/scan` (kamera). Kode QR = HMAC(`kegiatan.rahasia`, jendela 30 dtk), jendela sebelumnya masih diterima; presensi hanya saat kegiatan berlangsung (`/api/presensi`). Kamera butuh HTTPS atau localhost.
- Mode gelap: kelas `dark` di `<html>` (skrip anti-kedip di `app/layout.tsx`, tombol `components/tombol-tema.tsx`: ikuti perangkat → terang → gelap, disimpan di localStorage `tema`). Cara kerja: di `globals.css` skala slate dibalik di `.dark` dan kelas berwarna (biru/hijau/merah/kuning/sky) ditimpa satu per satu. Pakai kelas berwarna baru (latar 50–200, teks 500–950, garis/ring 100–400)? tambahkan aturannya di blok MODE GELAP. Hindari `bg-slate-900/xx` untuk overlay (pakai `bg-black/xx`).
- PWA (bisa dipasang ke layar utama): `src/app/manifest.ts` (start_url `/dashboard`), ikon dari `Logo Brand 1.png` (root repo) di `public/icons/`, nama aplikasi "SIM KIP" (juga `appleWebApp.title` di layout) + `src/app/apple-icon.png`, service worker `public/sw.js` (hanya build produksi, didaftarkan `DaftarkanSW` di `components/pwa.tsx`). SW sengaja tidak menyimpan halaman/data akun; offline hanya menampilkan `public/offline.html`. Ganti `offline.html`? naikkan `CACHE` di sw.js. Tombol "Pasang aplikasi" (`TombolPasang`) di header situs, pendaftar, dan admin: Chrome/Edge/Android pakai dialog bawaan browser, iPhone menampilkan petunjuk Safari. Wajib HTTPS di server (localhost dikecualikan).
