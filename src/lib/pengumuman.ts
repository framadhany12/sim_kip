import "server-only";
import { and, asc, eq, gte, inArray, isNull, like, lt, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { getDb } from "@/db";
import { dataDiri, dataSekolah, jurusan, pendaftaran, pilihanJurusan, TAHAP, users, type Tahap } from "@/db/schema";
import { parseTahun, rentangTahun, SEMUA_TAHUN, tahunBerjalan } from "./tahun";

/**
 * Jenis pengumuman massal.
 * - Meloloskan ke tahap berikutnya: lolos_administrasi, selesai_ujian, selesai_wawancara.
 * - Hasil akhir: ditolak, diterima. Tidak lolos administrasi tidak ada di sini: desil 5/6-10 tanpa PIP otomatis ditolak saat kirim (lihat kirimPendaftaran).
 */
export const JENIS_PENGUMUMAN = ["lolos_administrasi", "selesai_ujian", "selesai_wawancara", "pengusulan", "ditolak", "diterima"] as const;
export type JenisPengumuman = (typeof JENIS_PENGUMUMAN)[number];

/**
 * Jenis yang hanya memajukan pendaftar dari satu tahap ke tahap berikutnya (tanpa alasan).
 * `wawancaraSelesai`: syarat penanda wawancara. "Sudah wawancara" hanya menandai (tahap tetap Wawancara);
 * "Pengusulan" memindahkan yang sudah ditandai ke tahap Pengusulan dan menanyakan kesediaan diusulkan.
 */
export const JENIS_LANJUT: Partial<Record<JenisPengumuman, { dari: Tahap; ke: Tahap; wawancaraSelesai?: boolean }>> = {
  lolos_administrasi: { dari: "administrasi", ke: "ujian" },
  selesai_ujian: { dari: "ujian", ke: "wawancara" },
  selesai_wawancara: { dari: "wawancara", ke: "wawancara", wawancaraSelesai: false },
  pengusulan: { dari: "wawancara", ke: "pengusulan", wawancaraSelesai: true },
};

export type FilterKandidat = { jenis: JenisPengumuman; tahap?: string; tahun?: string; q?: string };

/** Batas baris per tampilan agar halaman tetap ringan; filter dipakai untuk mempersempit. */
export const BATAS_KANDIDAT = 300;

const j1 = alias(jurusan, "j1");
const j2 = alias(jurusan, "j2");

/** Tahap bawaan untuk mode Diterima / Tidak diterima: biasanya yang sudah sampai Pengusulan. */
export const TAHAP_BAWAAN: Tahap = "pengusulan";

/**
 * Pendaftar yang masih dalam proses seleksi dan bisa diumumkan.
 * - lolos_administrasi: yang masih di Seleksi Administrasi (belum diputuskan).
 * - selesai_ujian / selesai_wawancara: yang sedang di Seleksi Ujian / Seleksi Wawancara.
 * - ditolak / diterima: yang masih berproses, disaring per tahap (bawaan Pengusulan; "semua" = termasuk Seleksi Administrasi).
 */
export async function kandidatPengumuman(f: FilterKandidat) {
  const db = await getDb();
  const c = [inArray(pendaftaran.status, ["terkirim", "diperiksa"])];

  const lanjut = JENIS_LANJUT[f.jenis];
  if (lanjut) {
    c.push(lanjut.dari === "administrasi" ? or(eq(pendaftaran.tahap, "administrasi"), isNull(pendaftaran.tahap))! : eq(pendaftaran.tahap, lanjut.dari));
    if (lanjut.wawancaraSelesai !== undefined) c.push(eq(pendaftaran.wawancaraSelesai, lanjut.wawancaraSelesai));
  } else {
    const t = f.tahap ?? TAHAP_BAWAAN;
    if (t !== "semua" && (TAHAP as readonly string[]).includes(t) && t !== "pengumuman") c.push(eq(pendaftaran.tahap, t as Tahap));
    else if (t !== "semua") c.push(eq(pendaftaran.tahap, TAHAP_BAWAAN));
    // Yang belum menjawab pertanyaan "bersedia diusulkan?" belum bisa diumumkan hasilnya.
    c.push(or(isNull(pendaftaran.usulan), ne(pendaftaran.usulan, "menunggu"))!);
  }

  // Tahun daftar: bawaan tahun berjalan, sama seperti daftar pendaftar.
  const tahun = f.tahun === SEMUA_TAHUN ? undefined : (parseTahun(f.tahun) ?? tahunBerjalan());
  if (tahun) {
    const { dari, sampai } = rentangTahun(tahun);
    c.push(gte(users.createdAt, dari), lt(users.createdAt, sampai));
  }

  const q = f.q?.trim();
  if (q) {
    const pola = `%${q}%`;
    c.push(
      or(like(dataDiri.namaLengkap, pola), like(users.nama, pola), like(dataDiri.nik, pola), like(dataDiri.nomorPendaftaranKip, pola), like(dataDiri.nisn, pola), like(dataSekolah.namaSekolah, pola))!,
    );
  }

  const rows = await db
    .select({
      id: pendaftaran.id,
      nama: sql<string>`coalesce(${dataDiri.namaLengkap}, ${users.nama})`,
      nomorKip: dataDiri.nomorPendaftaranKip,
      nisn: dataDiri.nisn,
      sekolah: dataSekolah.namaSekolah,
      tahap: pendaftaran.tahap,
      jurusan1Id: pilihanJurusan.jurusan1Id,
      jurusan1: j1.nama,
      jurusan2Id: pilihanJurusan.jurusan2Id,
      jurusan2: j2.nama,
    })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
    .leftJoin(dataSekolah, eq(dataSekolah.pendaftaranId, pendaftaran.id))
    .leftJoin(pilihanJurusan, eq(pilihanJurusan.pendaftaranId, pendaftaran.id))
    .leftJoin(j1, eq(j1.id, pilihanJurusan.jurusan1Id))
    .leftJoin(j2, eq(j2.id, pilihanJurusan.jurusan2Id))
    .where(and(...c))
    .orderBy(asc(sql`coalesce(${dataDiri.namaLengkap}, ${users.nama})`))
    .limit(BATAS_KANDIDAT + 1);

  return { rows: rows.slice(0, BATAS_KANDIDAT), terpotong: rows.length > BATAS_KANDIDAT };
}
