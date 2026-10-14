"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { pertanyaan } from "@/db/schema";
import { requirePendaftar } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";

export async function kirimPertanyaan(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePendaftar();
  const isi = String(fd.get("isi") ?? "").trim();
  if (isi.length < 10) return { errors: { isi: "Tulis pertanyaan minimal 10 karakter agar admin bisa memahami." }, values: { isi } };
  if (isi.length > 2000) return { errors: { isi: "Pertanyaan maksimal 2000 karakter." }, values: { isi } };
  const db = await getDb();
  await db.insert(pertanyaan).values({ userId: user.id, isi });
  revalidatePath("/bantuan");
  revalidatePath("/admin/pertanyaan");
  return { ok: true, message: "Pertanyaan terkirim. Jawaban admin akan muncul di halaman ini." };
}
