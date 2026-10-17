import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { daftarBelumMelapor, daftarPelaporan } from "@/lib/pelaporan-akademik";

/** Sel teks biasa: awalan = + - @ diberi tanda petik agar tidak dieksekusi sebagai rumus. */
const sel = (v: unknown): string | number => {
  if (typeof v === "number") return v;
  const s = v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
};

/** Ekspor Excel pelaporan IPK: ?tab=belum untuk yang belum melapor; selain itu laporan yang masuk. Mengikuti filter aktif. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Tidak diizinkan", { status: 403 });
  const f = Object.fromEntries(new URL(req.url).searchParams);
  const belum = f.tab === "belum";

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(belum ? "Belum Melapor" : "Laporan IPK");
  if (belum) {
    const { rows, semester } = await daftarBelumMelapor(f, true);
    ws.columns = [
      { header: "No", width: 6 },
      { header: "Nama", width: 32 },
      { header: "NIM", width: 18 },
      { header: "Kelas", width: 12 },
      { header: "Jurusan", width: 30 },
      { header: "Angkatan", width: 11 },
      { header: "No. HP/WA", width: 16 },
      { header: "Email", width: 30 },
      { header: `Semester ${semester}`, width: 22 },
    ];
    rows.forEach((r, i) => ws.addRow([i + 1, sel(r.nama), sel(r.nim), sel(r.kelas), sel(r.jurusan), r.angkatan, sel(r.kontak), sel(r.email), "Belum melapor"]));
  } else {
    const { rows } = await daftarPelaporan(f, true);
    ws.columns = [
      { header: "No", width: 6 },
      { header: "Nama", width: 32 },
      { header: "NIM", width: 18 },
      { header: "Kelas", width: 12 },
      { header: "Jurusan", width: 30 },
      { header: "Angkatan", width: 11 },
      { header: "Semester", width: 10 },
      { header: "IPK", width: 8 },
      { header: "Dilaporkan (WIB)", width: 20 },
    ];
    rows.forEach((r, i) =>
      ws.addRow([
        i + 1,
        sel(r.nama),
        sel(r.nim),
        sel(r.kelas),
        sel(r.jurusan),
        r.angkatan,
        r.semester,
        Number(r.ipk),
        new Date(r.diperbarui.getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " "),
      ]),
    );
    ws.getColumn(8).numFmt = "0.00";
  }
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  const tgl = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${belum ? "belum-melapor-ipk" : "laporan-ipk"}-${tgl}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
