import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { presensiKegiatan } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

/** Jumlah presensi satu kegiatan; dipantau berkala agar rekap admin langsung menyegarkan diri saat ada yang scan. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const { id } = await params;
  const db = await getDb();
  const [r] = await db.select({ n: count() }).from(presensiKegiatan).where(eq(presensiKegiatan.kegiatanId, id));
  return NextResponse.json({ jumlah: Number(r?.n ?? 0) }, { headers: { "Cache-Control": "no-store" } });
}
