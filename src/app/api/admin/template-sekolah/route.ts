import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";

/** Templat Excel untuk import master sekolah. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Tidak diizinkan", { status: 403 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sekolah");
  ws.columns = [
    { header: "NPSN", key: "npsn", width: 12 },
    { header: "Nama Sekolah", key: "nama", width: 40 },
    { header: "Kabupaten/Kota", key: "kota", width: 24 },
  ];
  ws.getRow(1).font = { bold: true };
  // Kolom NPSN bertipe teks agar angka nol di depan tidak hilang.
  ws.getColumn(1).numFmt = "@";
  ws.addRow({ npsn: "20224021", nama: "SMK Negeri 1 Contoh", kota: "Kota Contoh" });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="templat-master-sekolah.xlsx"',
    },
  });
}
