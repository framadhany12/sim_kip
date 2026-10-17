import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  berkas,
  dataDiri,
  dataKeluarga,
  dataSekolah,
  ekonomiOrangtua,
  jurusan,
  pendaftaran,
  pilihanJurusan,
  rekomendasi,
  riwayatStatus,
  sumberRekomendasi,
  users,
  wilayahKabupaten,
  wilayahKecamatan,
  type Status,
  type Tahap,
} from "@/db/schema";
import { BERKAS_INFO, BERKAS_UTAMA, LANGKAH, MAX_UMUR, tahunLulusBoleh, hitungUmur, type SlugLangkah } from "./constants";

/** Kolom `gelombang` dipertahankan di database (tidak lagi dipakai/ditampilkan); pendaftaran baru diisi nilai tetap ini. */
export const GELOMBANG_AKTIF = "-";

/**
 * True bila pendaftaran belum (atau perlu) dikirim. Data & berkas tetap bisa diubah pendaftar kapan saja;
 * yang dikunci setelah dikirim hanya pilihan Jurusan 1 & 2 (setelah itu hanya admin yang boleh mengubah).
 */
export const belumDikirim = (status: Status) => status === "draft" || status === "perbaikan";

/**
 * Terkunci: sejak tahap Pengusulan (dan Pengumuman) pendaftar tidak dapat mengubah data apa pun, termasuk berkas.
 * Perubahan setelah itu hanya bisa dilakukan admin (Master Calon Mahasiswa).
 */
export const terkunci = (p: { tahap: Tahap | null }) => p.tahap === "pengusulan" || p.tahap === "pengumuman";

export const PESAN_TERKUNCI = "Data pendaftaran Anda sudah terkunci karena memasuki tahap Pengusulan, sehingga tidak dapat diubah lagi. Hubungi admin lewat menu Bantuan bila ada data yang salah.";

/** Catat di riwayat bila pendaftar mengubah data setelah pendaftaran dikirim, agar admin mengetahuinya. */
export async function catatPerubahanPendaftar(p: { id: string; status: Status }, userId: string, bagian: string) {
  if (belumDikirim(p.status)) return;
  const db = await getDb();
  await db.insert(riwayatStatus).values({ pendaftaranId: p.id, status: p.status, catatan: `Pendaftar memperbarui ${bagian}`, diubahOleh: userId });
}

/** Ambil pendaftaran milik user; buat draft baru bila belum ada. */
export async function pendaftaranSaya(userId: string) {
  const db = await getDb();
  const ada = await cariPendaftaranUser(userId);
  if (ada) return ada;
  const id = crypto.randomUUID();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(pendaftaran).values({ id, userId, gelombang: GELOMBANG_AKTIF });
      await tx.insert(riwayatStatus).values({ pendaftaranId: id, status: "draft", catatan: "Pendaftaran dibuat", diubahOleh: userId });
    });
  } catch (e) {
    // Dua request bersamaan: yang kalah cukup membaca baris yang sudah dibuat yang lain.
    if (!isDuplikat(e)) throw e;
  }
  return pendaftaranSaya(userId);
}

/** Pendaftaran terbaru milik seorang user (tanpa membuat baru); null bila akunnya belum pernah membuka formulir. */
export async function cariPendaftaranUser(userId: string) {
  const db = await getDb();
  const [p] = await db.select().from(pendaftaran).where(eq(pendaftaran.userId, userId)).orderBy(desc(pendaftaran.createdAt)).limit(1);
  return p ?? null;
}

/** True bila error berasal dari pelanggaran UNIQUE/PRIMARY KEY di MySQL. */
export function isDuplikat(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "ER_DUP_ENTRY" || err?.cause?.code === "ER_DUP_ENTRY";
}

export async function muatLengkap(pendaftaranId: string) {
  const db = await getDb();
  const [p] = await db
    .select({ p: pendaftaran, user: { nama: users.nama, email: users.email, createdAt: users.createdAt, nik: users.nik } })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .where(eq(pendaftaran.id, pendaftaranId));
  if (!p) return null;
  const [[diri], [keluarga], [ekonomi], [sekolah], [pilihan], [rekom], daftarBerkas, riwayat, semuaJurusan] = await Promise.all([
    db
      .select({ d: dataDiri, kab: wilayahKabupaten.nama, prov: wilayahKabupaten.provinsi, kec: wilayahKecamatan.nama })
      .from(dataDiri)
      .leftJoin(wilayahKabupaten, eq(wilayahKabupaten.id, dataDiri.kabupatenId))
      .leftJoin(wilayahKecamatan, eq(wilayahKecamatan.id, dataDiri.kecamatanId))
      .where(eq(dataDiri.pendaftaranId, pendaftaranId)),
    db.select().from(dataKeluarga).where(eq(dataKeluarga.pendaftaranId, pendaftaranId)),
    db.select().from(ekonomiOrangtua).where(eq(ekonomiOrangtua.pendaftaranId, pendaftaranId)),
    db.select().from(dataSekolah).where(eq(dataSekolah.pendaftaranId, pendaftaranId)),
    db.select().from(pilihanJurusan).where(eq(pilihanJurusan.pendaftaranId, pendaftaranId)),
    db
      .select({ r: rekomendasi, sumber: sumberRekomendasi.nama, butuhKontak: sumberRekomendasi.butuhKontak })
      .from(rekomendasi)
      .leftJoin(sumberRekomendasi, eq(sumberRekomendasi.id, rekomendasi.sumberId))
      .where(eq(rekomendasi.pendaftaranId, pendaftaranId)),
    db.select().from(berkas).where(eq(berkas.pendaftaranId, pendaftaranId)),
    db
      .select({ r: riwayatStatus, oleh: users.nama, role: users.role })
      .from(riwayatStatus)
      .leftJoin(users, eq(users.id, riwayatStatus.diubahOleh))
      .where(eq(riwayatStatus.pendaftaranId, pendaftaranId))
      .orderBy(desc(riwayatStatus.createdAt)),
    db.select().from(jurusan).orderBy(asc(jurusan.nama)),
  ]);
  const namaJurusan = (id?: string) => semuaJurusan.find((j) => j.id === id)?.nama ?? "-";
  return {
    ...p.p,
    user: p.user,
    jurusanDiterima: p.p.jurusanDiterimaId ? namaJurusan(p.p.jurusanDiterimaId) : null,
    diri: diri ? { ...diri.d, kabupaten: diri.kab ?? "-", provinsi: diri.prov ?? "-", kecamatan: diri.kec ?? "-" } : null,
    keluarga: keluarga ?? null,
    ekonomi: ekonomi ?? null,
    sekolah: sekolah ?? null,
    pilihan: pilihan ? { ...pilihan, jurusan1: namaJurusan(pilihan.jurusan1Id), jurusan2: namaJurusan(pilihan.jurusan2Id) } : null,
    rekomendasi: rekom ? { ...rekom.r, sumber: rekom.sumber ?? "-", butuhKontak: rekom.butuhKontak ?? true } : null,
    berkas: Object.fromEntries(daftarBerkas.map((b) => [b.jenis, b])) as Partial<Record<(typeof daftarBerkas)[number]["jenis"], (typeof daftarBerkas)[number]>>,
    riwayat: riwayat.map((r) => ({ ...r.r, oleh: r.oleh, role: r.role })),
  };
}

export type PendaftaranLengkap = NonNullable<Awaited<ReturnType<typeof muatLengkap>>>;

/** Status kelengkapan tiap langkah formulir + syarat kelayakan. */
export function cekKelengkapan(d: PendaftaranLengkap) {
  const langkah: Record<SlugLangkah, boolean> = {
    // Kolom yang ditambahkan belakangan ikut diperiksa agar data lama diminta melengkapi.
    "data-diri": !!d.diri && !!d.diri.nomorPendaftaranKip && !!d.diri.nisn && !!d.diri.desil && d.diri.penerimaPip != null && !!d.diri.agama && !!d.diri.statusPernikahan,
    keluarga: !!d.keluarga && !!d.keluarga.teleponOrangTua,
    ekonomi: !!d.ekonomi,
    sekolah: !!d.sekolah && !!d.pilihan,
    rekomendasi: !!d.rekomendasi,
    berkas: BERKAS_UTAMA.every((j) => d.berkas[j]),
    ringkasan: d.status !== "draft" && d.status !== "perbaikan",
  };
  const masalah: string[] = [];
  if (!langkah["data-diri"]) masalah.push(d.diri ? "Data Diri belum lengkap (nomor pendaftaran KIP, NISN, desil, PIP, agama, status pernikahan)." : "Data Diri belum diisi.");
  if (!langkah.keluarga) masalah.push(d.keluarga ? "Nomor telepon orang tua belum diisi." : "Data Keluarga belum diisi.");
  if (!langkah.ekonomi) masalah.push("Data Ekonomi Orang Tua belum diisi.");
  if (!langkah.sekolah) masalah.push("Data Sekolah & Pilihan Jurusan belum diisi.");
  if (!langkah.rekomendasi) masalah.push("Data Rekomendasi belum diisi.");
  for (const j of BERKAS_UTAMA) if (!d.berkas[j]) masalah.push(`Berkas ${BERKAS_INFO[j].label} belum diunggah.`);
  if (d.diri) {
    const umur = hitungUmur(d.diri.tanggalLahir);
    if (umur > MAX_UMUR) masalah.push(`Umur Anda ${umur} tahun — syarat KIP Kuliah maksimal ${MAX_UMUR} tahun.`);
  }
  if (d.sekolah && !tahunLulusBoleh().includes(d.sekolah.tahunLulus))
    masalah.push(`Tahun lulus harus ${tahunLulusBoleh().join(", ")}.`);
  const terisi = (Object.keys(langkah) as SlugLangkah[]).filter((k) => k !== "ringkasan" && langkah[k]).length;
  return { langkah, masalah, siapKirim: masalah.length === 0, persen: Math.round((terisi / (LANGKAH.length - 1)) * 100) };
}

/** Pendaftar yang sudah diterima: akunnya berfungsi sebagai akun mahasiswa (menu Formulir diganti menu Mahasiswa). */
export const sudahMahasiswa = (p: { status: Status; hasil: "diterima" | "ditolak" | null }) => p.status === "diterima" && p.hasil === "diterima";
