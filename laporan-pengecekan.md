# Laporan Pengecekan Fungsional — KIP Kuliah Politeknik TEDC

Tanggal: 17 Oktober 2026 · Cakupan: seluruh alur dari registrasi sampai kegiatan/presensi · Lingkungan: build produksi (`next build` + `next start`), Chrome headless, MariaDB lokal.

## Ringkasan

| Pemeriksaan | Hasil |
|---|---|
| Uji E2E menyeluruh (skrip puppeteer sementara, 16 bagian) | **126 dari 126 lulus** (dijalankan 2×, hasil sama) |
| Suite `qa/` yang sudah ada (API + UI admin) | **54 lulus, 0 gagal**, 2 dilewati (butuh `QA_MUTASI=1`), 1 grup dilewati (butuh akun pendaftar) |
| Tinjauan kode (skill `code-review`, tingkat high, commit `bb9e20d`) | **10 temuan**; 8 diperbaiki, 2 dicatat (lihat bawah) |
| `tsc --noEmit` dan `eslint` | bersih |
| Galat konsol browser selama uji | 0 (setelah perbaikan hydration) |

Pengujian menemukan **2 bug nyata** (desil/PIP bisa diubah mahasiswa, IPK kosong tersimpan 0,00) dan beberapa kelemahan kecil. Semuanya sudah diperbaiki dan diuji ulang, kecuali yang tercatat di bagian "Belum diperbaiki".

## Metode

1. **Skill `code-review`** pada diff commit terakhir (agen terpisah), lalu setiap temuan dicoba dibuktikan lewat uji.
2. **Skill `security-review`** tidak bisa jalan: repo belum punya remote (`origin/HEAD`). Aspek keamanan diperiksa lewat uji kontrol akses dan temuan review, bukan audit keamanan penuh.
3. **Suite `qa/`** yang sudah ada, dijalankan terhadap build produksi di port uji.
4. **Skrip E2E sementara** (puppeteer) yang mengerjakan alur nyata lewat browser dan memverifikasi hasilnya di database. Skrip dan data ujinya sudah dihapus.

## Hasil per area (E2E)

| Area | Lulus | Yang diperiksa |
|---|---|---|
| Halaman publik | 6/6 | Landing, Bantuan, Daftar, Masuk, Lupa sandi; tahun lulus di landing mengikuti tahun berjalan |
| Kontrol akses | 16/16 | 8 halaman tertutup bagi tamu; 6 endpoint API menolak tamu; mahasiswa tidak dapat kode barcode admin (403); mahasiswa yang membuka halaman admin dialihkan |
| Registrasi & login | 5/5 | Daftar, NIK ganda ditolak, login ditolak sebelum verifikasi email, login berhasil setelah verifikasi |
| Formulir pendaftar | 11/11 | 6 langkah (data diri, keluarga, ekonomi, sekolah, rekomendasi, berkas), pilihan tahun lulus dinamis, 5 berkas wajib, kirim dengan pernyataan setuju |
| Panel admin | 23/23 | Login; 20 halaman admin terbuka tanpa galat; sidebar grup SIM KIP |
| Seleksi bertahap | 5/5 | Lolos administrasi → ujian → wawancara (hanya menandai) → pengusulan → diterima (jurusan + jenis beasiswa tersimpan) |
| Pengusulan | 6/6 | Pop-up konfirmasi (3 peringatan, Rp20.000.000), tombol "Tidak, kembali" tidak mengirim, "Ya, saya yakin" menyimpan "bersedia", status Diusulkan |
| Akun mahasiswa | 10/10 | Menu Formulir diganti Mahasiswa; `/formulir/*` dialihkan; edit identitas (NIK terkunci, data KIP tidak berubah); NIM & kelas terkunci setelah terisi; jenis beasiswa tidak terlihat mahasiswa |
| Pelaporan IPK | 13/13 | Validasi IPK, simpan, buka transkrip, filter angkatan, belum melapor per semester, export Excel, pengumuman ke mahasiswa, banner hilang setelah melapor |
| Master Mahasiswa | 4/4 | Tabel hanya tampilan; klik nama → detail; admin dapat mengoreksi NIM |
| Kegiatan & presensi | 15/15 | Tambah dan validasi, QR tampil dan berganti otomatis, kode palsu ditolak, presensi via tautan, tidak ganda, rekap + NIM, export Excel, kegiatan selesai ditolak |
| Responsif (390 px) | 6/6 | Tanpa scroll horizontal; menu bawah mahasiswa 6 item |
| Temuan review (dibuktikan) | 3/3 | Lihat bawah |
| Konsol browser | 1/1 | Tanpa galat |

Tangkapan layar yang diperiksa: pop-up pengusulan, halaman Mahasiswa (desktop dan HP), barcode kegiatan. Tampilannya rapi.

## Temuan dan tindak lanjut

| # | Temuan | Tingkat | Status |
|---|---|---|---|
| R1 | Mahasiswa dapat mengubah desil, status PIP, dan nomor KIP lewat input hidden di `/mahasiswa/ubah` (**terbukti**: desil berubah ke 6-10). Padahal data KIP seharusnya terkunci | Tinggi | **Diperbaiki**: nilai dari form diabaikan, data KIP diambil dari database. Diuji ulang |
| R4 | IPK kosong atau spasi diterima dan tersimpan 0,00 (**terbukti**), sehingga mahasiswa tampak sudah melapor | Sedang | **Diperbaiki**: format IPK divalidasi ketat. Diuji ulang |
| R2 | Pada `statistik.ts`, query yang belum di-await bisa menjadi *unhandled rejection* jika salah satu query gagal | Sedang | **Diperbaiki** |
| R3 | Rentang tahun lulus ikut membatasi koreksi data lama oleh admin (mulai 2027 data lulusan 2024 tak bisa dikoreksi); petunjuk di formulir masih menyebut "2024, 2025, 2026" | Sedang | **Diperbaiki**: pembatasan hanya saat pendaftar mengisi; petunjuk dinamis |
| R5 | Stream kamera pemindai bisa bocor (klik "Mulai Pindai" dua kali, atau `play()` gagal) | Sedang | **Diperbaiki** (belum diuji dengan kamera sungguhan) |
| R6 | Bantuan hilang dari menu bawah HP mahasiswa, sedangkan teks menyuruh "hubungi admin lewat halaman Bantuan" | Rendah | **Diperbaiki sebagian**: pesan kini berisi tautan ke Bantuan. Menu bawah tetap 6 item |
| R7 | `/api/presensi` dengan token bukan string bisa menghasilkan 500 | Rendah | **Diperbaiki**: tipe divalidasi |
| R8 | Dua penyimpanan NIM yang sama bersamaan bisa menimbulkan error 500, bukan pesan "NIM sudah dipakai" | Rendah | **Diperbaiki** |
| R9 | Unggah transkrip: berkas baru tidak dibersihkan bila penyimpanan database gagal; gagal menghapus berkas lama menggagalkan laporan yang sudah tersimpan | Rendah | **Sebagian**: penghapusan berkas lama tidak lagi fatal. Berkas yatim bila DB gagal masih mungkin |
| R10 | Tab Umumkan menjalankan hingga 30 query berurutan | Rendah | **Diperbaiki**: satu query |
| H1 | Galat hydration React #418 sesekali di dashboard admin (waktu relatif "x dtk lalu" memakai `Date.now()` berbeda di server dan klien) | Rendah | **Diperbaiki** |

Catatan lain dari tinjauan: sel Excel diberi awalan tanda petik bila diawali `= + - @`. Itu pola yang sudah dipakai export pendaftar, jadi tidak diubah. Efek sampingnya, tanda petik itu tampil di Excel untuk teks yang memang diawali karakter tersebut (jarang).

## Hal yang berjalan baik (diamati saat uji)

- Pembatas pendaftaran per jaringan bekerja ("Terlalu banyak percobaan pendaftaran dari jaringan ini").
- Validasi domain email menolak domain tanpa MX (`kip.test`).
- Jebakan bot (kolom tersembunyi dan waktu kirim) tidak mengganggu pengguna normal.
- Kode QR kegiatan benar-benar berganti, dan kode lama kedaluwarsa.

## Belum diuji

- **Pemindaian kamera sungguhan** dan pembacaan QR di HP. Yang diuji hanya halaman pemindai, API presensi, dan tautan barcode. Kamera butuh HTTPS atau `localhost`.
- **Pengiriman email** (SMTP dikosongkan saat uji).
- Jalur **tidak bersedia diusulkan**, **ditolak**, penolakan otomatis desil 5 / desil 6-10 tanpa PIP, "perbaikan", keputusan satuan admin, reset kata sandi, Manajemen User, edit Landing/FAQ/Tahun Ajaran/Jurusan/Beasiswa (halamannya hanya diuji terbuka tanpa galat).
- Tes mutasi `qa/` (`QA_MUTASI=1`) tidak dijalankan agar konten Landing Page asli tidak tersentuh.
- Uji beban, browser selain Chrome, dan tampilan pada tablet.
- Pada data asli: satu laporan IPK milik `ari@gmail.com` tidak disentuh.

## Rekomendasi

1. Commit perbaikan hasil pengecekan ini (belum di-commit), lalu `npm run build` dan restart server.
2. Uji pemindaian kamera di HP lewat HTTPS (atau `localhost` dengan USB debugging) sebelum dipakai di kegiatan sungguhan.
3. Tambahkan remote GitHub agar skill `security-review` dapat dijalankan.
4. Kembalikan `.env.example` ke placeholder (berisi sandi SMTP yang tampak asli; tidak di-commit).
5. Pertimbangkan menambah menu Bantuan ke menu bawah mahasiswa atau tautan di halaman Akun.

## Perubahan kode dari pengecekan ini (belum di-commit)

`src/app/actions/akun-mahasiswa.ts`, `src/app/api/laporan-akademik/route.ts`, `src/app/api/presensi/route.ts`, `src/lib/statistik.ts`, `src/lib/simpan-pendaftaran.ts`, `src/lib/pelaporan-akademik.ts`, `src/components/pendaftaran-fields.tsx`, `src/components/pendaftar/form-akademik.tsx`, `src/components/pendaftar/pindai-presensi.tsx`, `src/components/admin/dashboard-live.tsx`, `src/app/(pendaftar)/formulir/ringkasan/page.tsx` (merapikan kalimat).

---

# Lampiran: Uji lanjutan (jalur yang sebelumnya belum diuji) dan uji beban

Tanggal: 17 Oktober 2026 · Server uji: build produksi di port 3120, **SMTP dinonaktifkan** lewat variabel lingkungan (`SMTP_HOST=` dikosongkan), akun uji memakai `@kip.test`.

## Insiden yang harus diketahui: email sungguhan terkirim saat pengujian

`.env` proyek ini berisi `SMTP_HOST=smtp.gmail.com` beserta kredensialnya. Aturan di `CLAUDE.md` meminta `SMTP_*` dikosongkan saat uji lokal, **dan itu tidak saya lakukan** pada pengujian sebelum lampiran ini (uji E2E menyeluruh dan dua putaran pertama uji lanjutan). Server uji saat itu memakai SMTP asli, sehingga kemungkinan besar email terkirim ke alamat Gmail fiktif yang saya buat:

| Alamat | Email yang mungkin terkirim |
|---|---|
| `uji.qa.satu@gmail.com` | verifikasi akun, pengumuman diterima/tidak (beberapa kali, tiap putaran uji E2E) |
| `uji.qb.1@gmail.com`, `uji.qb.2@gmail.com` | pengumuman otomatis "Tidak lolos Seleksi Administrasi (desil)" |
| `uji.qb.6@gmail.com` | pengumuman "Tidak diterima" |
| `uji.qb.9@gmail.com` | tautan atur ulang kata sandi (beberapa) dan pemberitahuan kata sandi diubah |

Pengirimnya `pmb@poltektedc.ac.id`. Jumlah pastinya tidak bisa saya pastikan (saya tidak membaca kotak Terkirim). Yang perlu Anda cek: folder **Terkirim** akun itu, dan pertimbangkan bahwa alamat-alamat tersebut bisa saja milik orang lain atau tidak ada (bounce). Tidak ada data nyata yang dikirim; isinya hanya nama uji dan tautan yang sudah tidak berlaku (akun/token sudah dihapus). Setelah itu, semua pengujian dijalankan dengan SMTP nonaktif dan dibuktikan lewat log server (`[email] (SMTP belum diatur) …`), dengan pemeriksaan awal yang menghentikan skrip bila SMTP masih aktif.

## Hasil uji lanjutan: 67 dari 67 lulus

| Area | Lulus | Yang diperiksa |
|---|---|---|
| Penolakan otomatis desil | 9/9 | Desil 5 dan 6-10 **tanpa PIP** → langsung "Tidak lolos Seleksi Administrasi" (alasan "Desil Tidak Sesuai Ketentuan", riwayat tercatat, diarahkan ke /status). Desil 5 dan 6-10 **dengan PIP** tidak ditolak. Pendaftar yang gugur tidak melihat tombol kirim lagi |
| Tidak bersedia diusulkan | 8/8 | Kirim tanpa pilihan ditolak; kolom alasan muncul; alasan kosong dan 3 karakter ditolak; jawaban sah → status ditolak, alasan "Tidak Bersedia Diusulkan", teks pendaftar tersimpan; form hilang; riwayat tepat satu kali |
| Mahasiswa Ditolak (admin) | 4/4 | Daftar memuat yang gugur desil dan tidak bersedia, alasan tampil, desil dengan PIP tidak ikut; detail menampilkan alasan tulisan pendaftar |
| Keputusan satuan admin | 14/14 | Draft: form tidak tersedia. Tidak lolos administrasi + catatan; pendaftar melihat alasan dan catatan. Koreksi ke Lolos → Ujian. Diterima + jurusan + beasiswa (jurusan hanya Jurusan 1/2 pilihan); akun berubah jadi akun mahasiswa. Koreksi ke Tidak diterima: jurusan dan beasiswa dikosongkan. Pindah ke Pengusulan: usulan "menunggu". Riwayat mencatat semua perubahan |
| Pengumuman massal "Ditolak" | 6/6 | Pendaftar yang masih "menunggu jawaban" tidak muncul dan tidak tersentuh; tombol nonaktif sebelum alasan dipilih; hasil, alasan, dan tampilan pendaftar benar; pendaftar ditolak tidak dapat membuka menu Mahasiswa |
| Reset kata sandi | 25/25 | Pesan generik untuk email tak terdaftar (tidak membocorkan akun) dan tidak ada tautan dibuat; format email salah ditolak; token disimpan sebagai hash dan berlaku ±60 menit; permintaan baru membatalkan tautan lama; sandi lemah dan konfirmasi beda ditolak; reset berhasil mencabut **semua sesi lama**; sandi lama gagal, sandi baru berhasil; token sekali pakai, palsu, dan kedaluwarsa menampilkan "Tautan tidak berlaku" tanpa form; permintaan ke-4 per email dalam sejam dibatasi |
| Konsol | 1/1 | Tanpa galat JavaScript |

Catatan perilaku (bukan bug): dropdown "Alasan tidak lolos" hanya punya satu pilihan dan terisi otomatis; dropdown jurusan/beasiswa pada keputusan Diterima terisi bawaan, jadi admin tidak bisa tidak sengaja menyimpan Diterima tanpa jurusan, tetapi bisa tidak sadar memakai pilihan pertama. Pembatas permintaan reset per IP (10/jam) disimpan di memori server dan terkena saat uji berulang, itu pembatasan yang diharapkan.

## Uji beban (data sintetis 3.000 pendaftar, 2.600 riwayat; satu proses Node + MariaDB lokal)

**Latensi satu permintaan (hangat):**

| Halaman | Waktu |
|---|---|
| Landing, /admin, /dashboard, /status, API statistik | 5–30 ms |
| Data Pendaftar (hal. 1 / hal. 50 / cari nama) | 66–113 ms |
| Pengumuman (kandidat, 424 KB), Master Calon Mahasiswa | 60–125 ms |
| Export CSV semua pendaftar (1,5 MB) | ±235 ms |
| **Export Excel semua pendaftar** | **±1,0–1,3 detik** |

**Konkurensi (tanpa satu pun galat, 0 dari ±14.000 permintaan):**

| Skenario | Konkuren | Throughput | p50 | p95 | p99 |
|---|---|---|---|---|---|
| Landing publik | 50 | 107 rps | 460 ms | 520 ms | 705 ms |
| Halaman masuk | 50 | 198 rps | 254 ms | 273 ms | 285 ms |
| Admin /admin (dashboard) | 20 | 86 rps | 231 ms | 265 ms | 294 ms |
| API statistik (polling) | 40 | 604 rps | 65 ms | 77 ms | 94 ms |
| **Admin daftar pendaftar** | 20 | **23 rps** | 855 ms | 1,1 dtk | 1,15 dtk |
| Admin cari `LIKE '%99%'` | 10 | 24 rps | 425 ms | 526 ms | 557 ms |
| Pendaftar /dashboard | 40 | 74 rps | 509 ms | 785 ms | 1,2 dtk |
| Pendaftar /status | 40 | 86 rps | 467 ms | 522 ms | 711 ms |
| **Campuran** (30 pendaftar + 5 admin dashboard + 5 admin daftar + 20 publik) | 60 | — | dashboard pendaftar 757 ms; **daftar admin 1,8 dtk** | 1,0–2,2 dtk | — |

Server tetap sehat sesudah beban (halaman masuk 200). Memori proses: 244 MB di awal, puncak ±1,3 GB selama beban dashboard/daftar admin, turun ke ±720 MB sesudahnya.

**Pembacaan hasil:**
- Cukup untuk skala wajar (ratusan pendaftar serentak membuka halaman akun: p95 ±1 dtk pada 30–40 koneksi sekaligus). Perbaikan cache statistik terbukti: API statistik 604 rps pada 40 koneksi.
- **Halaman terberat adalah Data Pendaftar admin** (join ±14 tabel): hanya ±23 permintaan/detik dan menjadi lambat (1,8 dtk) saat bersamaan dengan beban lain. Satu admin tidak akan merasakannya; banyak admin sekaligus ya.
- Export Excel penuh (±1 dtk CPU) menahan proses Node selama berjalan. Hindari menjalankannya saat jam pengumuman ramai.
- Memori naik hingga 1,3 GB pada beban admin; perhatikan bila server produksi kecil.
- Batas: ini satu proses Node dengan satu mesin database, bukan uji kapasitas produksi. Tidak diuji: login massal (kata sandi di-hash scrypt, sengaja lambat), unggah berkas serentak, jaringan nyata.

**Saran jika kelak dibutuhkan (belum dikerjakan):** pagination query daftar pendaftar dua tahap (ambil 25 id dulu, baru join detail), jalankan dengan beberapa instance Node / PM2 cluster, dan batasi export penuh di luar jam sibuk.
