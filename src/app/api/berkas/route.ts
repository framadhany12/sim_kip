import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { berkas, ekonomiOrangtua, JENIS_BERKAS, pendaftaran, type JenisBerkas } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { MAX_FILE_MB } from "@/lib/constants";
import { bisaDiedit, pendaftaranSaya } from "@/lib/pendaftaran";
import { deteksiTipe, hapusBerkas, simpanBerkas } from "@/lib/storage";

const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

async function konteks(jenisRaw: unknown) {
  const user = await getCurrentUser();
  if (!user || user.role !== "pendaftar") return { error: err("Silakan masuk terlebih dahulu.", 401) };
  const jenis = String(jenisRaw ?? "") as JenisBerkas;
  if (!JENIS_BERKAS.includes(jenis)) return { error: err("Jenis berkas tidak dikenal.") };
  const p = await pendaftaranSaya(user.id);
  if (!bisaDiedit(p.status)) return { error: err("Pendaftaran sudah dikirim; berkas tidak dapat diubah.", 403) };
  return { p, jenis };
}

export async function POST(req: Request) {
  const fd = await req.formData();
  const k = await konteks(fd.get("jenis"));
  if ("error" in k) return k.error;
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return err("Pilih berkas yang akan diunggah.");
  if (file.size > MAX_FILE_MB * 1024 * 1024) return err(`Ukuran berkas maksimal ${MAX_FILE_MB} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const tipe = deteksiTipe(buf);
  if (!tipe) return err("Format berkas harus PDF, JPG, atau PNG.");

  const db = await getDb();
  const [lama] = await db.select().from(berkas).where(and(eq(berkas.pendaftaranId, k.p.id), eq(berkas.jenis, k.jenis)));
  const rel = `${k.p.id}/${k.jenis}-${Date.now()}.${tipe.ext}`;
  await simpanBerkas(rel, buf);
  const data = {
    fileUrl: rel,
    namaAsli: file.name.slice(0, 200),
    mimeType: tipe.mime,
    ukuran: file.size,
    statusVerifikasi: "menunggu" as const,
    uploadedAt: new Date(),
  };
  await db
    .insert(berkas)
    .values({ pendaftaranId: k.p.id, jenis: k.jenis, ...data })
    .onDuplicateKeyUpdate({ set: data });
  const [row] = await db.select({ id: berkas.id }).from(berkas).where(and(eq(berkas.pendaftaranId, k.p.id), eq(berkas.jenis, k.jenis)));
  if (lama) await hapusBerkas(lama.fileUrl);
  if (k.jenis === "surat_ekonomi")
    await db.update(ekonomiOrangtua).set({ suratKebutuhanEkonomiUrl: `/api/berkas/${row.id}` }).where(eq(ekonomiOrangtua.pendaftaranId, k.p.id));
  await db.update(pendaftaran).set({ updatedAt: new Date() }).where(eq(pendaftaran.id, k.p.id));
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, id: row.id });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const k = await konteks(url.searchParams.get("jenis"));
  if ("error" in k) return k.error;
  const db = await getDb();
  const where = and(eq(berkas.pendaftaranId, k.p.id), eq(berkas.jenis, k.jenis));
  const [row] = await db.select({ fileUrl: berkas.fileUrl }).from(berkas).where(where);
  await db.delete(berkas).where(where);
  if (row) await hapusBerkas(row.fileUrl);
  if (k.jenis === "surat_ekonomi")
    await db.update(ekonomiOrangtua).set({ suratKebutuhanEkonomiUrl: null }).where(eq(ekonomiOrangtua.pendaftaranId, k.p.id));
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
