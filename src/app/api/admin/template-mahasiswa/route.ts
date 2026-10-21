import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";

/** Templat Excel impor mahasiswa lama. Kolom NIK bertipe teks agar 16 digitnya tidak dibulatkan Excel. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Tidak diizinkan", { status: 403 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Mahasiswa");
  ws.columns = [
    { header: "Nama", key: "nama", width: 32 },
    { header: "NIK", key: "nik", width: 20, style: { numFmt: "@" } },
    { header: "Email", key: "email", width: 30 },
    { header: "Angkatan", key: "angkatan", width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="templat-impor-mahasiswa.xlsx"',
    },
  });
}
