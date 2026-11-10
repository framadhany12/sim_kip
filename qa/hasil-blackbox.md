# Hasil uji black box SIM KIP

Waktu: 10/11/2026, 10.09.07 · Target: http://localhost:3120
Total 109 kasus: 109 lulus, 0 gagal. 
Akun uji dihapus (0 sisa).


## A. Halaman publik & PWA

| ID | Kasus | Hasil | Catatan |
|---|---|---|---|
| A-/ | Halaman Beranda tampil | Lulus |  |
| A-/masuk | Halaman Masuk tampil | Lulus |  |
| A-/daftar | Halaman Daftar tampil | Lulus |  |
| A-/lupa-sandi | Halaman Lupa sandi tampil | Lulus |  |
| A-/bantuan | Halaman Bantuan tampil | Lulus |  |
| A-HERO | Beranda memuat tombol Buat akun & Masuk | Lulus |  |
| A-404 | URL tidak ada menampilkan 404 | Lulus |  |
| A-MANIFEST | Manifest PWA lengkap | Lulus |  |
| A-/icons/icon-192.png | Aset PWA /icons/icon-192.png | Lulus |  |
| A-/icons/icon-512.png | Aset PWA /icons/icon-512.png | Lulus |  |
| A-/icons/maskable-512.png | Aset PWA /icons/maskable-512.png | Lulus |  |
| A-/apple-icon.png | Aset PWA /apple-icon.png | Lulus |  |
| A-/offline.html | Aset PWA /offline.html | Lulus |  |
| A-/sw.js | Aset PWA /sw.js | Lulus |  |
| A-SW | Service worker terdaftar & aktif | Lulus |  |
| A-PWA-iPhone | Petunjuk pasang untuk iPhone | Lulus |  |
| A-PWA-Android | Petunjuk pasang untuk Android | Lulus |  |
| A-HEADER | Header keamanan terpasang | Lulus |  |

## B. Proteksi akses tanpa login

| ID | Kasus | Hasil | Catatan |
|---|---|---|---|
| B-/dashboard | /dashboard dialihkan ke Masuk | Lulus |  |
| B-/formulir/data-diri | /formulir/data-diri dialihkan ke Masuk | Lulus |  |
| B-/status | /status dialihkan ke Masuk | Lulus |  |
| B-/akun | /akun dialihkan ke Masuk | Lulus |  |
| B-/mahasiswa | /mahasiswa dialihkan ke Masuk | Lulus |  |
| B-/mahasiswa/ipk | /mahasiswa/ipk dialihkan ke Masuk | Lulus |  |
| B-/admin | /admin dialihkan ke Masuk | Lulus |  |
| B-/admin/pendaftar | /admin/pendaftar dialihkan ke Masuk | Lulus |  |
| B-/admin/pelaporan | /admin/pelaporan dialihkan ke Masuk | Lulus |  |
| B-/admin/master-mahasiswa | /admin/master-mahasiswa dialihkan ke Masuk | Lulus |  |
| B-/admin/user | /admin/user dialihkan ke Masuk | Lulus |  |
| B-/api/admin/export-ipk?tab=laporan | API /api/admin/export-ipk?tab=laporan tanpa sesi tidak membuka data | Lulus |  |
| B-/api/admin/export-buku-tabungan?format=xlsx | API /api/admin/export-buku-tabungan?format=xlsx tanpa sesi tidak membuka data | Lulus |  |
| B-/api/admin/export-master-mahasiswa | API /api/admin/export-master-mahasiswa tanpa sesi tidak membuka data | Lulus |  |
| B-/api/admin/template-sekolah | API /api/admin/template-sekolah tanpa sesi tidak membuka data | Lulus |  |
| B-/api/laporan-akademik/abc | API /api/laporan-akademik/abc tanpa sesi tidak membuka data | Lulus |  |
| B-/api/presensi | API /api/presensi tanpa sesi tidak membuka data | Lulus |  |
| B-/api/berkas/abc | API /api/berkas/abc tanpa sesi tidak membuka data | Lulus |  |

## C. Pendaftar: daftar, masuk, formulir

| ID | Kasus | Hasil | Catatan |
|---|---|---|---|
| C-DAFTAR-VALID | Validasi daftar: sandi tidak sama ditolak | Lulus |  |
| C-DAFTAR-NIK | Validasi daftar: NIK bukan 16 digit ditolak | Lulus |  |
| C-LOGIN-SALAH | Masuk dengan sandi salah ditolak | Lulus |  |
| C-LOGIN-OK | Masuk dengan email benar membuka Dashboard | Lulus |  |
| C-LOGIN-NIK | Masuk dengan NIK juga berhasil | Lulus |  |
| C-FORM-data-diri | Formulir tahap data-diri tampil | Lulus |  |
| C-FORM-keluarga | Formulir tahap keluarga tampil | Lulus |  |
| C-FORM-ekonomi | Formulir tahap ekonomi tampil | Lulus |  |
| C-FORM-sekolah | Formulir tahap sekolah tampil | Lulus |  |
| C-FORM-rekomendasi | Formulir tahap rekomendasi tampil | Lulus |  |
| C-FORM-berkas | Formulir tahap berkas tampil | Lulus |  |
| C-FORM-ringkasan | Formulir tahap ringkasan tampil | Lulus |  |
| C-/dashboard | /dashboard tampil | Lulus |  |
| C-/status | /status tampil | Lulus |  |
| C-/akun | /akun tampil | Lulus |  |
| C-SIMPAN-DIRI | Data Diri dapat diisi & disimpan | Lulus | 20 isian terdeteksi |
| C-KELUAR | Keluar mengakhiri sesi | Lulus |  |

## D. Mahasiswa: menu, NIM/kelas, lapor IPK

| ID | Kasus | Hasil | Catatan |
|---|---|---|---|
| D-MASUK | Mahasiswa masuk ke area mahasiswa | Lulus |  |
| D-/dashboard | /dashboard tampil | Lulus |  |
| D-/mahasiswa | /mahasiswa tampil | Lulus |  |
| D-/mahasiswa/ubah | /mahasiswa/ubah tampil | Lulus |  |
| D-/mahasiswa/ipk | /mahasiswa/ipk tampil | Lulus |  |
| D-/mahasiswa/kegiatan | /mahasiswa/kegiatan tampil | Lulus |  |
| D-/mahasiswa/kegiatan/scan | /mahasiswa/kegiatan/scan tampil | Lulus |  |
| D-/akun | /akun tampil | Lulus |  |
| D-REDIRECT | /formulir diarahkan ke menu Mahasiswa | Lulus |  |
| D-IPK-KIRIM | Mahasiswa melapor IPK + transkrip PNG | Lulus |  |
| D-IPK-DOBEL | Kirim ulang semester sama menggantikan, bukan menggandakan | Lulus |  |
| D-IPK-RENTANG | IPK di atas 4 ditolak | Lulus |  |

## E. Admin: 2 langkah, menu, ekspor, hapus laporan

| ID | Kasus | Hasil | Catatan |
|---|---|---|---|
| E-LOGIN-SALAH | Admin: sandi salah ditolak | Lulus |  |
| E-2FA-SALAH | Admin: kode authenticator salah ditolak | Lulus |  |
| E-2FA-OK | Admin: kode benar membuka panel | Lulus |  |
| E-/admin | /admin tampil | Lulus |  |
| E-/admin/pendaftar | /admin/pendaftar tampil | Lulus |  |
| E-/admin/pengumuman | /admin/pengumuman tampil | Lulus |  |
| E-/admin/diterima | /admin/diterima tampil | Lulus |  |
| E-/admin/ditolak | /admin/ditolak tampil | Lulus |  |
| E-/admin/mahasiswa | /admin/mahasiswa tampil | Lulus |  |
| E-/admin/jurusan | /admin/jurusan tampil | Lulus |  |
| E-/admin/beasiswa | /admin/beasiswa tampil | Lulus |  |
| E-/admin/tahun-ajaran | /admin/tahun-ajaran tampil | Lulus |  |
| E-/admin/landing | /admin/landing tampil | Lulus |  |
| E-/admin/faq | /admin/faq tampil | Lulus |  |
| E-/admin/pertanyaan | /admin/pertanyaan tampil | Lulus |  |
| E-/admin/user | /admin/user tampil | Lulus |  |
| E-/admin/akun | /admin/akun tampil | Lulus |  |
| E-/admin/rekomendasi | /admin/rekomendasi tampil | Lulus |  |
| E-/admin/sekolah | /admin/sekolah tampil | Lulus |  |
| E-/admin/master-mahasiswa | /admin/master-mahasiswa tampil | Lulus |  |
| E-/admin/master-mahasiswa/impor | /admin/master-mahasiswa/impor tampil | Lulus |  |
| E-/admin/dashboard-mahasiswa | /admin/dashboard-mahasiswa tampil | Lulus |  |
| E-/admin/pelaporan | /admin/pelaporan tampil | Lulus |  |
| E-/admin/kegiatan | /admin/kegiatan tampil | Lulus |  |
| E-/admin/buku-tabungan | /admin/buku-tabungan tampil | Lulus |  |
| E-PENDAFTAR-TAB | Master Calon Mahasiswa memuat akun uji & detail tab | Lulus |  |
| E-MASTER-MHS | Master Mahasiswa memuat mahasiswa uji | Lulus |  |
| E-/api/admin/export-ipk?tab=laporan | Ekspor /api/admin/export-ipk?tab=laporan menghasilkan berkas | Lulus |  |
| E-/api/admin/export-ipk?tab=belum | Ekspor /api/admin/export-ipk?tab=belum menghasilkan berkas | Lulus |  |
| E-/api/admin/export-master-mahasiswa | Ekspor /api/admin/export-master-mahasiswa menghasilkan berkas | Lulus |  |
| E-/api/admin/export-buku-tabungan?format=xlsx | Ekspor /api/admin/export-buku-tabungan?format=xlsx menghasilkan berkas | Lulus |  |
| E-/api/admin/template-sekolah | Ekspor /api/admin/template-sekolah menghasilkan berkas | Lulus |  |
| E-/api/admin/template-mahasiswa | Ekspor /api/admin/template-mahasiswa menghasilkan berkas | Lulus |  |
| E-KELOLA-ADMIN | Admin membuka halaman kelola admin lain yang authenticator-nya aktif (bug hosting) | Lulus |  |
| E-KELOLA-PROFIL | Kelola admin lain: simpan profil | Lulus |  |
| E-KELOLA-NONAKTIF | Kelola admin lain: nonaktifkan lalu aktifkan kembali | Lulus |  |
| E-KELOLA-SANDI | Kelola admin lain: atur ulang kata sandi (acak) | Lulus |  |
| E-RESET-2FA | Admin mengatur ulang authenticator admin lain lewat dialog | Lulus |  |
| E-STATISTIK | API statistik admin menjawab | Lulus |  |
| E-PELAPORAN-DETAIL | Detail pelaporan menampilkan IPK 3,80 + transkrip | Lulus |  |
| E-HAPUS-IPK | Admin menghapus laporan IPK, mahasiswa bisa melapor ulang | Lulus |  |
| E-KEGIATAN | Form tambah kegiatan tersedia di admin | Lulus | isian: $ACTION_ID_008bda684141da559034fb9e87e7b7158887b114c2,q,status,tahun,nama,lokasi,mulai,selesai,deskripsi |
| E-KELUAR | Admin keluar mengakhiri sesi | Lulus |  |

## F. Ketahanan

| ID | Kasus | Hasil | Catatan |
|---|---|---|---|
| F-GALAT-JS | Tidak ada galat JavaScript di halaman yang dikunjungi | Lulus |  |
