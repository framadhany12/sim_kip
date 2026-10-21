import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import {
  AGAMA,
  berkas,
  dataDiri,
  dataKeluarga,
  dataSekolah,
  DESIL,
  ekonomiOrangtua,
  jurusan,
  pendaftaran,
  pilihanJurusan,
  rekomendasi,
  sekolah as masterSekolah,
  sumberRekomendasi,
  users,
  wilayahKecamatan,
} from "@/db/schema";
import { tahunLulusBoleh, hitungUmur, normalHp } from "./constants";
import { isDuplikat } from "./pendaftaran";
import { kataCariSekolah, samaNama } from "./sekolah";
import type { FormState } from "./form-state";

/**
 * Validasi + penyimpanan tiap bagian formulir, dipakai bersama oleh formulir pendaftar
 * dan edit oleh admin (Master Calon Mahasiswa) agar aturannya selalu sama.
 * `galat` terisi bila validasi gagal (tidak ada yang disimpan); selain itu data sudah tersimpan.
 */
export type HasilSimpan = { galat?: FormState; umur?: number };

type Nilai = Record<string, string>;
const angka = (s: string | undefined) => (s ?? "").replace(/\D/g, "");
const wajib = (v: Nilai, e: Record<string, string>, fields: [string, string][]) => {
  for (const [k, msg] of fields) if (!v[k]) e[k] = msg;
};
const gagal = (e: Record<string, string>, v: Nilai): HasilSimpan => ({ galat: { errors: e, values: v, message: "Masih ada isian yang perlu diperbaiki." } });

/** `ubahNik` hanya untuk admin: pendaftar tidak boleh mengganti NIK yang didaftarkan saat registrasi. */
export async function simpanDataDiriCore(pendaftaranId: string, v: Nilai, opsi: { ubahNik?: boolean } = {}): Promise<HasilSimpan> {
  const e: Record<string, string> = {};
  wajib(v, e, [
    ["namaLengkap", "Nama lengkap wajib diisi."],
    ["tempatLahir", "Tempat lahir wajib diisi."],
    ["tanggalLahir", "Tanggal lahir wajib diisi."],
    ["jenisKelamin", "Pilih jenis kelamin."],
    ["alamatLengkap", "Alamat lengkap wajib diisi."],
    ["desaKelurahan", "Desa/kelurahan wajib diisi."],
    ["kabupatenId", "Pilih kabupaten/kota."],
    ["kecamatanId", "Pilih kecamatan."],
  ]);
  const db = await getDb();
  const [pemilik] = await db
    .select({ id: users.id, nik: users.nik })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .where(eq(pendaftaran.id, pendaftaranId));
  let nik = angka(v.nik);
  if (pemilik?.nik && !opsi.ubahNik) nik = pemilik.nik; // NIK akun dikunci
  if (nik.length !== 16) e.nik = "NIK harus 16 digit angka (lihat KTP atau KK).";
  else if (pemilik && pemilik.nik !== nik) {
    // NIK baru/berubah (akun lama tanpa NIK, atau koreksi admin): tidak boleh dipakai akun atau pendaftaran lain.
    const [dipakai] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.nik, nik), ne(users.id, pemilik.id)))
      .limit(1);
    const [dipakaiData] = dipakai
      ? [dipakai]
      : await db
          .select({ id: dataDiri.id })
          .from(dataDiri)
          .innerJoin(pendaftaran, eq(pendaftaran.id, dataDiri.pendaftaranId))
          .where(and(eq(dataDiri.nik, nik), ne(pendaftaran.userId, pemilik.id)))
          .limit(1);
    if (dipakaiData) e.nik = "NIK ini sudah terdaftar pada pendaftar lain. Satu NIK hanya dapat mendaftar satu kali.";
  }
  const rt = angka(v.rt), rw = angka(v.rw);
  if (!rt || rt.length > 3) e.rt = "Isi nomor RT (1–3 digit).";
  if (!rw || rw.length > 3) e.rw = "Isi nomor RW (1–3 digit).";
  const kontak = normalHp(v.kontak);
  if (!kontak) e.kontak = "Nomor HP/WhatsApp diawali 08, 10–14 digit.";
  const nomorKip = (v.nomorPendaftaranKip ?? "").replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9./-]{5,29}$/.test(nomorKip)) e.nomorPendaftaranKip = "Isi nomor pendaftaran KIP Kuliah dari akun SIM KIP Kuliah (6–30 karakter).";
  const nisn = angka(v.nisn);
  if (nisn.length !== 10) e.nisn = "NISN terdiri dari 10 digit angka.";
  if (!(DESIL as readonly string[]).includes(v.desil)) e.desil = "Pilih desil sesuai data DTSEN.";
  if (v.penerimaPip !== "ya" && v.penerimaPip !== "tidak") e.penerimaPip = "Pilih Ya atau Tidak.";
  if (!(AGAMA as readonly string[]).includes(v.agama)) e.agama = "Pilih agama.";
  if (v.statusPernikahan !== "belum_menikah" && v.statusPernikahan !== "menikah") e.statusPernikahan = "Pilih status pernikahan.";
  if (v.tanggalLahir) {
    const lahir = new Date(v.tanggalLahir);
    if (isNaN(+lahir) || lahir > new Date() || lahir.getFullYear() < 1950) e.tanggalLahir = "Tanggal lahir tidak valid.";
  }
  if (v.jenisKelamin && !["L", "P"].includes(v.jenisKelamin)) e.jenisKelamin = "Pilih jenis kelamin.";
  if (v.kecamatanId && v.kabupatenId) {
    const [kec] = await db
      .select({ id: wilayahKecamatan.id })
      .from(wilayahKecamatan)
      .where(and(eq(wilayahKecamatan.id, v.kecamatanId), eq(wilayahKecamatan.kabupatenId, v.kabupatenId)));
    if (!kec) e.kecamatanId = "Kecamatan tidak sesuai dengan kabupaten/kota yang dipilih.";
  }
  if (Object.keys(e).length) return gagal(e, v);

  const data = {
    nik,
    namaLengkap: v.namaLengkap,
    tempatLahir: v.tempatLahir,
    tanggalLahir: v.tanggalLahir,
    jenisKelamin: v.jenisKelamin as "L" | "P",
    alamatLengkap: v.alamatLengkap,
    rt: rt.padStart(3, "0"),
    rw: rw.padStart(3, "0"),
    desaKelurahan: v.desaKelurahan,
    kecamatanId: v.kecamatanId,
    kabupatenId: v.kabupatenId,
    kontak: kontak!,
    nomorPendaftaranKip: nomorKip,
    nisn,
    desil: v.desil as (typeof DESIL)[number],
    penerimaPip: v.penerimaPip === "ya",
    agama: v.agama as (typeof AGAMA)[number],
    statusPernikahan: v.statusPernikahan as "belum_menikah" | "menikah",
  };
  await db.insert(dataDiri).values({ pendaftaranId, ...data }).onDuplicateKeyUpdate({ set: data });
  if (pemilik && pemilik.nik !== nik) await db.update(users).set({ nik }).where(eq(users.id, pemilik.id));
  // Umur > 21 tetap disimpan (agar tidak kehilangan isian) tetapi pengiriman akan diblokir & diperingatkan.
  return { umur: hitungUmur(data.tanggalLahir) };
}

export async function simpanKeluargaCore(pendaftaranId: string, v: Nilai): Promise<HasilSimpan> {
  const e: Record<string, string> = {};
  wajib(v, e, [
    ["namaAyah", "Nama ayah wajib diisi. Tulis nama sesuai KK, meskipun sudah meninggal."],
    ["namaIbu", "Nama ibu wajib diisi. Tulis nama sesuai KK, meskipun sudah meninggal."],
  ]);
  const jml = Number(v.jumlahAnggotaKeluarga);
  if (!Number.isInteger(jml) || jml < 1 || jml > 30) e.jumlahAnggotaKeluarga = "Isi jumlah anggota keluarga serumah (1–30), termasuk pendaftar.";
  const teleponOrangTua = normalHp(v.teleponOrangTua);
  if (!teleponOrangTua) e.teleponOrangTua = "Isi nomor HP/WhatsApp orang tua atau wali yang aktif, diawali 08.";
  if (Object.keys(e).length) return gagal(e, v);
  const data = { namaAyah: v.namaAyah, namaIbu: v.namaIbu, namaWali: v.namaWali || null, jumlahAnggotaKeluarga: jml, teleponOrangTua };
  const db = await getDb();
  await db.insert(dataKeluarga).values({ pendaftaranId, ...data }).onDuplicateKeyUpdate({ set: data });
  return {};
}

export async function simpanEkonomiCore(pendaftaranId: string, v: Nilai): Promise<HasilSimpan> {
  const e: Record<string, string> = {};
  const penghasilan = Number(angka(v.penghasilanBulanan));
  if (v.penghasilanBulanan === "" || !Number.isFinite(penghasilan)) e.penghasilanBulanan = "Isi total penghasilan orang tua per bulan (angka saja, boleh 0).";
  if (!v.pekerjaan) e.pekerjaan = "Isi pekerjaan utama orang tua/wali.";
  const tanggungan = Number(v.tanggungan);
  if (!Number.isInteger(tanggungan) || tanggungan < 0 || tanggungan > 30) e.tanggungan = "Isi jumlah tanggungan (0–30).";
  if (Object.keys(e).length) return gagal(e, v);
  const db = await getDb();
  const [surat] = await db
    .select({ id: berkas.id })
    .from(berkas)
    .where(and(eq(berkas.pendaftaranId, pendaftaranId), eq(berkas.jenis, "surat_ekonomi")));
  const data = {
    penghasilanBulanan: penghasilan,
    pekerjaan: v.pekerjaan,
    tanggungan,
    keteranganTambahan: v.keteranganTambahan || null,
    suratKebutuhanEkonomiUrl: surat ? `/api/berkas/${surat.id}` : null,
  };
  await db.insert(ekonomiOrangtua).values({ pendaftaranId, ...data }).onDuplicateKeyUpdate({ set: data });
  return {};
}

/**
 * Pilihan jurusan:
 * - "pendaftar": pendaftar sebelum mengirim (hanya jurusan aktif yang dibuka untuk pilihan 1/2).
 * - "admin": admin (jurusan aktif mana pun; jurusan tempat diterima harus tetap ada di pilihan).
 * - "tidak": pilihan jurusan tidak diubah (pendaftar setelah mengirim).
 */
export async function simpanSekolahCore(pendaftaranId: string, v: Nilai, modeJurusan: "pendaftar" | "admin" | "tidak"): Promise<HasilSimpan> {
  const ubahJurusan = modeJurusan !== "tidak";
  const e: Record<string, string> = {};
  wajib(v, e, [
    ["namaSekolah", "Nama sekolah wajib diisi."],
    ["jurusanSekolah", "Jurusan di sekolah wajib diisi."],
    ...(ubahJurusan
      ? ([
          ["jurusan1Id", "Pilih Jurusan 1."],
          ["jurusan2Id", "Pilih Jurusan 2."],
        ] as [string, string][])
      : []),
  ]);
  const npsn = angka(v.npsn);
  // Mode cari: belum memilih sekolah cukup satu pesan di kolom nama.
  if (!v.namaSekolah && v.sekolahManual !== "1") e.namaSekolah = "Cari lalu pilih sekolah dari daftar, atau isi manual bila tidak ada.";
  else if (npsn.length !== 8) e.npsn = "NPSN terdiri dari 8 digit angka.";
  const tahun = Number(v.tahunLulus);
  // Koreksi oleh admin dan pendaftar yang sudah mengirim tidak dibatasi rentang tahun berjalan (data lama tetap bisa dikoreksi).
  if (modeJurusan === "pendaftar" && !tahunLulusBoleh().includes(tahun)) e.tahunLulus = `Hanya lulusan tahun ${tahunLulusBoleh().join(", ")} yang dapat mendaftar.`;
  const db = await getDb();
  if (ubahJurusan) {
    if (v.jurusan1Id && v.jurusan1Id === v.jurusan2Id) e.jurusan2Id = "Jurusan 2 harus berbeda dari Jurusan 1.";
    const cekJurusan = async (id: string, kolom: "bukaPilihan1" | "bukaPilihan2") => {
      const [j] = await db.select().from(jurusan).where(eq(jurusan.id, id));
      return !!j && j.aktif && (modeJurusan === "admin" || j[kolom]);
    };
    const pesan = (n: 1 | 2) => (modeJurusan === "admin" ? "Jurusan tidak ditemukan atau nonaktif." : `Jurusan ini tidak dibuka untuk pilihan ${n}.`);
    if (v.jurusan1Id && !e.jurusan1Id && !(await cekJurusan(v.jurusan1Id, "bukaPilihan1"))) e.jurusan1Id = pesan(1);
    if (v.jurusan2Id && !e.jurusan2Id && !(await cekJurusan(v.jurusan2Id, "bukaPilihan2"))) e.jurusan2Id = pesan(2);
    if (modeJurusan === "admin" && !e.jurusan1Id && !e.jurusan2Id) {
      const [p] = await db.select({ diterima: pendaftaran.jurusanDiterimaId }).from(pendaftaran).where(eq(pendaftaran.id, pendaftaranId));
      if (p?.diterima && p.diterima !== v.jurusan1Id && p.diterima !== v.jurusan2Id)
        e.jurusan1Id = "Pendaftar sudah diumumkan diterima di salah satu jurusan; jurusan itu harus tetap menjadi Jurusan 1 atau 2.";
    }
  }
  // NPSN yang sudah ada di master harus dipakai dengan nama sekolah yang sama; yang belum ada ditambahkan ke master.
  const [master] = !e.npsn ? await db.select().from(masterSekolah).where(eq(masterSekolah.npsn, npsn)) : [];
  if (master && v.namaSekolah && !samaNama(master.nama, v.namaSekolah))
    e.npsn = `NPSN ${npsn} sudah terdaftar atas nama "${master.nama}". Cari dan pilih sekolah itu, atau periksa kembali NPSN.`;
  if (Object.keys(e).length) return gagal(e, v);

  const sekolah = { namaSekolah: master?.nama ?? v.namaSekolah.replace(/\s+/g, " "), npsn, tahunLulus: tahun, jurusanSekolah: v.jurusanSekolah };
  const pilihan = { jurusan1Id: v.jurusan1Id, jurusan2Id: v.jurusan2Id };
  await db.transaction(async (tx) => {
    if (!master)
      await tx
        .insert(masterSekolah)
        .values({ npsn, nama: sekolah.namaSekolah, kataCari: kataCariSekolah(sekolah.namaSekolah), sumber: modeJurusan === "admin" ? "admin" : "pendaftar" })
        .onDuplicateKeyUpdate({ set: { npsn } });
    await tx.insert(dataSekolah).values({ pendaftaranId, ...sekolah }).onDuplicateKeyUpdate({ set: sekolah });
    if (ubahJurusan) await tx.insert(pilihanJurusan).values({ pendaftaranId, ...pilihan }).onDuplicateKeyUpdate({ set: pilihan });
  });
  return {};
}

export async function simpanRekomendasiCore(pendaftaranId: string, v: Nilai): Promise<HasilSimpan> {
  const e: Record<string, string> = {};
  const db = await getDb();
  const [sumber] = v.sumberId ? await db.select().from(sumberRekomendasi).where(eq(sumberRekomendasi.id, v.sumberId)) : [];
  if (!sumber || !sumber.aktif) e.sumberId = "Pilih dari mana pendaftar mendapat rekomendasi/informasi.";
  const telepon = v.teleponPerekomendasi ? normalHp(v.teleponPerekomendasi) : null;
  // Nama & nomor perekomendasi wajib kecuali untuk sumber yang diatur admin tanpa kontak (mis. Media Sosial).
  const wajibKontak = sumber?.butuhKontak ?? true;
  if (wajibKontak && (v.namaPerekomendasi ?? "").length < 3) e.namaPerekomendasi = "Tulis nama lengkap orang yang merekomendasikan.";
  if (v.namaPerekomendasi && v.namaPerekomendasi.length > 150) e.namaPerekomendasi = "Nama maksimal 150 karakter.";
  if (wajibKontak && !v.teleponPerekomendasi) e.teleponPerekomendasi = "Isi nomor HP/WhatsApp perekomendasi, diawali 08.";
  else if (v.teleponPerekomendasi && !telepon) e.teleponPerekomendasi = "Nomor HP diawali 08, 10–14 digit.";
  if (Object.keys(e).length) return gagal(e, v);

  const data = { sumberId: sumber.id, namaPerekomendasi: v.namaPerekomendasi || null, teleponPerekomendasi: telepon };
  await db.insert(rekomendasi).values({ pendaftaranId, ...data }).onDuplicateKeyUpdate({ set: data });
  return {};
}

/** NIM & kelas dari bagian akademik; dipakai bersama oleh akun mahasiswa dan admin (Master Mahasiswa). Kosong = dikosongkan. */
export async function simpanAkademikCore(pendaftaranId: string, v: Nilai): Promise<HasilSimpan> {
  const e: Record<string, string> = {};
  const nim = (v.nim ?? "").replace(/\s/g, "").toUpperCase();
  const kelas = (v.kelas ?? "").trim().toUpperCase();
  if (nim && !/^[A-Z0-9][A-Z0-9./-]{3,29}$/.test(nim)) e.nim = "NIM 4–30 karakter: huruf, angka, titik, garis miring, atau strip.";
  if (kelas && !/^[A-Z0-9][A-Z0-9 ./-]{0,29}$/.test(kelas)) e.kelas = "Kelas maksimal 30 karakter, hanya huruf, angka, spasi, atau strip (mis. TI-1A).";
  const db = await getDb();
  if (nim && !e.nim) {
    const [dipakai] = await db.select({ id: pendaftaran.id }).from(pendaftaran).where(and(eq(pendaftaran.nim, nim), ne(pendaftaran.id, pendaftaranId))).limit(1);
    if (dipakai) e.nim = "NIM ini sudah dipakai mahasiswa lain. Periksa kembali, atau hubungi admin.";
  }
  if (Object.keys(e).length) return gagal(e, v);
  try {
    await db.update(pendaftaran).set({ nim: nim || null, kelas: kelas || null, updatedAt: new Date() }).where(eq(pendaftaran.id, pendaftaranId));
  } catch (err) {
    // Dua penyimpanan NIM yang sama hampir bersamaan: yang kalah mendapat pesan yang sama dengan pemeriksaan di atas.
    if (isDuplikat(err)) return gagal({ nim: "NIM ini sudah dipakai mahasiswa lain. Periksa kembali, atau hubungi admin." }, v);
    throw err;
  }
  return {};
}
