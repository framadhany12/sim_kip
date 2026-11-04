import ExcelJS from "exceljs";
import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { bukuTabungan, dataDiri, ekonomiOrangtua, laporanAkademik, pendaftaran, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { baseQuery } from "@/lib/admin-query";
import { angkatanSql } from "@/lib/angkatan";
import { DESIL_LABEL, STATUS_MAHASISWA_LABEL, STATUS_NIKAH_LABEL, yaTidak } from "@/lib/constants";
import { kondisiMaster, type FilterMasterMhs } from "@/lib/master-mahasiswa";

type Baris = Awaited<ReturnType<typeof ambilBaris>>[number];

/** Seluruh data mahasiswa sesuai filter Master Mahasiswa, tanpa batas halaman dan tanpa berkas unggahan. */
async function ambilBaris(f: FilterMasterMhs) {
  const db = await getDb();
  const where = kondisiMaster(f);
  const [utama, tambahan] = await Promise.all([
    baseQuery(db).where(where).orderBy(asc(sql`coalesce(${dataDiri.namaLengkap}, ${users.nama})`)),
    db
      .select({
        id: pendaftaran.id,
        angkatan: angkatanSql,
        mahasiswaLama: users.mahasiswaLama,
        nim: pendaftaran.nim,
        kelas: pendaftaran.kelas,
        statusMhs: pendaftaran.statusMahasiswa,
        statusMhsTanggal: pendaftaran.statusMahasiswaTanggal,
        statusMhsKeterangan: pendaftaran.statusMahasiswaKeterangan,
        noRekening: bukuTabungan.noRekening,
        keteranganEkonomi: ekonomiOrangtua.keteranganTambahan,
      })
      .from(pendaftaran)
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(bukuTabungan, eq(bukuTabungan.pendaftaranId, pendaftaran.id))
      .leftJoin(ekonomiOrangtua, eq(ekonomiOrangtua.pendaftaranId, pendaftaran.id))
      .where(where),
  ]);
  const peta = new Map(tambahan.map((t) => [t.id, t]));
  return utama.map((u) => ({ ...u, x: peta.get(u.id) }));
}

const KOLOM: [string, (r: Baris) => unknown][] = [
  ["Angkatan", (r) => r.x?.angkatan],
  ["NIM", (r) => r.x?.nim],
  ["Kelas", (r) => r.x?.kelas],
  ["Nama Lengkap", (r) => r.nama ?? r.akunNama],
  ["Status Mahasiswa", (r) => (r.x?.statusMhs ? STATUS_MAHASISWA_LABEL[r.x.statusMhs] : "")],
  ["Tanggal Status", (r) => r.x?.statusMhsTanggal],
  ["Keterangan Status", (r) => r.x?.statusMhsKeterangan],
  ["Jurusan",(r) => r.jurusanDiterima],
  ["Jenis Beasiswa", (r) => r.jenisBeasiswa],
  ["Sumber Data", (r) => (r.x?.mahasiswaLama ? "Impor mahasiswa lama" : "Pendaftaran")],
  ["Tanggal Akun Dibuat", (r) => r.daftarPada.toISOString()],
  ["Tanggal Kirim Pendaftaran", (r) => r.submittedAt?.toISOString() ?? ""],
  ["No. Pendaftaran KIP Kuliah", (r) => r.nomorKip],
  ["No. Rekening KIP-K", (r) => r.x?.noRekening],
  ["Desil", (r) => (r.desil ? DESIL_LABEL[r.desil] : "")],
  ["Penerima PIP", (r) => (r.penerimaPip == null ? "" : yaTidak(r.penerimaPip))],
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
  ["Keterangan Ekonomi", (r) => r.x?.keteranganEkonomi],
  ["Nama Sekolah", (r) => r.sekolah],
  ["NPSN", (r) => r.npsn],
  ["Tahun Lulus", (r) => r.tahunLulus],
  ["Jurusan Sekolah", (r) => r.jurusanSekolah],
  ["Rekomendasi Dari", (r) => r.rekomendasiDari],
  ["Nama Perekomendasi", (r) => r.namaPerekomendasi],
  ["HP Perekomendasi", (r) => r.teleponPerekomendasi],
  ["Catatan Admin", (r) => r.catatanAdmin],
];

/** Sel teks/angka biasa; awalan = + - @ diberi tanda petik agar tidak dibaca sebagai rumus. */
function sel(v: unknown): string | number {
  if (typeof v === "number") return v;
  const s = v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Tidak diizinkan", { status: 403 });
  const f = Object.fromEntries(new URL(req.url).searchParams) as FilterMasterMhs;
  const rows = await ambilBaris(f);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Mahasiswa", { views: [{ state: "frozen", ySplit: 1, xSplit: 4 }] });
  ws.columns = KOLOM.map(([h]) => ({ header: h, width: Math.max(14, h.length + 4) }));
  for (const r of rows) ws.addRow(KOLOM.map(([, fn]) => sel(fn(r))));
  ws.getRow(1).font = { bold: true };
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: KOLOM.length } };

  // IPK per semester (tanpa berkas transkrip), hanya untuk mahasiswa yang ikut terekspor.
  const db = await getDb();
  const ipk = await db
    .select({ id: laporanAkademik.pendaftaranId, semester: laporanAkademik.semester, ipk: laporanAkademik.ipk, dilapor: laporanAkademik.updatedAt })
    .from(laporanAkademik)
    .innerJoin(pendaftaran, eq(pendaftaran.id, laporanAkademik.pendaftaranId))
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
    .where(kondisiMaster(f))
    .orderBy(asc(laporanAkademik.semester));
  const info = new Map(rows.map((r) => [r.id, r]));
  const wi = wb.addWorksheet("IPK per Semester", { views: [{ state: "frozen", ySplit: 1 }] });
  wi.columns = [
    { header: "NIM", width: 18 },
    { header: "Nama Lengkap", width: 32 },
    { header: "Angkatan", width: 12 },
    { header: "Semester", width: 12 },
    { header: "IPK", width: 10 },
    { header: "Tanggal Lapor", width: 24 },
  ];
  const urut = ipk
    .map((i) => ({ i, r: info.get(i.id) }))
    .filter((x): x is { i: (typeof ipk)[number]; r: Baris } => !!x.r)
    .sort((a, b) => (a.r.nama ?? a.r.akunNama).localeCompare(b.r.nama ?? b.r.akunNama) || a.i.semester - b.i.semester);
  for (const { i, r } of urut) wi.addRow([sel(r.x?.nim), sel(r.nama ?? r.akunNama), r.x?.angkatan ?? "", i.semester, Number(i.ipk), i.dilapor.toISOString()]);
  wi.getRow(1).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  const tgl = new Date().toISOString().slice(0, 10);
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="master-mahasiswa-${tgl}.xlsx"`,
    },
  });
}
