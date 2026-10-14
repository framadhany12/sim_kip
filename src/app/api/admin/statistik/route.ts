import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ambilStatistik } from "@/lib/statistik";
import { parseTahun } from "@/lib/tahun";

/** Data dashboard admin; dipanggil berkala oleh dashboard untuk pembaruan otomatis. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const p = new URL(req.url).searchParams;
  const hari = [7, 14, 30, 90].includes(Number(p.get("hari"))) ? Number(p.get("hari")) : 30;
  const data = await ambilStatistik({ tahun: parseTahun(p.get("tahun")), hari }); // "semua"/kosong = semua tahun
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
