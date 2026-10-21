import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cariSekolah } from "@/lib/sekolah";

/** Pencarian master sekolah untuk isian Data Sekolah (pendaftar dan admin). */
export async function GET(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json([], { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json(await cariSekolah(q));
}
