"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
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
  wilayahKecamatan,
  AGAMA,
  DESIL,
} from "@/db/schema";
import { requirePendaftar } from "@/lib/auth";
import { MAX_UMUR, TAHUN_LULUS, hitungUmur, normalHp } from "@/lib/constants";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { bisaDiedit, cekKelengkapan, muatLengkap, pendaftaranSaya } from "@/lib/pendaftaran";

async function ambilDraft() {
  const user = await requirePendaftar();
  const p = await pendaftaranSaya(user.id);
  return { user, p, editable: bisaDiedit(p.status) };
}

const TERKUNCI: FormState = { message: "Pendaftaran sudah dikirim dan sedang diproses, sehingga data tidak dapat diubah." };

async function sentuh(id: string) {
  const db = await getDb();
  await db.update(pendaftaran).set({ updatedAt: new Date() }).where(eq(pendaftaran.id, id));
  revalidatePath("/", "layout");
}

const angka = (s: string | undefined) => (s ?? "").replace(/\D/g, "");
const wajib = (v: Record<string, string>, errors: Record<string, string>, fields: [string, string][]) => {
  for (const [k, msg] of fields) if (!v[k]) errors[k] = msg;
};

export async function simpanDataDiri(_: FormState, fd: FormData): Promise<FormState> {
  const { p, editable } = await ambilDraft();
  if (!editable) return TERKUNCI;
  const v = nilaiForm(fd);
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
  const nik = angka(v.nik);
  if (nik.length !== 16) e.nik = "NIK harus 16 digit angka (lihat KTP atau KK).";
  const rt = angka(v.rt), rw = angka(v.rw);
  if (!rt || rt.length > 3) e.rt = "Isi nomor RT (1–3 digit).";
  if (!rw || rw.length > 3) e.rw = "Isi nomor RW (1–3 digit).";
  const kontak = normalHp(v.kontak);
  if (!kontak) e.kontak = "Nomor HP/WhatsApp diawali 08, 10–14 digit.";
  const nomorKip = (v.nomorPendaftaranKip ?? "").replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9./-]{5,29}$/.test(nomorKip)) e.nomorPendaftaranKip = "Isi nomor pendaftaran KIP Kuliah dari akun SIM KIP Kuliah Anda (6–30 karakter).";
  const nisn = angka(v.nisn);
  if (nisn.length !== 10) e.nisn = "NISN terdiri dari 10 digit angka.";
  if (!(DESIL as readonly string[]).includes(v.desil)) e.desil = "Pilih desil sesuai data DTSEN Anda.";
  if (v.penerimaPip !== "ya" && v.penerimaPip !== "tidak") e.penerimaPip = "Pilih Ya atau Tidak.";
  if (!(AGAMA as readonly string[]).includes(v.agama)) e.agama = "Pilih agama.";
  if (v.statusPernikahan !== "belum_menikah" && v.statusPernikahan !== "menikah") e.statusPernikahan = "Pilih status pernikahan.";
  if (v.tanggalLahir) {
    const lahir = new Date(v.tanggalLahir);
    if (isNaN(+lahir) || lahir > new Date() || lahir.getFullYear() < 1950) e.tanggalLahir = "Tanggal lahir tidak valid.";
  }
  if (v.jenisKelamin && !["L", "P"].includes(v.jenisKelamin)) e.jenisKelamin = "Pilih jenis kelamin.";
  const db = await getDb();
  if (v.kecamatanId && v.kabupatenId) {
    const [kec] = await db
      .select({ id: wilayahKecamatan.id })
      .from(wilayahKecamatan)
      .where(and(eq(wilayahKecamatan.id, v.kecamatanId), eq(wilayahKecamatan.kabupatenId, v.kabupatenId)));
    if (!kec) e.kecamatanId = "Kecamatan tidak sesuai dengan kabupaten/kota yang dipilih.";
  }
  if (Object.keys(e).length) return { errors: e, values: v, message: "Masih ada isian yang perlu diperbaiki." };

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
  await db.insert(dataDiri).values({ pendaftaranId: p.id, ...data }).onDuplicateKeyUpdate({ set: data });
  await sentuh(p.id);
  // Umur > 21 tetap disimpan (agar tidak kehilangan isian) tetapi pengiriman akan diblokir & diperingatkan.
  const umur = hitungUmur(data.tanggalLahir);
  if (umur > MAX_UMUR) redirect(`/formulir/data-diri?peringatan=umur`);
  redirect("/formulir/keluarga");
}

export async function simpanKeluarga(_: FormState, fd: FormData): Promise<FormState> {
  const { p, editable } = await ambilDraft();
  if (!editable) return TERKUNCI;
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  wajib(v, e, [
    ["namaAyah", "Nama ayah wajib diisi. Tulis nama sesuai KK, meskipun sudah meninggal."],
    ["namaIbu", "Nama ibu wajib diisi. Tulis nama sesuai KK, meskipun sudah meninggal."],
  ]);
  const jml = Number(v.jumlahAnggotaKeluarga);
  if (!Number.isInteger(jml) || jml < 1 || jml > 30) e.jumlahAnggotaKeluarga = "Isi jumlah anggota keluarga serumah (1–30), termasuk Anda.";
  const teleponOrangTua = normalHp(v.teleponOrangTua);
  if (!teleponOrangTua) e.teleponOrangTua = "Isi nomor HP/WhatsApp orang tua atau wali yang aktif, diawali 08.";
  if (Object.keys(e).length) return { errors: e, values: v, message: "Masih ada isian yang perlu diperbaiki." };
  const data = { namaAyah: v.namaAyah, namaIbu: v.namaIbu, namaWali: v.namaWali || null, jumlahAnggotaKeluarga: jml, teleponOrangTua };
  const db = await getDb();
  await db.insert(dataKeluarga).values({ pendaftaranId: p.id, ...data }).onDuplicateKeyUpdate({ set: data });
  await sentuh(p.id);
  redirect("/formulir/ekonomi");
}

export async function simpanEkonomi(_: FormState, fd: FormData): Promise<FormState> {
  const { p, editable } = await ambilDraft();
  if (!editable) return TERKUNCI;
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  const penghasilan = Number(angka(v.penghasilanBulanan));
  if (v.penghasilanBulanan === "" || !Number.isFinite(penghasilan)) e.penghasilanBulanan = "Isi total penghasilan orang tua per bulan (angka saja, boleh 0).";
  if (!v.pekerjaan) e.pekerjaan = "Isi pekerjaan utama orang tua/wali.";
  const tanggungan = Number(v.tanggungan);
  if (!Number.isInteger(tanggungan) || tanggungan < 0 || tanggungan > 30) e.tanggungan = "Isi jumlah tanggungan (0–30).";
  if (Object.keys(e).length) return { errors: e, values: v, message: "Masih ada isian yang perlu diperbaiki." };
  const db = await getDb();
  const [surat] = await db
    .select({ id: berkas.id })
    .from(berkas)
    .where(and(eq(berkas.pendaftaranId, p.id), eq(berkas.jenis, "surat_ekonomi")));
  const data = {
    penghasilanBulanan: penghasilan,
    pekerjaan: v.pekerjaan,
    tanggungan,
    keteranganTambahan: v.keteranganTambahan || null,
    suratKebutuhanEkonomiUrl: surat ? `/api/berkas/${surat.id}` : null,
  };
  await db.insert(ekonomiOrangtua).values({ pendaftaranId: p.id, ...data }).onDuplicateKeyUpdate({ set: data });
  await sentuh(p.id);
  redirect("/formulir/sekolah");
}

export async function simpanSekolah(_: FormState, fd: FormData): Promise<FormState> {
  const { p, editable } = await ambilDraft();
  if (!editable) return TERKUNCI;
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  wajib(v, e, [
    ["namaSekolah", "Nama sekolah wajib diisi."],
    ["jurusanSekolah", "Jurusan di sekolah wajib diisi."],
    ["jurusan1Id", "Pilih Jurusan 1."],
    ["jurusan2Id", "Pilih Jurusan 2."],
  ]);
  const npsn = angka(v.npsn);
  if (npsn.length !== 8) e.npsn = "NPSN terdiri dari 8 digit angka.";
  const tahun = Number(v.tahunLulus);
  if (!(TAHUN_LULUS as readonly number[]).includes(tahun)) e.tahunLulus = `Hanya lulusan tahun ${TAHUN_LULUS.join(", ")} yang dapat mendaftar.`;
  if (v.jurusan1Id && v.jurusan1Id === v.jurusan2Id) e.jurusan2Id = "Jurusan 2 harus berbeda dari Jurusan 1.";
  const db = await getDb();
  const cekJurusan = async (id: string, kolom: "bukaPilihan1" | "bukaPilihan2") => {
    const [j] = await db.select().from(jurusan).where(eq(jurusan.id, id));
    return !!j && j.aktif && j[kolom];
  };
  if (v.jurusan1Id && !e.jurusan1Id && !(await cekJurusan(v.jurusan1Id, "bukaPilihan1"))) e.jurusan1Id = "Jurusan ini tidak dibuka untuk pilihan 1.";
  if (v.jurusan2Id && !e.jurusan2Id && !(await cekJurusan(v.jurusan2Id, "bukaPilihan2"))) e.jurusan2Id = "Jurusan ini tidak dibuka untuk pilihan 2.";
  if (Object.keys(e).length) return { errors: e, values: v, message: "Masih ada isian yang perlu diperbaiki." };

  const sekolah = { namaSekolah: v.namaSekolah, npsn, tahunLulus: tahun, jurusanSekolah: v.jurusanSekolah };
  const pilihan = { jurusan1Id: v.jurusan1Id, jurusan2Id: v.jurusan2Id };
  await db.transaction(async (tx) => {
    await tx.insert(dataSekolah).values({ pendaftaranId: p.id, ...sekolah }).onDuplicateKeyUpdate({ set: sekolah });
    await tx.insert(pilihanJurusan).values({ pendaftaranId: p.id, ...pilihan }).onDuplicateKeyUpdate({ set: pilihan });
  });
  await sentuh(p.id);
  redirect("/formulir/rekomendasi");
}

export async function simpanRekomendasi(_: FormState, fd: FormData): Promise<FormState> {
  const { p, editable } = await ambilDraft();
  if (!editable) return TERKUNCI;
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  const db = await getDb();
  const [sumber] = v.sumberId ? await db.select().from(sumberRekomendasi).where(eq(sumberRekomendasi.id, v.sumberId)) : [];
  if (!sumber || !sumber.aktif) e.sumberId = "Pilih dari mana Anda mendapat rekomendasi/informasi.";
  const telepon = v.teleponPerekomendasi ? normalHp(v.teleponPerekomendasi) : null;
  // Nama & nomor perekomendasi wajib kecuali untuk sumber yang diatur admin tanpa kontak (mis. Media Sosial).
  const wajibKontak = sumber?.butuhKontak ?? true;
  if (wajibKontak && (v.namaPerekomendasi ?? "").length < 3) e.namaPerekomendasi = "Tulis nama lengkap orang yang merekomendasikan.";
  if (v.namaPerekomendasi && v.namaPerekomendasi.length > 150) e.namaPerekomendasi = "Nama maksimal 150 karakter.";
  if (wajibKontak && !v.teleponPerekomendasi) e.teleponPerekomendasi = "Isi nomor HP/WhatsApp perekomendasi, diawali 08.";
  else if (v.teleponPerekomendasi && !telepon) e.teleponPerekomendasi = "Nomor HP diawali 08, 10–14 digit.";
  if (Object.keys(e).length) return { errors: e, values: v, message: "Masih ada isian yang perlu diperbaiki." };

  const data = { sumberId: sumber.id, namaPerekomendasi: v.namaPerekomendasi || null, teleponPerekomendasi: telepon };
  await db.insert(rekomendasi).values({ pendaftaranId: p.id, ...data }).onDuplicateKeyUpdate({ set: data });
  await sentuh(p.id);
  redirect("/formulir/berkas");
}

export async function kirimPendaftaran(_: FormState, fd: FormData): Promise<FormState> {
  const { user, p, editable } = await ambilDraft();
  if (!editable) return TERKUNCI;
  if (fd.get("setuju") !== "on") return { errors: { setuju: "Centang pernyataan ini sebelum mengirim." } };
  const lengkap = await muatLengkap(p.id);
  const cek = cekKelengkapan(lengkap!);
  if (!cek.siapKirim) return { message: "Pendaftaran belum bisa dikirim: " + cek.masalah.join(" ") };
  const db = await getDb();
  const kirimUlang = p.status === "perbaikan";
  await db.transaction(async (tx) => {
    await tx.update(pendaftaran).set({ status: "terkirim", submittedAt: new Date(), updatedAt: new Date() }).where(eq(pendaftaran.id, p.id));
    await tx.insert(riwayatStatus).values({
      pendaftaranId: p.id,
      status: "terkirim",
      catatan: kirimUlang ? "Pendaftaran dikirim ulang setelah perbaikan" : "Pendaftaran dikirim oleh pendaftar",
      diubahOleh: user.id,
    });
  });
  revalidatePath("/", "layout");
  redirect("/status?terkirim=1");
}
