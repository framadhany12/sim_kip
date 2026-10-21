"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { jurusan, pendaftaran } from "@/db/schema";
import { requirePendaftar } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { BAGIAN_LENGKAPI, cekLengkapMahasiswaLama, type SlugLengkapi } from "@/lib/mahasiswa-lama";
import { cariPendaftaranUser, muatLengkap, sudahMahasiswa } from "@/lib/pendaftaran";
import { simpanAkademikCore, simpanDataDiriCore, simpanEkonomiCore, simpanKeluargaCore, simpanSekolahCore } from "@/lib/simpan-pendaftaran";

/** Simpan satu bagian Lengkapi Data, lalu lanjut ke bagian berikutnya yang belum lengkap. */
export async function simpanBagianLengkapi(bagian: SlugLengkapi, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePendaftar();
  if (!user.mahasiswaLama || user.wajibGantiSandi) return { message: "Halaman ini hanya untuk mahasiswa lama yang sudah mengganti sandi awal." };
  const p = await cariPendaftaranUser(user.id);
  if (!p || !sudahMahasiswa(p)) return { message: "Data mahasiswa tidak ditemukan. Hubungi admin." };
  const v = nilaiForm(fd);
  const db = await getDb();

  if (bagian === "data-diri") {
    const h = await simpanDataDiriCore(p.id, v);
    if (h.galat) return h.galat;
  } else if (bagian === "keluarga") {
    const h = await simpanKeluargaCore(p.id, v);
    if (h.galat) return h.galat;
  } else if (bagian === "ekonomi") {
    const h = await simpanEkonomiCore(p.id, v);
    if (h.galat) return h.galat;
  } else if (bagian === "sekolah") {
    const [j] = v.jurusanId ? await db.select({ id: jurusan.id }).from(jurusan).where(and(eq(jurusan.id, v.jurusanId), eq(jurusan.aktif, true))) : [];
    // Pilihan jurusan pendaftaran tidak berlaku; jurusan yang ditempuh disimpan langsung sebagai jurusan diterima.
    const h = await simpanSekolahCore(p.id, v, "tidak");
    if (h.galat || !j) return { errors: { ...h.galat?.errors, ...(j ? {} : { jurusanId: "Pilih jurusan yang sedang Anda tempuh." }) }, values: v };
    await db.update(pendaftaran).set({ jurusanDiterimaId: j.id }).where(eq(pendaftaran.id, p.id));
  } else if (bagian === "akademik") {
    if (p.nim && p.kelas) return { message: "NIM dan kelas sudah tersimpan. Hubungi admin bila ada yang salah." };
    if (!v.nim || !v.kelas) return { errors: { ...(v.nim ? {} : { nim: "Isi NIM Anda." }), ...(v.kelas ? {} : { kelas: "Isi kelas Anda." }) }, values: v };
    const h = await simpanAkademikCore(p.id, v);
    if (h.galat) return h.galat;
  } else return { message: "Bagian tidak dikenal." };

  await db.update(pendaftaran).set({ updatedAt: new Date() }).where(eq(pendaftaran.id, p.id));
  revalidatePath("/", "layout");
  const d = await muatLengkap(p.id);
  const { berikutnya } = cekLengkapMahasiswaLama(d!);
  if (!berikutnya) redirect("/mahasiswa?lengkap=1");
  // Bagian sesudah yang baru disimpan lebih dulu, supaya urutan pengisian tidak melompat ke belakang.
  const urutan = BAGIAN_LENGKAPI.map((b) => b.slug);
  const sesudah = urutan.slice(urutan.indexOf(bagian) + 1).find((s) => !cekLengkapMahasiswaLama(d!).selesai[s]);
  redirect(`/lengkapi-data/${sesudah ?? berikutnya}`);
}
