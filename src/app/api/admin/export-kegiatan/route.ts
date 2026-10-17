import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { ambilKegiatan, rekapKegiatan } from "@/lib/kegiatan";

/** Sel teks biasa: awalan = + - @ diberi tanda petik agar tidak dieksekusi sebagai rumus. */
const sel = (v: unknown): string | number => {
  const s = v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
};

/** Ekspor Excel rekap kehadiran satu kegiatan (?id=). */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Tidak diizinkan", { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const k = await ambilKegiatan(id);
  if (!k) return new Response("Kegiatan tidak ditemukan", { status: 404 });
  const rekap = await rekapKegiatan(id);

  const wib = (d: Date) => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Kehadiran");
  ws.addRow([sel(k.nama)]).font = { bold: true, size: 13 };
  ws.addRow([`${wib(k.mulai)} s.d. ${wib(k.selesai)} WIB${k.lokasi ? ` · ${k.lokasi}` : ""}`]);
  ws.addRow([]);
  const kepala = ws.addRow(["No", "Nama", "NIM", "Kelas", "Jurusan", "Waktu Hadir (WIB)"]);
  kepala.font = { bold: true };
  rekap.forEach((r, i) => ws.addRow([i + 1, sel(r.nama), sel(r.nim), sel(r.kelas), sel(r.jurusan), wib(r.waktu)]));
  [6, 32, 18, 12, 30, 20].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  ws.views = [{ state: "frozen", ySplit: 4 }];

  const buf = await wb.xlsx.writeBuffer();
  const nama = k.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "kegiatan";
  return new Response(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="kehadiran-${nama}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
