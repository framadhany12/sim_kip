import "server-only";
import { and, desc, eq, gte, inArray, like, lt, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { getDb } from "@/db";
import {
  dataDiri,
  dataKeluarga,
  dataSekolah,
  ekonomiOrangtua,
  jurusan,
  pendaftaran,
  pilihanJurusan,
  rekomendasi,
  STATUS,
  sumberRekomendasi,
  TAHAP,
  type Tahap,
  users,
  wilayahKabupaten,
  wilayahKecamatan,
  type Status,
} from "@/db/schema";

export type FilterPendaftar = { q?: string; status?: string; gelombang?: string; dari?: string; sampai?: string; page?: string };

/**
 * Pilihan filter daftar admin. "masuk" = semua yang sedang dalam proses seleksi (bawaan), "semua" = tanpa filter,
 * "tahap:<x>" = sedang di tahap tertentu, "diterima"/"ditolak" = hasil pengumuman, "draft" = belum mengirim.
 */
export const FILTER_STATUS = ["masuk", "semua", ...TAHAP.filter((t) => t !== "pengumuman").map((t) => `tahap:${t}` as const), "diterima", "ditolak", "draft"] as const;

const DALAM_PROSES: Status[] = ["terkirim", "diperiksa"];

function kondisi(f: FilterPendaftar): SQL | undefined {
  const c: (SQL | undefined)[] = [];
  const st = f.status || "masuk";
  if (st === "masuk") c.push(inArray(pendaftaran.status, DALAM_PROSES));
  else if (st.startsWith("tahap:") && (TAHAP as readonly string[]).includes(st.slice(6)))
    c.push(and(inArray(pendaftaran.status, DALAM_PROSES), eq(pendaftaran.tahap, st.slice(6) as Tahap)));
  else if ((STATUS as readonly string[]).includes(st)) c.push(eq(pendaftaran.status, st as Status));
  if (f.gelombang) c.push(eq(pendaftaran.gelombang, f.gelombang));
  // Rentang tanggal memakai tanggal kirim; pendaftaran yang belum dikirim memakai tanggal dibuat.
  const tgl = sql`coalesce(${pendaftaran.submittedAt}, ${pendaftaran.createdAt})`;
  if (f.dari) c.push(gte(tgl, new Date(`${f.dari}T00:00:00+07:00`)));
  if (f.sampai) c.push(lt(tgl, new Date(new Date(`${f.sampai}T00:00:00+07:00`).getTime() + 864e5)));
  const q = f.q?.trim();
  if (q) {
    const pola = `%${q}%`;
    c.push(
      or(
        like(dataDiri.namaLengkap, pola),
        like(users.nama, pola),
        like(dataDiri.nik, pola),
        like(dataDiri.nomorPendaftaranKip, pola),
        like(dataSekolah.namaSekolah, pola),
        like(users.email, pola),
      ),
    );
  }
  return and(...c);
}

const j1 = alias(jurusan, "j1");
const j2 = alias(jurusan, "j2");
const jDiterima = alias(jurusan, "j_diterima");

function baseQuery(db: Awaited<ReturnType<typeof getDb>>) {
  return db
    .select({
      id: pendaftaran.id,
      status: pendaftaran.status,
      tahap: pendaftaran.tahap,
      hasil: pendaftaran.hasil,
      jurusanDiterima: jDiterima.nama,
      alasanDitolak: pendaftaran.alasanDitolak,
      gelombang: pendaftaran.gelombang,
      submittedAt: pendaftaran.submittedAt,
      createdAt: pendaftaran.createdAt,
      updatedAt: pendaftaran.updatedAt,
      catatanAdmin: pendaftaran.catatanAdmin,
      akunNama: users.nama,
      akunLogin: users.email,
      nama: dataDiri.namaLengkap,
      nik: dataDiri.nik,
      nomorKip: dataDiri.nomorPendaftaranKip,
      nisn: dataDiri.nisn,
      desil: dataDiri.desil,
      penerimaPip: dataDiri.penerimaPip,
      agama: dataDiri.agama,
      statusPernikahan: dataDiri.statusPernikahan,
      tempatLahir: dataDiri.tempatLahir,
      tanggalLahir: dataDiri.tanggalLahir,
      jenisKelamin: dataDiri.jenisKelamin,
      kontak: dataDiri.kontak,
      alamat: dataDiri.alamatLengkap,
      rt: dataDiri.rt,
      rw: dataDiri.rw,
      desa: dataDiri.desaKelurahan,
      kecamatan: wilayahKecamatan.nama,
      kabupaten: wilayahKabupaten.nama,
      provinsi: wilayahKabupaten.provinsi,
      namaAyah: dataKeluarga.namaAyah,
      namaIbu: dataKeluarga.namaIbu,
      namaWali: dataKeluarga.namaWali,
      teleponOrangTua: dataKeluarga.teleponOrangTua,
      anggotaKeluarga: dataKeluarga.jumlahAnggotaKeluarga,
      penghasilan: ekonomiOrangtua.penghasilanBulanan,
      pekerjaan: ekonomiOrangtua.pekerjaan,
      tanggungan: ekonomiOrangtua.tanggungan,
      sekolah: dataSekolah.namaSekolah,
      npsn: dataSekolah.npsn,
      tahunLulus: dataSekolah.tahunLulus,
      jurusanSekolah: dataSekolah.jurusanSekolah,
      jurusan1: j1.nama,
      jurusan2: j2.nama,
      rekomendasiDari: sumberRekomendasi.nama,
      namaPerekomendasi: rekomendasi.namaPerekomendasi,
      teleponPerekomendasi: rekomendasi.teleponPerekomendasi,
    })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
    .leftJoin(wilayahKabupaten, eq(wilayahKabupaten.id, dataDiri.kabupatenId))
    .leftJoin(wilayahKecamatan, eq(wilayahKecamatan.id, dataDiri.kecamatanId))
    .leftJoin(dataKeluarga, eq(dataKeluarga.pendaftaranId, pendaftaran.id))
    .leftJoin(ekonomiOrangtua, eq(ekonomiOrangtua.pendaftaranId, pendaftaran.id))
    .leftJoin(dataSekolah, eq(dataSekolah.pendaftaranId, pendaftaran.id))
    .leftJoin(pilihanJurusan, eq(pilihanJurusan.pendaftaranId, pendaftaran.id))
    .leftJoin(j1, eq(j1.id, pilihanJurusan.jurusan1Id))
    .leftJoin(j2, eq(j2.id, pilihanJurusan.jurusan2Id))
    .leftJoin(jDiterima, eq(jDiterima.id, pendaftaran.jurusanDiterimaId))
    .leftJoin(rekomendasi, eq(rekomendasi.pendaftaranId, pendaftaran.id))
    .leftJoin(sumberRekomendasi, eq(sumberRekomendasi.id, rekomendasi.sumberId));
}

export const PER_HALAMAN = 25;

export async function cariPendaftar(f: FilterPendaftar, semua = false) {
  const db = await getDb();
  const where = kondisi(f);
  const q = baseQuery(db)
    .where(where)
    .orderBy(desc(sql`coalesce(${pendaftaran.submittedAt}, ${pendaftaran.createdAt})`));
  if (semua) return { rows: await q, total: 0 };
  const page = Math.max(1, Number(f.page) || 1);
  const [rows, [{ total }]] = await Promise.all([
    q.limit(PER_HALAMAN).offset((page - 1) * PER_HALAMAN),
    db
      .select({ total: sql<number>`count(*)` })
      .from(pendaftaran)
      .innerJoin(users, eq(users.id, pendaftaran.userId))
      .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
      .leftJoin(dataSekolah, eq(dataSekolah.pendaftaranId, pendaftaran.id))
      .where(where),
  ]);
  return { rows, total, page };
}

export async function daftarGelombang() {
  const db = await getDb();
  const rows = await db.selectDistinct({ g: pendaftaran.gelombang }).from(pendaftaran);
  return rows.map((r) => r.g);
}
