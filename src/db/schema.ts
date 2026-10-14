import { mysqlTable, varchar, text, int, decimal, boolean, datetime, mysqlEnum, index, uniqueIndex } from "drizzle-orm/mysql-core";

const id = () => varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID());
const ref = (name: string) => varchar(name, { length: 36 });
// DATETIME (bukan TIMESTAMP) agar MariaDB tidak menambahkan ON UPDATE CURRENT_TIMESTAMP otomatis.
const ts = (name: string) => datetime(name, { mode: "date", fsp: 3 });
const now = (name: string) => ts(name).notNull().$defaultFn(() => new Date());

export const users = mysqlTable("users", {
  id: id(),
  nama: varchar("nama", { length: 150 }).notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["pendaftar", "admin"]).notNull().default("pendaftar"),
  /** Null = email belum diverifikasi; akun pendaftar belum bisa masuk. */
  emailVerifiedAt: ts("email_verified_at"),
  createdAt: now("created_at"),
});

/** Profil sederhana pengelola (admin) yang bisa ditampilkan ke calon mahasiswa di halaman Bantuan. */
export const profilAdmin = mysqlTable("profil_admin", {
  userId: ref("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  jabatan: varchar("jabatan", { length: 100 }),
  /** Format internasional tanpa plus, mis. 6281234567890. */
  whatsapp: varchar("whatsapp", { length: 20 }),
  keterangan: varchar("keterangan", { length: 300 }),
  /** Hanya admin dengan tampil = true yang muncul di halaman Bantuan. */
  tampil: boolean("tampil").notNull().default(false),
});

export const emailVerifications = mysqlTable("email_verifications", {
  id: varchar("id", { length: 64 }).primaryKey(), // sha256 dari token di tautan email
  userId: ref("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
  createdAt: now("created_at"),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(), // sha256 dari token cookie
  userId: ref("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
});

export const passwordResets = mysqlTable("password_resets", {
  id: varchar("id", { length: 64 }).primaryKey(), // sha256 dari token reset
  userId: ref("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
});

export const DESIL = ["1", "2", "3", "4", "5", "6-10"] as const;
export const AGAMA = ["Islam", "Kristen Protestan", "Katolik", "Hindu", "Buddha", "Khonghucu", "Kepercayaan terhadap Tuhan YME"] as const;

export const TAHAP = ["administrasi", "ujian", "wawancara", "pengusulan", "pengumuman"] as const;
export type Tahap = (typeof TAHAP)[number];

export const STATUS = ["draft", "terkirim", "diperiksa", "perbaikan", "diterima", "ditolak"] as const;
export type Status = (typeof STATUS)[number];

export const pendaftaran = mysqlTable(
  "pendaftaran",
  {
    id: id(),
    userId: ref("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    gelombang: varchar("gelombang", { length: 100 }).notNull(),
    status: mysqlEnum("status", STATUS).notNull().default("draft"),
    /** Tahap seleksi saat ini (null selama belum dikirim). */
    tahap: mysqlEnum("tahap", TAHAP),
    /** Hasil akhir, diisi saat tahap Pengumuman. */
    hasil: mysqlEnum("hasil", ["diterima", "ditolak"]),
    /** Jurusan tempat pendaftar diterima — salah satu dari Jurusan 1/2 pilihannya. */
    jurusanDiterimaId: varchar("jurusan_diterima_id", { length: 36 }).references(() => jurusan.id),
    /** Alasan tidak lolos Seleksi Administrasi atau tidak diterima saat Pengumuman. */
    alasanDitolak: varchar("alasan_ditolak", { length: 150 }),
    catatanAdmin: text("catatan_admin"),
    submittedAt: ts("submitted_at"),
    createdAt: now("created_at"),
    updatedAt: now("updated_at"),
  },
  (t) => [uniqueIndex("pendaftaran_user_gelombang").on(t.userId, t.gelombang), index("pendaftaran_status").on(t.status)],
);

export const wilayahKabupaten = mysqlTable("wilayah_kabupaten", {
  id: varchar("id", { length: 10 }).primaryKey(),
  kode: varchar("kode", { length: 10 }).notNull(),
  nama: varchar("nama", { length: 100 }).notNull(),
  provinsi: varchar("provinsi", { length: 100 }).notNull(),
});

export const wilayahKecamatan = mysqlTable(
  "wilayah_kecamatan",
  {
    id: varchar("id", { length: 10 }).primaryKey(),
    kode: varchar("kode", { length: 10 }).notNull(),
    nama: varchar("nama", { length: 100 }).notNull(),
    kabupatenId: varchar("kabupaten_id", { length: 10 }).notNull().references(() => wilayahKabupaten.id),
  },
  (t) => [index("kecamatan_kabupaten").on(t.kabupatenId)],
);

export const dataDiri = mysqlTable("data_diri", {
  id: id(),
  pendaftaranId: ref("pendaftaran_id").notNull().unique().references(() => pendaftaran.id, { onDelete: "cascade" }),
  nik: varchar("nik", { length: 16 }).notNull(),
  namaLengkap: varchar("nama_lengkap", { length: 150 }).notNull(),
  tempatLahir: varchar("tempat_lahir", { length: 100 }).notNull(),
  tanggalLahir: varchar("tanggal_lahir", { length: 10 }).notNull(), // YYYY-MM-DD
  jenisKelamin: mysqlEnum("jenis_kelamin", ["L", "P"]).notNull(),
  alamatLengkap: text("alamat_lengkap").notNull(),
  rt: varchar("rt", { length: 3 }).notNull(),
  rw: varchar("rw", { length: 3 }).notNull(),
  desaKelurahan: varchar("desa_kelurahan", { length: 100 }).notNull(),
  kecamatanId: varchar("kecamatan_id", { length: 10 }).notNull().references(() => wilayahKecamatan.id),
  kabupatenId: varchar("kabupaten_id", { length: 10 }).notNull().references(() => wilayahKabupaten.id),
  kontak: varchar("kontak", { length: 20 }).notNull(),
  // Data KIP Kuliah & identitas tambahan. Nullable agar data pendaftar lama tetap valid; diwajibkan di formulir.
  nomorPendaftaranKip: varchar("nomor_pendaftaran_kip", { length: 30 }),
  nisn: varchar("nisn", { length: 10 }),
  desil: mysqlEnum("desil", DESIL),
  penerimaPip: boolean("penerima_pip"),
  agama: mysqlEnum("agama", AGAMA),
  statusPernikahan: mysqlEnum("status_pernikahan", ["belum_menikah", "menikah"]),
});

export const dataKeluarga = mysqlTable("data_keluarga", {
  id: id(),
  pendaftaranId: ref("pendaftaran_id").notNull().unique().references(() => pendaftaran.id, { onDelete: "cascade" }),
  namaAyah: varchar("nama_ayah", { length: 150 }).notNull(),
  namaIbu: varchar("nama_ibu", { length: 150 }).notNull(),
  namaWali: varchar("nama_wali", { length: 150 }),
  jumlahAnggotaKeluarga: int("jumlah_anggota_keluarga").notNull(),
  teleponOrangTua: varchar("telepon_orang_tua", { length: 20 }),
});

/** Master sumber rekomendasi (Mahasiswa, Alumni, ...) — dikelola admin. */
export const sumberRekomendasi = mysqlTable("sumber_rekomendasi", {
  id: id(),
  nama: varchar("nama", { length: 60 }).notNull().unique(),
  /** Bila false (mis. Media Sosial), nama & nomor HP perekomendasi boleh dikosongkan. */
  butuhKontak: boolean("butuh_kontak").notNull().default(true),
  aktif: boolean("aktif").notNull().default(true),
  urutan: int("urutan").notNull().default(0),
});

/** Tahun ajaran yang dikelola admin; dipakai sebagai pilihan filter "Tahun daftar" di panel admin. */
export const tahunAjaran = mysqlTable("tahun_ajaran", {
  tahun: int("tahun").primaryKey(),
});

export const rekomendasi = mysqlTable("rekomendasi", {
  id: id(),
  pendaftaranId: ref("pendaftaran_id").notNull().unique().references(() => pendaftaran.id, { onDelete: "cascade" }),
  sumberId: ref("sumber_id").notNull().references(() => sumberRekomendasi.id),
  namaPerekomendasi: varchar("nama_perekomendasi", { length: 150 }),
  teleponPerekomendasi: varchar("telepon_perekomendasi", { length: 20 }),
});

export const ekonomiOrangtua = mysqlTable("ekonomi_orangtua", {
  id: id(),
  pendaftaranId: ref("pendaftaran_id").notNull().unique().references(() => pendaftaran.id, { onDelete: "cascade" }),
  penghasilanBulanan: decimal("penghasilan_bulanan", { precision: 15, scale: 2, mode: "number" }).notNull(),
  pekerjaan: varchar("pekerjaan", { length: 100 }).notNull(),
  tanggungan: int("tanggungan").notNull(),
  keteranganTambahan: text("keterangan_tambahan"),
  suratKebutuhanEkonomiUrl: varchar("surat_kebutuhan_ekonomi_url", { length: 255 }),
});

export const dataSekolah = mysqlTable("data_sekolah", {
  id: id(),
  pendaftaranId: ref("pendaftaran_id").notNull().unique().references(() => pendaftaran.id, { onDelete: "cascade" }),
  namaSekolah: varchar("nama_sekolah", { length: 150 }).notNull(),
  npsn: varchar("npsn", { length: 8 }).notNull(),
  tahunLulus: int("tahun_lulus").notNull(),
  jurusanSekolah: varchar("jurusan_sekolah", { length: 100 }).notNull(),
});

export const jurusan = mysqlTable("jurusan", {
  id: id(),
  kode: varchar("kode", { length: 20 }).notNull().unique(),
  nama: varchar("nama", { length: 150 }).notNull(),
  bukaPilihan1: boolean("buka_pilihan_1").notNull().default(true),
  bukaPilihan2: boolean("buka_pilihan_2").notNull().default(true),
  aktif: boolean("aktif").notNull().default(true),
});

export const pilihanJurusan = mysqlTable("pilihan_jurusan", {
  id: id(),
  pendaftaranId: ref("pendaftaran_id").notNull().unique().references(() => pendaftaran.id, { onDelete: "cascade" }),
  jurusan1Id: ref("jurusan_1_id").notNull().references(() => jurusan.id),
  jurusan2Id: ref("jurusan_2_id").notNull().references(() => jurusan.id),
});

export const JENIS_BERKAS = ["ijazah", "akta_kelahiran", "kk", "ktp", "surat_permohonan_direktur", "surat_ekonomi"] as const;
export type JenisBerkas = (typeof JENIS_BERKAS)[number];

export const berkas = mysqlTable(
  "berkas",
  {
    id: id(),
    pendaftaranId: ref("pendaftaran_id").notNull().references(() => pendaftaran.id, { onDelete: "cascade" }),
    jenis: mysqlEnum("jenis", JENIS_BERKAS).notNull(),
    fileUrl: varchar("file_url", { length: 255 }).notNull(), // path relatif di dalam folder storage
    namaAsli: varchar("nama_asli", { length: 200 }).notNull(),
    mimeType: varchar("mime_type", { length: 50 }).notNull(),
    ukuran: int("ukuran").notNull(),
    statusVerifikasi: mysqlEnum("status_verifikasi", ["menunggu", "valid", "tidak_valid"]).notNull().default("menunggu"),
    uploadedAt: now("uploaded_at"),
  },
  (t) => [uniqueIndex("berkas_pendaftaran_jenis").on(t.pendaftaranId, t.jenis)],
);

export const riwayatStatus = mysqlTable(
  "riwayat_status",
  {
    id: id(),
    pendaftaranId: ref("pendaftaran_id").notNull().references(() => pendaftaran.id, { onDelete: "cascade" }),
    // Bisa berupa status, tahap, atau hasil tahap seperti "tidak_lolos:administrasi".
    status: varchar("status", { length: 40 }).notNull(),
    catatan: text("catatan"),
    diubahOleh: ref("diubah_oleh").references(() => users.id, { onDelete: "set null" }),
    createdAt: now("created_at"),
  },
  (t) => [index("riwayat_pendaftaran").on(t.pendaftaranId)],
);

export const faq = mysqlTable("faq", {
  id: id(),
  pertanyaan: text("pertanyaan").notNull(),
  jawaban: text("jawaban").notNull(),
  urutan: int("urutan").notNull().default(0),
});

// Fitur "Tanya Admin" (Fase 4)
export const pertanyaan = mysqlTable("pertanyaan", {
  id: id(),
  userId: ref("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isi: text("isi").notNull(),
  jawaban: text("jawaban"),
  dijawabOleh: ref("dijawab_oleh").references(() => users.id, { onDelete: "set null" }),
  createdAt: now("created_at"),
  answeredAt: ts("answered_at"),
});
