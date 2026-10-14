"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pendaftaran, riwayatStatus } from "@/db/schema";
import { requirePendaftar } from "@/lib/auth";
import { MAX_UMUR } from "@/lib/constants";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { belumDikirim, catatPerubahanPendaftar, cekKelengkapan, muatLengkap, pendaftaranSaya } from "@/lib/pendaftaran";
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
  return { user, p, sudahDikirim: !belumDikirim(p.status) };
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
  const hasil = await simpanDataDiriCore(draft.p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Diri");
  // Umur > 21 tetap disimpan (agar tidak kehilangan isian) tetapi pengiriman akan diblokir & diperingatkan.
  if ((hasil.umur ?? 0) > MAX_UMUR) redirect(`/formulir/data-diri?peringatan=umur`);
  lanjut(draft, "/formulir/keluarga");
}

export async function simpanKeluarga(_: FormState, fd: FormData): Promise<FormState> {
  const draft = await ambilDraft();
  const hasil = await simpanKeluargaCore(draft.p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Keluarga");
  lanjut(draft, "/formulir/ekonomi");
}

export async function simpanEkonomi(_: FormState, fd: FormData): Promise<FormState> {
  const draft = await ambilDraft();
  const hasil = await simpanEkonomiCore(draft.p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Ekonomi Orang Tua");
  lanjut(draft, "/formulir/sekolah");
}

export async function simpanSekolah(_: FormState, fd: FormData): Promise<FormState> {
  const draft = await ambilDraft();
  // Setelah dikirim, pilihan jurusan hanya bisa diubah admin: isian jurusan dari pendaftar diabaikan.
  const hasil = await simpanSekolahCore(draft.p.id, nilaiForm(fd), draft.sudahDikirim ? "tidak" : "pendaftar");
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Sekolah");
  lanjut(draft, "/formulir/rekomendasi");
}

export async function simpanRekomendasi(_: FormState, fd: FormData): Promise<FormState> {
  const draft = await ambilDraft();
  const hasil = await simpanRekomendasiCore(draft.p.id, nilaiForm(fd));
  if (hasil.galat) return hasil.galat;
  await sentuh(draft, "Data Rekomendasi");
  lanjut(draft, "/formulir/berkas");
}

export async function kirimPendaftaran(_: FormState, fd: FormData): Promise<FormState> {
  const { user, p, sudahDikirim } = await ambilDraft();
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
      .set({ status: "terkirim", tahap: "administrasi", hasil: null, jurusanDiterimaId: null, alasanDitolak: null, submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(pendaftaran.id, p.id));
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
