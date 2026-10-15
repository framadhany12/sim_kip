# Suite Otomatisasi QA, KIP Kuliah

Tes regresi untuk bug yang pernah ditemukan pada laporan pengujian (mayor, minor, dan galat), plus pengecekan dasar yang layak dijalankan setiap deploy.

| Berkas | Isi | Butuh akun? | Mengubah data? |
|---|---|---|---|
| `api.test.mjs` | Halaman publik, kontrol akses, batas unggah 2 MB, token ngawur, 404 | Tidak | Tidak |
| `ui.test.mjs` | Login, semua halaman admin, ekspor, tampilan ponsel, regresi U-52 dan U-53 | Ya (admin, opsional pendaftar) | Hanya dengan `QA_MUTASI=1`, nilai dikembalikan |

Tingkat keparahan ada di nama tes: `[Major]` fungsi inti atau keamanan rusak, `[Minor]` tampilan atau validasi.

## Persiapan (sekali)

```bash
cd qa
npm install
```

Perlu Chrome atau Edge terpasang. Bila lokasinya tidak standar, setel `CHROME_PATH`.

## Menjalankan

Jalankan aplikasi dulu (`npm run build && npm start`, atau `npm run dev`), lalu:

```bash
# Hanya API, tanpa akun:
QA_BASE_URL=http://localhost:3000 npm run test:api

# Semua tes, termasuk UI:
QA_BASE_URL=http://localhost:3000 \
QA_ADMIN_EMAIL=admin@kip.local QA_ADMIN_PASSWORD='...' \
QA_PENDAFTAR_EMAIL=... QA_PENDAFTAR_PASSWORD='...' \
npm test

# Tambahkan tes yang menyimpan data (landing page), nilai asli dikembalikan:
QA_MUTASI=1 npm test
```

PowerShell: `$env:QA_ADMIN_EMAIL="..."; $env:QA_ADMIN_PASSWORD="..."; npm test`.

Tes yang akunnya tidak diisi akan dilewati (skip), bukan gagal. Kode keluar bukan nol bila ada tes yang gagal, jadi cocok dipasang di CI.

## Disarankan untuk produksi

- Pakai akun khusus QA, jangan akun admin utama. Simpan sandi di variabel lingkungan atau secret CI, jangan di berkas.
- Jalankan `npm run db:backup` sebelum `QA_MUTASI=1` pada data sungguhan.
- Pengiriman email dan uji beban belum tercakup di sini.

## Menambah tes dari bug baru

1. Tulis tes yang gagal dulu dan beri nama `[Mayor|Minor][Regresi <ID>] deskripsi`.
2. Perbaiki bug sampai tes lulus.
3. Biarkan tes tetap di sini sebagai penjaga.
