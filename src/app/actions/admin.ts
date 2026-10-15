"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { berkas, dataDiri, faq, jenisBeasiswa, jurusan, pendaftaran, pertanyaan, pilihanJurusan, rekomendasi, riwayatStatus, sumberRekomendasi, TAHAP, users, type Tahap } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { kirimEmailPengumuman, smtpAktif, urlAplikasi } from "@/lib/mail";
import { ALASAN_TIDAK_DITERIMA, ALASAN_TIDAK_LOLOS_ADMINISTRASI, TAHAP_LABEL } from "@/lib/constants";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { JENIS_LANJUT, JENIS_PENGUMUMAN, type JenisPengumuman } from "@/lib/pengumuman";

/**
 * Admin memindahkan pendaftar ke tahap seleksi berikutnya (atau mana pun), dengan catatan untuk pendaftar.
 * - Seleksi Administrasi boleh disertai hasil: Lolos (otomatis lanjut ke Seleksi Ujian) atau Tidak lolos (wajib alasan; proses berhenti).
 * - Pengumuman wajib disertai hasil; bila diterima, jurusan harus salah satu dari Jurusan 1/2 pilihan pendaftar.
 */
export async function perbaruiTahap(pendaftaranId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const v = nilaiForm(fd);
  const tahapDipilih = v.tahap as Tahap;
  const catatan = v.catatan ?? "";
  const e: Record<string, string> = {};
  if (!TAHAP.includes(tahapDipilih)) e.tahap = "Pilih tahap seleksi.";
  const pengumuman = tahapDipilih === "pengumuman";

  // Hasil Seleksi Administrasi
  const hasilAdm = tahapDipilih === "administrasi" ? v.hasilAdministrasi || "" : "";
  if (hasilAdm && hasilAdm !== "lolos" && hasilAdm !== "tidak_lolos") e.hasilAdministrasi = "Pilih hasil Seleksi Administrasi.";
  if (hasilAdm === "tidak_lolos" && !(ALASAN_TIDAK_LOLOS_ADMINISTRASI as readonly string[]).includes(v.alasan ?? ""))
    e.alasan = "Pilih alasan tidak lolos.";
  const lolosAdm = hasilAdm === "lolos";
  // Lolos administrasi = langsung masuk Seleksi Ujian.
  const tahap: Tahap = lolosAdm ? "ujian" : tahapDipilih;

  const hasil = pengumuman ? (v.hasil as "diterima" | "ditolak") : hasilAdm === "tidak_lolos" ? "ditolak" : null;
  if (pengumuman && hasil !== "diterima" && hasil !== "ditolak") e.hasil = "Pilih hasil pengumuman.";
  if (pengumuman && hasil === "ditolak" && !(ALASAN_TIDAK_DITERIMA as readonly string[]).includes(v.alasanPengumuman ?? ""))
    e.alasanPengumuman = "Pilih alasan tidak diterima.";
  // Alasan disimpan untuk Tidak lolos Administrasi maupun Tidak diterima di Pengumuman.
  const alasan = hasilAdm === "tidak_lolos" ? v.alasan : pengumuman && hasil === "ditolak" ? v.alasanPengumuman : null;

  const db = await getDb();
  const [p] = await db.select().from(pendaftaran).where(eq(pendaftaran.id, pendaftaranId));
  if (!p) return { message: "Pendaftaran tidak ditemukan." };
  if (p.status === "draft") return { message: "Pendaftaran ini belum dikirim oleh pendaftar." };
  const [pil] = await db.select().from(pilihanJurusan).where(eq(pilihanJurusan.pendaftaranId, pendaftaranId));
  const jurusanDiterimaId = hasil === "diterima" ? v.jurusanDiterimaId : null;
  if (hasil === "diterima" && (!pil || (jurusanDiterimaId !== pil.jurusan1Id && jurusanDiterimaId !== pil.jurusan2Id)))
    e.jurusanDiterimaId = "Pilih jurusan yang diterima (Jurusan 1 atau Jurusan 2 pilihan pendaftar).";
  const jenisBeasiswaId = hasil === "diterima" ? v.jenisBeasiswaId : null;
  if (hasil === "diterima") {
    const [b] = jenisBeasiswaId ? await db.select({ id: jenisBeasiswa.id, aktif: jenisBeasiswa.aktif }).from(jenisBeasiswa).where(eq(jenisBeasiswa.id, jenisBeasiswaId)) : [];
    // Jenis beasiswa nonaktif hanya boleh dipertahankan bila memang sudah tertera pada pendaftar ini.
    if (!b || (!b.aktif && p.jenisBeasiswaId !== b.id)) e.jenisBeasiswaId = "Pilih jenis beasiswa yang ditetapkan.";
  }
  if (Object.keys(e).length) return { errors: e, values: v };

  const [j] = jurusanDiterimaId ? await db.select({ nama: jurusan.nama }).from(jurusan).where(eq(jurusan.id, jurusanDiterimaId)) : [];
  let statusRiwayat: string;
  let catatanBawaan: string;
  if (lolosAdm) {
    statusRiwayat = "lolos:administrasi";
    catatanBawaan = "Selamat, Anda lolos Seleksi Administrasi dan lanjut ke Seleksi Ujian.";
  } else if (hasilAdm === "tidak_lolos") {
    statusRiwayat = "tidak_lolos:administrasi";
    catatanBawaan = `Tidak lolos Seleksi Administrasi. Alasan: ${alasan}.`;
  } else if (pengumuman) {
    statusRiwayat = hasil!;
    catatanBawaan =
      hasil === "diterima"
        ? `Selamat, Anda diterima sebagai penerima KIP Kuliah di program studi ${j?.nama ?? "-"}.`
        : `Pendaftaran tidak diterima. Alasan: ${alasan}.`;
  } else {
    statusRiwayat = tahap;
    catatanBawaan = `Masuk tahap ${TAHAP_LABEL[tahap]}`;
  }
  // Untuk hasil positif/negatif, kalimat bawaan selalu ikut; catatan admin ditambahkan di bawahnya.
  const catatanRiwayat = !catatan ? catatanBawaan : statusRiwayat === tahap ? catatan : `${catatanBawaan}\n${catatan}`;
  await db.transaction(async (tx) => {
    await tx
      .update(pendaftaran)
      .set({
        tahap,
        // Status lama tetap dipakai untuk filter & statistik: proses seleksi = "diperiksa", gugur/pengumuman = hasilnya.
        status: hasil ?? "diperiksa",
        hasil,
        jurusanDiterimaId,
        jenisBeasiswaId,
        alasanDitolak: alasan,
        catatanAdmin: catatan || null,
        updatedAt: new Date(),
      })
      .where(eq(pendaftaran.id, pendaftaranId));
    if (lolosAdm)
      // Catat juga perpindahan ke tahap berikutnya agar alur di sisi pendaftar punya tanggalnya.
      await tx.insert(riwayatStatus).values({ pendaftaranId, status: statusRiwayat, catatan: catatanRiwayat, diubahOleh: admin.id });
    await tx.insert(riwayatStatus).values({
      pendaftaranId,
      status: lolosAdm ? "ujian" : statusRiwayat,
      catatan: lolosAdm ? "Masuk tahap Seleksi Ujian" : catatanRiwayat,
      diubahOleh: admin.id,
    });
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Tahap seleksi tersimpan dan sudah terlihat oleh pendaftar." };
}

export async function verifikasiBerkas(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  if (!["menunggu", "valid", "tidak_valid"].includes(status)) return;
  const db = await getDb();
  await db
    .update(berkas)
    .set({ statusVerifikasi: status as "menunggu" | "valid" | "tidak_valid" })
    .where(eq(berkas.id, id));
  revalidatePath("/admin/pendaftar");
}

// ---------- Kelola jurusan ----------

export async function simpanJurusan(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const id = v.id || null;
  const e: Record<string, string> = {};
  const kode = v.kode.toUpperCase();
  if (!/^[A-Z0-9-]{1,10}$/.test(kode)) e.kode = "Kode 1–10 huruf/angka.";
  if (v.nama.length < 3) e.nama = "Nama jurusan minimal 3 huruf.";
  const db = await getDb();
  if (!e.kode) {
    const [dup] = await db
      .select({ id: jurusan.id })
      .from(jurusan)
      .where(id ? and(eq(jurusan.kode, kode), ne(jurusan.id, id)) : eq(jurusan.kode, kode));
    if (dup) e.kode = "Kode sudah dipakai jurusan lain.";
  }
  if (Object.keys(e).length) return { errors: e, values: v };
  const data = { kode, nama: v.nama, bukaPilihan1: fd.get("bukaPilihan1") === "on", bukaPilihan2: fd.get("bukaPilihan2") === "on", aktif: fd.get("aktif") === "on" };
  if (id) await db.update(jurusan).set(data).where(eq(jurusan.id, id));
  else await db.insert(jurusan).values(data);
  revalidatePath("/admin/jurusan");
  revalidatePath("/formulir/sekolah");
  return { ok: true, message: id ? "Jurusan diperbarui." : "Jurusan ditambahkan." };
}

export async function toggleJurusan(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const field = String(fd.get("field"));
  if (!["aktif", "bukaPilihan1", "bukaPilihan2"].includes(field)) return;
  const db = await getDb();
  const [j] = await db.select().from(jurusan).where(eq(jurusan.id, id));
  if (!j) return;
  const key = field as "aktif" | "bukaPilihan1" | "bukaPilihan2";
  await db.update(jurusan).set({ [key]: !j[key] }).where(eq(jurusan.id, id));
  revalidatePath("/admin/jurusan");
}

// ---------- Tanya admin & FAQ ----------

export async function jawabPertanyaan(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const jawaban = String(fd.get("jawaban") ?? "").trim();
  if (jawaban.length < 2) return { errors: { jawaban: "Tulis jawaban." } };
  const db = await getDb();
  await db.update(pertanyaan).set({ jawaban, dijawabOleh: admin.id, answeredAt: new Date() }).where(eq(pertanyaan.id, id));
  revalidatePath("/admin/pertanyaan");
  revalidatePath("/bantuan");
  return { ok: true, message: "Jawaban terkirim." };
}

export async function simpanFaq(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const e: Record<string, string> = {};
  if (v.pertanyaan.length < 5) e.pertanyaan = "Tulis pertanyaan.";
  if (v.jawaban.length < 5) e.jawaban = "Tulis jawaban.";
  if (Object.keys(e).length) return { errors: e, values: v };
  const data = { pertanyaan: v.pertanyaan, jawaban: v.jawaban, urutan: Number(v.urutan) || 0 };
  const db = await getDb();
  if (v.id) await db.update(faq).set(data).where(eq(faq.id, v.id));
  else await db.insert(faq).values(data);
  revalidatePath("/admin/faq");
  revalidatePath("/bantuan");
  return { ok: true, message: "FAQ tersimpan." };
}

export async function hapusFaq(fd: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db.delete(faq).where(eq(faq.id, String(fd.get("id"))));
  revalidatePath("/admin/faq");
  revalidatePath("/bantuan");
}

// ---------- Kelola sumber rekomendasi ----------

export async function simpanSumberRekomendasi(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const id = v.id || null;
  const e: Record<string, string> = {};
  if (v.nama.length < 2 || v.nama.length > 60) e.nama = "Nama pilihan 2–60 karakter.";
  const db = await getDb();
  if (!e.nama) {
    const [dup] = await db
      .select({ id: sumberRekomendasi.id })
      .from(sumberRekomendasi)
      .where(id ? and(eq(sumberRekomendasi.nama, v.nama), ne(sumberRekomendasi.id, id)) : eq(sumberRekomendasi.nama, v.nama));
    if (dup) e.nama = "Pilihan dengan nama ini sudah ada.";
  }
  if (Object.keys(e).length) return { errors: e, values: v };
  const data = { nama: v.nama, urutan: Number(v.urutan) || 0, butuhKontak: fd.get("butuhKontak") === "on", aktif: fd.get("aktif") === "on" };
  if (id) await db.update(sumberRekomendasi).set(data).where(eq(sumberRekomendasi.id, id));
  else await db.insert(sumberRekomendasi).values(data);
  revalidatePath("/admin/rekomendasi");
  revalidatePath("/formulir/rekomendasi");
  return { ok: true, message: id ? "Pilihan diperbarui." : "Pilihan ditambahkan." };
}

export async function toggleSumberRekomendasi(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const field = String(fd.get("field"));
  if (field !== "aktif" && field !== "butuhKontak") return;
  const db = await getDb();
  const [s] = await db.select().from(sumberRekomendasi).where(eq(sumberRekomendasi.id, id));
  if (!s) return;
  await db.update(sumberRekomendasi).set({ [field]: !s[field] }).where(eq(sumberRekomendasi.id, id));
  revalidatePath("/admin/rekomendasi");
}

/** Hapus hanya bila belum pernah dipilih pendaftar; selain itu cukup dinonaktifkan. */
export async function hapusSumberRekomendasi(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(rekomendasi).where(eq(rekomendasi.sumberId, id));
  if (n > 0) await db.update(sumberRekomendasi).set({ aktif: false }).where(eq(sumberRekomendasi.id, id));
  else await db.delete(sumberRekomendasi).where(eq(sumberRekomendasi.id, id));
  revalidatePath("/admin/rekomendasi");
}

// ---------- Master jenis beasiswa ----------

export async function simpanJenisBeasiswa(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const id = v.id || null;
  const e: Record<string, string> = {};
  if (v.nama.length < 2 || v.nama.length > 100) e.nama = "Nama jenis beasiswa 2–100 karakter.";
  const db = await getDb();
  if (!e.nama) {
    const [dup] = await db
      .select({ id: jenisBeasiswa.id })
      .from(jenisBeasiswa)
      .where(id ? and(eq(jenisBeasiswa.nama, v.nama), ne(jenisBeasiswa.id, id)) : eq(jenisBeasiswa.nama, v.nama));
    if (dup) e.nama = "Jenis beasiswa dengan nama ini sudah ada.";
  }
  if (Object.keys(e).length) return { errors: e, values: v };
  const data = { nama: v.nama, urutan: Number(v.urutan) || 0, aktif: fd.get("aktif") === "on" };
  if (id) await db.update(jenisBeasiswa).set(data).where(eq(jenisBeasiswa.id, id));
  else await db.insert(jenisBeasiswa).values(data);
  revalidatePath("/admin", "layout");
  return { ok: true, message: id ? "Jenis beasiswa diperbarui." : "Jenis beasiswa ditambahkan." };
}

export async function toggleJenisBeasiswa(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const db = await getDb();
  const [b] = await db.select().from(jenisBeasiswa).where(eq(jenisBeasiswa.id, id));
  if (!b) return;
  await db.update(jenisBeasiswa).set({ aktif: !b.aktif }).where(eq(jenisBeasiswa.id, id));
  revalidatePath("/admin", "layout");
}

/** Hapus hanya bila belum ditetapkan ke mahasiswa; selain itu cukup dinonaktifkan. */
export async function hapusJenisBeasiswa(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(pendaftaran).where(eq(pendaftaran.jenisBeasiswaId, id));
  if (n > 0) await db.update(jenisBeasiswa).set({ aktif: false }).where(eq(jenisBeasiswa.id, id));
  else await db.delete(jenisBeasiswa).where(eq(jenisBeasiswa.id, id));
  revalidatePath("/admin", "layout");
}

// ---------- Ubah pilihan jurusan pendaftar (khusus admin) ----------

export async function ubahJurusanPendaftar(pendaftaranId: string, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const j1 = String(fd.get("jurusan1Id") ?? "");
  const j2 = String(fd.get("jurusan2Id") ?? "");
  const e: Record<string, string> = {};
  if (!j1) e.jurusan1Id = "Pilih Jurusan 1.";
  if (!j2) e.jurusan2Id = "Pilih Jurusan 2.";
  if (j1 && j1 === j2) e.jurusan2Id = "Jurusan 2 harus berbeda dari Jurusan 1.";
  const db = await getDb();
  const semua = await db.select().from(jurusan);
  const nama = (id?: string | null) => semua.find((j) => j.id === id)?.nama ?? "-";
  // Admin boleh memilih jurusan aktif mana pun, termasuk yang tidak dibuka untuk pilihan 1/2 di formulir pendaftar.
  for (const [k, id] of [["jurusan1Id", j1], ["jurusan2Id", j2]] as const)
    if (id && !e[k] && !semua.some((j) => j.id === id && j.aktif)) e[k] = "Jurusan tidak ditemukan atau nonaktif.";
  if (Object.keys(e).length) return { errors: e, values: { jurusan1Id: j1, jurusan2Id: j2 } };

  const [p] = await db.select().from(pendaftaran).where(eq(pendaftaran.id, pendaftaranId));
  if (!p) return { message: "Pendaftaran tidak ditemukan." };
  const [lama] = await db.select().from(pilihanJurusan).where(eq(pilihanJurusan.pendaftaranId, pendaftaranId));
  if (lama?.jurusan1Id === j1 && lama?.jurusan2Id === j2) return { ok: true, message: "Tidak ada perubahan pilihan jurusan." };
  if (p.jurusanDiterimaId && p.jurusanDiterimaId !== j1 && p.jurusanDiterimaId !== j2)
    return {
      message: `Pendaftar sudah diumumkan diterima di ${nama(p.jurusanDiterimaId)}. Jurusan tersebut harus tetap menjadi Jurusan 1 atau 2, atau ubah dulu status Pengumuman.`,
      values: { jurusan1Id: j1, jurusan2Id: j2 },
    };

  await db.transaction(async (tx) => {
    await tx
      .insert(pilihanJurusan)
      .values({ pendaftaranId, jurusan1Id: j1, jurusan2Id: j2 })
      .onDuplicateKeyUpdate({ set: { jurusan1Id: j1, jurusan2Id: j2 } });
    await tx.update(pendaftaran).set({ updatedAt: new Date() }).where(eq(pendaftaran.id, pendaftaranId));
    await tx.insert(riwayatStatus).values({
      pendaftaranId,
      status: p.status,
      catatan: `Admin mengubah pilihan jurusan.\nJurusan 1: ${nama(lama?.jurusan1Id)} → ${nama(j1)}\nJurusan 2: ${nama(lama?.jurusan2Id)} → ${nama(j2)}`,
      diubahOleh: admin.id,
    });
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Pilihan jurusan diperbarui dan tercatat di riwayat." };
}

// ---------- Pengumuman massal ----------

/**
 * Mengumumkan banyak pendaftar sekaligus (satu transaksi: semua berhasil atau tidak sama sekali).
 * - lolos_administrasi / selesai_ujian / selesai_wawancara: dimajukan ke tahap berikutnya (Ujian / Wawancara / Pengusulan), tanpa alasan.
 * - ditolak: Pengumuman "Tidak diterima" + alasan.
 * - diterima: Pengumuman "Diterima"; tiap pendaftar wajib punya jurusan (Jurusan 1 atau 2 pilihannya), dikirim sebagai `jurusan:<id>`.
 * Pendaftar yang statusnya sudah berubah sejak daftar dimuat (mis. diputuskan admin lain) dilewati dan dilaporkan.
 */
export async function umumkanMassal(jenis: JenisPengumuman, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  if (!JENIS_PENGUMUMAN.includes(jenis)) return { message: "Jenis pengumuman tidak dikenal." };
  const ids = [...new Set(fd.getAll("ids").map(String))].slice(0, 500);
  const catatan = String(fd.get("catatan") ?? "").trim();
  const alasan = String(fd.get("alasan") ?? "");
  if (!ids.length) return { message: "Pilih minimal satu pendaftar yang akan diumumkan." };
  if (catatan.length > 2000) return { message: "Catatan maksimal 2000 karakter." };
  const opsiAlasan: readonly string[] = jenis === "ditolak" ? ALASAN_TIDAK_DITERIMA : [];
  const lanjut = JENIS_LANJUT[jenis];
  if (jenis !== "diterima" && !lanjut && !opsiAlasan.includes(alasan)) return { errors: { alasan: "Pilih alasan." }, values: { catatan } };

  const db = await getDb();
  const rows = await db
    .select({ p: pendaftaran, pil: pilihanJurusan, email: users.email, nama: sql<string>`coalesce(${dataDiri.namaLengkap}, ${users.nama})` })
    .from(pendaftaran)
    .innerJoin(users, eq(users.id, pendaftaran.userId))
    .leftJoin(dataDiri, eq(dataDiri.pendaftaranId, pendaftaran.id))
    .leftJoin(pilihanJurusan, eq(pilihanJurusan.pendaftaranId, pendaftaran.id))
    .where(inArray(pendaftaran.id, ids));
  const layak = rows.filter(
    (r) =>
      (r.p.status === "terkirim" || r.p.status === "diperiksa") &&
      (lanjut ? (r.p.tahap ?? "administrasi") === lanjut.dari : true),
  );
  if (!layak.length) return { message: "Tidak ada pendaftar yang bisa diumumkan: statusnya sudah berubah. Muat ulang halaman." };

  const namaJurusan = new Map((await db.select({ id: jurusan.id, nama: jurusan.nama }).from(jurusan)).map((j) => [j.id, j.nama]));
  const pilihan = new Map<string, string>();
  if (jenis === "diterima") {
    const galat: string[] = [];
    for (const r of layak) {
      const j = String(fd.get(`jurusan:${r.p.id}`) ?? "");
      if (!r.pil || (j !== r.pil.jurusan1Id && j !== r.pil.jurusan2Id)) galat.push(r.nama);
      else pilihan.set(r.p.id, j);
    }
    if (galat.length)
      return {
        message: `Pilih jurusan yang diterima (Jurusan 1 atau 2 pilihan pendaftar) untuk: ${galat.slice(0, 5).join(", ")}${galat.length > 5 ? `, dan ${galat.length - 5} lainnya` : ""}.`,
        values: { catatan },
      };
  }

  let beasiswaId: string | null = null;
  if (jenis === "diterima") {
    beasiswaId = String(fd.get("jenisBeasiswaId") ?? "");
    const [b] = await db.select({ aktif: jenisBeasiswa.aktif }).from(jenisBeasiswa).where(eq(jenisBeasiswa.id, beasiswaId));
    if (!b?.aktif) return { errors: { jenisBeasiswaId: "Pilih jenis beasiswa yang ditetapkan." }, values: { catatan } };
  }

  await db.transaction(async (tx) => {
    for (const r of layak) {
      let set: Partial<typeof pendaftaran.$inferInsert>;
      let statusRiwayat: string;
      let bawaan: string;
      if (lanjut) {
        set = { tahap: lanjut.ke, status: "diperiksa", hasil: null, jurusanDiterimaId: null, jenisBeasiswaId: null, alasanDitolak: null };
        statusRiwayat = lanjut.ke;
        bawaan =
          jenis === "lolos_administrasi"
            ? "Selamat, Anda lolos Seleksi Administrasi dan lanjut ke Seleksi Ujian."
            : jenis === "selesai_ujian"
              ? "Anda telah mengikuti Seleksi Ujian dan lanjut ke Seleksi Wawancara."
              : "Anda telah mengikuti Seleksi Wawancara dan lanjut ke tahap Pengusulan.";
      } else if (jenis === "ditolak") {
        set = { tahap: "pengumuman", status: "ditolak", hasil: "ditolak", jurusanDiterimaId: null, jenisBeasiswaId: null, alasanDitolak: alasan };
        statusRiwayat = "ditolak";
        bawaan = `Pendaftaran tidak diterima. Alasan: ${alasan}.`;
      } else {
        const jid = pilihan.get(r.p.id)!;
        set = { tahap: "pengumuman", status: "diterima", hasil: "diterima", jurusanDiterimaId: jid, jenisBeasiswaId: beasiswaId, alasanDitolak: null };
        statusRiwayat = "diterima";
        bawaan = `Selamat, Anda diterima sebagai penerima KIP Kuliah di program studi ${namaJurusan.get(jid) ?? "-"}.`;
      }
      await tx
        .update(pendaftaran)
        .set({ ...set, catatanAdmin: catatan || null, updatedAt: new Date() })
        .where(eq(pendaftaran.id, r.p.id));
      // Lolos administrasi dicatat dua kali (hasil + masuk Ujian) agar alur di sisi pendaftar punya tanggal tiap tahap, sama seperti keputusan satuan.
      if (jenis === "lolos_administrasi")
        await tx.insert(riwayatStatus).values({ pendaftaranId: r.p.id, status: "lolos:administrasi", catatan: catatan ? `${bawaan}\n${catatan}` : bawaan, diubahOleh: admin.id });
      await tx.insert(riwayatStatus).values({
        pendaftaranId: r.p.id,
        status: statusRiwayat,
        catatan: jenis === "lolos_administrasi" ? "Masuk tahap Seleksi Ujian" : catatan ? `${bawaan}\n${catatan}` : bawaan,
        diubahOleh: admin.id,
      });
    }
  });
  revalidatePath("/", "layout");
  const dilewati = ids.length - layak.length;

  // Email hasil dikirim setelah data tersimpan; kegagalan email tidak membatalkan pengumuman.
  let infoEmail = "";
  if (!lanjut && fd.get("kirimEmail") === "on") {
    const url = `${await urlAplikasi()}/status`;
    const hasil = jenis as "diterima" | "ditolak";
    let berhasil = 0;
    const gagal: string[] = [];
    const antrean = [...layak];
    // Beberapa pengiriman sekaligus agar tidak terlalu lama, tetapi tidak membanjiri server SMTP.
    await Promise.all(
      Array.from({ length: Math.min(5, antrean.length) }, async () => {
        for (let r = antrean.shift(); r; r = antrean.shift()) {
          try {
            await kirimEmailPengumuman(r.email, r.nama, { hasil, jurusan: namaJurusan.get(pilihan.get(r.p.id) ?? ""), alasan: alasan || undefined, catatan: catatan || undefined }, url);
            berhasil++;
          } catch (err) {
            console.error("[email] gagal mengirim pengumuman ke", r.email, err);
            gagal.push(r.nama);
          }
        }
      }),
    );
    infoEmail = ` Email pengumuman terkirim ke ${berhasil} pendaftar${smtpAktif() ? "" : " (SMTP belum diatur: isinya hanya dicetak ke log server)"}.`;
    if (gagal.length) infoEmail += ` Gagal dikirim ke ${gagal.length} pendaftar: ${gagal.slice(0, 5).join(", ")}${gagal.length > 5 ? ", dan lainnya" : ""}. Hasilnya tetap terlihat di akun mereka.`;
  }
  return {
    ok: true,
    message: `${layak.length} pendaftar berhasil ${lanjut ? `dimajukan ke ${TAHAP_LABEL[lanjut.ke]}` : "diumumkan"} dan sudah terlihat oleh pendaftar.${dilewati ? ` ${dilewati} dilewati karena statusnya sudah berubah.` : ""}${infoEmail}`,
  };
}
