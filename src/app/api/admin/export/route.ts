import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { cariPendaftar } from "@/lib/admin-query";
import { DESIL_LABEL, STATUS_NIKAH_LABEL, labelProses, yaTidak } from "@/lib/constants";

const KOLOM: [string, (r: Awaited<ReturnType<typeof cariPendaftar>>["rows"][number]) => unknown][] = [
  ["Tahun Daftar", (r) => new Date(r.daftarPada.getTime() + 7 * 3600e3).getUTCFullYear()],
  ["Tanggal Daftar", (r) => r.daftarPada.toISOString()],
  ["Status / Tahap", (r) => labelProses(r.status, r.tahap, r.usulan)],
  ["Hasil", (r) => (r.hasil === "diterima" ? "Diterima" : r.hasil === "ditolak" ? "Tidak diterima" : "")],
  ["Jurusan Diterima", (r) => r.jurusanDiterima],
  ["Jenis Beasiswa", (r) => r.jenisBeasiswa],
  ["Alasan Tidak Bersedia Diusulkan", (r) => r.alasanTidakBersedia],
  ["Alasan Tidak Lolos/Tidak Diterima", (r) => r.alasanDitolak],
  ["Tanggal Kirim", (r) => r.submittedAt?.toISOString() ?? ""],
  ["No. Pendaftaran KIP Kuliah", (r) => r.nomorKip],
  ["Desil", (r) => (r.desil ? DESIL_LABEL[r.desil] : "")],
  ["Penerima PIP", (r) => (r.penerimaPip == null ? "" : yaTidak(r.penerimaPip))],
  ["Nama Lengkap", (r) => r.nama ?? r.akunNama],
  ["NIK", (r) => r.nik],
  ["NISN", (r) => r.nisn],
  ["Tempat Lahir", (r) => r.tempatLahir],
  ["Tanggal Lahir", (r) => r.tanggalLahir],
  ["Jenis Kelamin", (r) => r.jenisKelamin],
  ["Agama", (r) => r.agama],
  ["Status Pernikahan", (r) => (r.statusPernikahan ? STATUS_NIKAH_LABEL[r.statusPernikahan] : "")],
  ["Email Login", (r) => r.akunLogin],
  ["No. HP/WA", (r) => r.kontak],
  ["Alamat", (r) => r.alamat],
  ["RT", (r) => r.rt],
  ["RW", (r) => r.rw],
  ["Desa/Kelurahan", (r) => r.desa],
  ["Kecamatan", (r) => r.kecamatan],
  ["Kabupaten/Kota", (r) => r.kabupaten],
  ["Provinsi", (r) => r.provinsi],
  ["Nama Ayah", (r) => r.namaAyah],
  ["Nama Ibu", (r) => r.namaIbu],
  ["Nama Wali", (r) => r.namaWali],
  ["HP/WA Orang Tua", (r) => r.teleponOrangTua],
  ["Anggota Keluarga", (r) => r.anggotaKeluarga],
  ["Penghasilan/Bulan", (r) => r.penghasilan],
  ["Pekerjaan Ortu", (r) => r.pekerjaan],
  ["Tanggungan", (r) => r.tanggungan],
  ["Nama Sekolah", (r) => r.sekolah],
  ["NPSN", (r) => r.npsn],
  ["Tahun Lulus", (r) => r.tahunLulus],
  ["Jurusan Sekolah", (r) => r.jurusanSekolah],
  ["Jurusan 1", (r) => r.jurusan1],
  ["Jurusan 2", (r) => r.jurusan2],
  ["Rekomendasi Dari", (r) => r.rekomendasiDari],
  ["Nama Perekomendasi", (r) => r.namaPerekomendasi],
  ["HP Perekomendasi", (r) => r.teleponPerekomendasi],
  ["Catatan Admin", (r) => r.catatanAdmin],
];

function sel(v: unknown) {
  let s = v == null ? "" : String(v);
  // Cegah CSV/formula injection saat dibuka di Excel.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  // NIK/NPSN/no. HP sebagai teks agar Excel tidak mengubahnya ke notasi ilmiah.
  if (/^\d{8,}$/.test(s)) s = `="${s}"`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Sel Excel berupa teks/angka biasa (bukan rumus): awalan = + - @ diberi tanda petik agar tidak dieksekusi. */
function selExcel(v: unknown): string | number {
  if (typeof v === "number") return v;
  const s = v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Tidak diizinkan", { status: 403 });
  const f = Object.fromEntries(new URL(req.url).searchParams);
  const { rows } = await cariPendaftar(f, true);
  const tgl = new Date().toISOString().slice(0, 10);

  if (f.format === "xlsx") {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Pendaftar", { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = KOLOM.map(([h]) => ({ header: h, width: Math.max(14, h.length + 4) }));
    // Nilai berupa string (NIK, NISN, No. HP) tetap teks, jadi angka panjangnya tidak berubah ke notasi ilmiah.
    for (const r of rows) ws.addRow(KOLOM.map(([, fn]) => selExcel(fn(r))));
    ws.getRow(1).font = { bold: true };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: KOLOM.length } };
    const buf = await wb.xlsx.writeBuffer();
    return new Response(buf as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="pendaftar-kip-${tgl}.xlsx"`,
      },
    });
  }

  const csv = [KOLOM.map(([h]) => sel(h)).join(";"), ...rows.map((r) => KOLOM.map(([, fn]) => sel(fn(r))).join(";"))].join("\r\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pendaftar-kip-${tgl}.csv"`,
    },
  });
}
