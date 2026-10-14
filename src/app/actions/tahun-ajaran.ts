"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tahunAjaran } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { TAHUN_MAX, TAHUN_MIN, tahunBerjalan } from "@/lib/tahun";
import { jumlahPendaftarPerTahun } from "@/lib/tahun-ajaran";

export async function tambahTahunAjaran(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const v = nilaiForm(fd);
  const tahun = Number(v.tahun);
  if (!/^\d{4}$/.test(v.tahun ?? "") || tahun < TAHUN_MIN || tahun > TAHUN_MAX)
    return { errors: { tahun: `Masukkan tahun 4 digit antara ${TAHUN_MIN} dan ${TAHUN_MAX}.` }, values: v };
  const db = await getDb();
  const [ada] = await db.select().from(tahunAjaran).where(eq(tahunAjaran.tahun, tahun));
  if (ada || tahun === tahunBerjalan()) return { errors: { tahun: "Tahun ini sudah ada di daftar." }, values: v };
  await db.insert(tahunAjaran).values({ tahun });
  revalidatePath("/", "layout");
  return { ok: true, message: `Tahun ${tahun} ditambahkan dan muncul di semua filter Tahun daftar.` };
}

export async function hapusTahunAjaran(fd: FormData) {
  await requireAdmin();
  const tahun = Number(fd.get("tahun"));
  if (!Number.isInteger(tahun) || tahun === tahunBerjalan()) return; // tahun berjalan selalu tersedia
  if ((await jumlahPendaftarPerTahun()).get(tahun)) return; // tahun yang sudah punya pendaftar tidak boleh disembunyikan
  const db = await getDb();
  await db.delete(tahunAjaran).where(eq(tahunAjaran.tahun, tahun));
  revalidatePath("/", "layout");
}
