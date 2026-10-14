import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { wilayahKecamatan } from "@/db/schema";

export async function GET(req: Request) {
  const kab = new URL(req.url).searchParams.get("kab");
  if (!kab) return NextResponse.json([]);
  const db = await getDb();
  const rows = await db
    .select({ id: wilayahKecamatan.id, nama: wilayahKecamatan.nama })
    .from(wilayahKecamatan)
    .where(eq(wilayahKecamatan.kabupatenId, kab))
    .orderBy(asc(wilayahKecamatan.nama));
  return NextResponse.json(rows, { headers: { "Cache-Control": "public, max-age=86400" } });
}
