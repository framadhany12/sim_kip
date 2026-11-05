"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dataDiri, pendaftaran, riwayatStatus, users } from "@/db/schema";
import { requirePendaftar } from "@/lib/auth";
import { ALASAN_DESIL, ALASAN_MENIKAH, ALASAN_TIDAK_BERSEDIA, DESIL_TIDAK_SESUAI, MAX_UMUR, PESAN_DESIL, PESAN_MENIKAH } from "@/lib/constants";
import { kirimEmailPengumuman, urlAplikasi } from "@/lib/mail";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { belumDikirim, catatPerubahanPendaftar, cekKelengkapan, muatLengkap, PESAN_TERKUNCI, pendaftaranSaya, terkunci } from "@/lib/pendaftaran";
import {
  simpanDataDiriCore,
  simpanEkonomiCore,
  simpanKeluargaCore,
  simpanRekomendasiCore,
  simpanSekolahCore,
} from "@/lib/simpan-pendaftaran";

async function ambilDraft() {
  const user = await requirePendaftar();
  const p = await pendaftaranSaya(user.id);
  return { user, p, sudahDikirim: !belumDikirim(p.status), terkunci: terkunci(p) };
}

type Draft = Awaited<ReturnType<typeof ambilDraft>>;

/** Tandai waktu perubahan; bila pendaftaran sudah dikirim, catat juga di riwayat agar admin tahu. */
async function sentuh({ p, user }: Draft, bagian: string) {
  const db = await getDb();
  await db.update(pendaftaran).set({ updatedAt: new Date() }).where(eq(pendaftaran.id, p.id));
  await catatPerubahanPendaftar(p, user.id, bagian);
  revalidatePath("/", "layout");
}

/** Setelah dikirim, simpan cukup kembali ke Ringkasan; sebelum dikirim, lanjut ke langkah berikutnya. */
const lanjut = (draft: Draft, berikutnya: string) => redirect(draft.sudahDikirim ? "/formulir/ringkasan?diperbarui=1" : berikutnya);

export async function simpanDataDiri(_: FormState, fd: FormData): Promise<FormState> {
  const draft = await ambilDraft();
  if (draft.terkunci) return { message: PESAN_TERKUNCI };
  const v = nilaiForm(fd);
  // Desil & status PIP yang sudah dikirim hanya bisa diubah admin: nilai dari form diganti dengan yang tersimpan.
  if (draft.p.submittedAt) {
    const db = await getDb();
    const [lama] = await db.select({ desil: dataDiri.desil, penerimaPip: dataDiri.penerimaPip }).from(dataDiri).where(eq(dataDiri.pendaftaranId, draft.p.id));
    if (lama?.desil && lama.penerimaPip != null) {
      v.desil = lama.desil;
      v.penerimaPip = lama.penerimaPip ? "ya" : "tidak";
    }
  }
  const hasil = await simpanDataDiriCore(draft.p.id, v);
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Diri");
  // Umur > 21 tetap disimpan (agar tidak kehilangan isian) tetapi pengiriman akan diblokir & diperingatkan.
  if ((hasil.umur ?? 0) > MAX_UMUR) redirect(`/formulir/data-diri?peringatan=umur`);
  lanjut(draft, "/formulir/keluarga");
}

export async function simpanKeluarga(_: FormState, fd: FormData): Promise<FormState> {
  const draft = await ambilDraft();
  if (draft.terkunci) return { message: PESAN_TERKUNCI };
  const hasil = await simpanKeluargaCore(draft.p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Keluarga");
  lanjut(draft, "/formulir/ekonomi");
}

export async function simpanEkonomi(_: FormState, fd: FormData): Promise<FormState> {
  const draft = await ambilDraft();
  if (draft.terkunci) return { message: PESAN_TERKUNCI };
  const hasil = await simpanEkonomiCore(draft.p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Ekonomi Orang Tua");
  lanjut(draft, "/formulir/sekolah");
}

export async function simpanSekolah(_: FormState, fd: FormData): Promise<FormState> {
  const draft = await ambilDraft();
  if (draft.terkunci) return { message: PESAN_TERKUNCI };
  // Setelah dikirim, pilihan jurusan hanya bisa diubah admin: isian jurusan dari pendaftar diabaikan.
  const hasil = await simpanSekolahCore(draft.p.id, nilaiForm(fd), draft.sudahDikirim ? "tidak" : "pendaftar");
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Sekolah");
  lanjut(draft, "/formulir/rekomendasi");
}

export async function simpanRekomendasi(_: FormState, fd: FormData): Promise<FormState> {
  const draft = await ambilDraft();
  if (draft.terkunci) return { message: PESAN_TERKUNCI };
  const hasil = await simpanRekomendasiCore(draft.p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Rekomendasi");
  lanjut(draft, "/formulir/berkas");
}

export async function kirimPendaftaran(_: FormState, fd: FormData): Promise<FormState> {
  const { user, p, sudahDikirim, terkunci: kunci } = await ambilDraft();
  if (kunci) return { message: PESAN_TERKUNCI };
  if (sudahDikirim) return { message: "Pendaftaran sudah dikirim. Perubahan data tersimpan otomatis saat Anda menekan Simpan di tiap bagian." };
  if (fd.get("setuju") !== "on") return { errors: { setuju: "Centang pernyataan ini sebelum mengirim." } };
  const lengkap = await muatLengkap(p.id);
  const cek = cekKelengkapan(lengkap!);
  if (!cek.siapKirim) return { message: "Pendaftaran belum bisa dikirim: " + cek.masalah.join(" ") };
  const db = await getDb();
  const kirimUlang = p.status === "perbaikan";
  await db.transaction(async (tx) => {
    // Setelah dikirim, pendaftar otomatis masuk tahap pertama: Seleksi Administrasi.
    await tx
      .update(pendaftaran)
      .set({ status: "terkirim", tahap: "administrasi", hasil: null, jurusanDiterimaId: null, jenisBeasiswaId: null, wawancaraSelesai: false, usulan: null, alasanTidakBersedia: null, alasanDitolak: null, submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(pendaftaran.id, p.id));
    await tx.insert(riwayatStatus).values({
      pendaftaranId: p.id,
      status: "terkirim",
      catatan: kirimUlang ? "Pendaftaran dikirim ulang setelah perbaikan" : "Pendaftaran dikirim oleh pendaftar",
      diubahOleh: user.id,
    });
  });
  // Desil 5 atau 6-10 tanpa PIP tidak memenuhi ketentuan: langsung diumumkan tidak lolos Seleksi Administrasi.
  const desil = lengkap!.diri?.desil;
  const desilTidakSesuai = !!desil && DESIL_TIDAK_SESUAI.includes(desil) && lengkap!.diri?.penerimaPip === false;
  // Status menikah juga otomatis tidak lolos Seleksi Administrasi; aturan desil di atas tetap didahulukan.
  const menikah = lengkap!.diri?.statusPernikahan === "menikah";
  if (desilTidakSesuai || menikah) {
    const alasan = desilTidakSesuai ? ALASAN_DESIL : ALASAN_MENIKAH;
    const pesan = desilTidakSesuai ? PESAN_DESIL : PESAN_MENIKAH;
    await db.transaction(async (tx) => {
      await tx
        .update(pendaftaran)
        .set({ status: "ditolak", tahap: "administrasi", hasil: "ditolak", alasanDitolak: alasan, catatanAdmin: pesan, updatedAt: new Date() })
        .where(eq(pendaftaran.id, p.id));
      await tx.insert(riwayatStatus).values({
        pendaftaranId: p.id,
        status: "tidak_lolos:administrasi",
        catatan: `Tidak lolos Seleksi Administrasi (otomatis). Alasan: ${alasan}.
${pesan}`,
        diubahOleh: user.id,
      });
    });
    try {
      const [akun] = await db.select({ email: users.email, nama: users.nama }).from(users).where(eq(users.id, user.id));
      await kirimEmailPengumuman(akun.email, lengkap!.diri?.namaLengkap ?? akun.nama, { hasil: "administrasi", alasan, catatan: pesan }, `${await urlAplikasi()}/status`);
    } catch (err) {
      console.error("[email] gagal mengirim pengumuman otomatis tidak lolos administrasi:", err);
    }
    revalidatePath("/", "layout");
    redirect("/status");
  }
  revalidatePath("/", "layout");
  redirect("/status?terkirim=1");
}

/** Jawaban pendaftar di tahap Pengusulan: bersedia diusulkan (jadi "Diusulkan") atau tidak (langsung ditolak). Hanya bisa sekali. */
export async function jawabPengusulan(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePendaftar();
  const p = await pendaftaranSaya(user.id);
  const v = nilaiForm(fd);
  const menunggu = p.tahap === "pengusulan" && p.usulan === "menunggu" && (p.status === "terkirim" || p.status === "diperiksa");
  if (!menunggu) return { message: "Pertanyaan ini tidak (lagi) berlaku untuk pendaftaran Anda. Muat ulang halaman." };
  if (v.jawaban !== "bersedia" && v.jawaban !== "tidak") return { errors: { jawaban: "Pilih salah satu jawaban." }, values: v };
  if (v.jawaban === "tidak" && (v.alasan.length < 5 || v.alasan.length > 500)) return { errors: { alasan: "Tulis alasan Anda, 5–500 karakter." }, values: v };

  const db = await getDb();
  const bersedia = v.jawaban === "bersedia";
  await db.transaction(async (tx) => {
    // Syarat usulan = "menunggu" di WHERE mencegah jawaban ganda bila dikirim dua kali bersamaan.
    const [hasil] = await tx
      .update(pendaftaran)
      .set(
        bersedia
          ? { usulan: "bersedia", updatedAt: new Date() }
          : { usulan: "tidak", status: "ditolak", hasil: "ditolak", alasanDitolak: ALASAN_TIDAK_BERSEDIA, alasanTidakBersedia: v.alasan, updatedAt: new Date() },
      )
      .where(and(eq(pendaftaran.id, p.id), eq(pendaftaran.usulan, "menunggu")));
    if (hasil.affectedRows === 0) return;
    await tx.insert(riwayatStatus).values({
      pendaftaranId: p.id,
      status: bersedia ? "diusulkan" : "tidak_diusulkan",
      catatan: bersedia ? "Pendaftar bersedia diusulkan. Status: Diusulkan, menunggu pengumuman." : `Pendaftar tidak bersedia diusulkan. Alasan: ${v.alasan}`,
      diubahOleh: user.id,
    });
  });
  revalidatePath("/", "layout");
  redirect("/status");
}
