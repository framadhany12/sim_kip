import { AlignmentType, BorderStyle, Document, ImageRun, Packer, PageOrientation, Paragraph, Table, TableCell, TableRow, TextRun, VerticalAlign, WidthType } from "docx";
import ExcelJS from "exceljs";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import { daftarBukuTabungan } from "@/lib/buku-tabungan";
import { bacaBerkas } from "@/lib/storage";

export const runtime = "nodejs";

type Baris = Awaited<ReturnType<typeof daftarBukuTabungan>>["rows"][number];
type Gambar = { data: Buffer; width: number; height: number } | { catatan: string };

/** Sel teks biasa: awalan = + - @ diberi tanda petik agar tidak dieksekusi sebagai rumus. */
const sel = (v: unknown): string | number => {
  if (typeof v === "number") return v;
  const s = v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
};

const wib = (d: Date | null) => (d ? new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ") : "-");

/** Foto diputar sesuai EXIF (foto HP sering miring) dan dikecilkan agar berkas ekspor tidak membengkak. PDF tidak bisa ditempel. */
async function siapkanGambar(r: Baris): Promise<Gambar> {
  if (r.mimeType === "application/pdf")
    return {
      catatan: "Berkas PDF. Buka lewat menu Buku Tabungan di aplikasi.",
    };
  try {
    const asli = await bacaBerkas(r.fileUrl!);
    const { data, info } = await sharp(asli)
      .rotate()
      .resize({
        width: 1000,
        height: 1000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    return { catatan: "Berkas tidak ditemukan di penyimpanan." };
  }
}

/** Skala ke kotak maksimal (px) dengan rasio tetap. */
function muat(g: { width: number; height: number }, maxW: number, maxH: number) {
  const k = Math.min(maxW / g.width, maxH / g.height, 1);
  return { width: Math.round(g.width * k), height: Math.round(g.height * k) };
}

async function excel(rows: Baris[], gambar: Gambar[]) {
  const KOTAK = { w: 260, h: 180 };
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Buku Tabungan");
  ws.columns = [
    { header: "No", width: 6 },
    { header: "Nama", width: 30 },
    { header: "NIM", width: 16 },
    { header: "Kelas", width: 10 },
    { header: "Jurusan", width: 28 },
    { header: "Angkatan", width: 10 },
    { header: "No. Rekening KIP-K", width: 22 },
    { header: "Dikirim (WIB)", width: 18 },
    { header: "Buku Tabungan", width: Math.ceil(KOTAK.w / 7) + 2 },
  ];
  rows.forEach((r, i) => {
    const g = gambar[i];
    const row = ws.addRow([i + 1, sel(r.nama), sel(r.nim), sel(r.kelas), sel(r.jurusan), r.angkatan, sel(r.noRekening), wib(r.dikirim), "catatan" in g ? g.catatan : ""]);
    row.alignment = { vertical: "top", wrapText: true };
    // No. rek sebagai teks agar angka panjang tidak jadi notasi ilmiah.
    row.getCell(7).numFmt = "@";
    if ("data" in g) {
      const ukuran = muat(g, KOTAK.w, KOTAK.h);
      row.height = (ukuran.height + 8) * 0.75;
      const id = wb.addImage({
        buffer: g.data as unknown as ExcelJS.Buffer,
        extension: "jpeg",
      });
      ws.addImage(id, {
        tl: { col: 8.05, row: row.number - 1 + 0.05 },
        ext: ukuran,
        editAs: "oneCell",
      });
    }
  });
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function word(rows: Baris[], gambar: Gambar[]) {
  const garis = { style: BorderStyle.SINGLE, size: 4, color: "BFC7D5" };
  const tepi = { top: garis, bottom: garis, left: garis, right: garis };
  const kotak = (isi: Paragraph[], lebar: number, opsi: Partial<ConstructorParameters<typeof TableCell>[0]> = {}) =>
    new TableCell({
      children: isi,
      width: { size: lebar, type: WidthType.PERCENTAGE },
      borders: tepi,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      verticalAlign: VerticalAlign.TOP,
      ...opsi,
    });
  const teks = (s: string, tebal = false) =>
    new Paragraph({
      children: [new TextRun({ text: s, bold: tebal, size: 20 })],
    });
  const kepala = (s: string, lebar: number) => kotak([teks(s, true)], lebar, { shading: { fill: "EEF2F8" } });

  const baris = rows.map((r, i) => {
    const g = gambar[i];
    const data = [
      new Paragraph({
        children: [new TextRun({ text: r.nama, bold: true, size: 22 })],
      }),
      teks(`NIM: ${r.nim ?? "-"} · Kelas: ${r.kelas ?? "-"}`),
      teks(`${r.jurusan ?? "-"} · Angkatan ${r.angkatan}`),
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: "No. Rekening KIP-K",
            size: 18,
            color: "5B6577",
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: r.noRekening ?? "-",
            bold: true,
            size: 24,
            font: "Consolas",
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: `Dikirim ${wib(r.dikirim)} WIB`,
            size: 18,
            color: "5B6577",
          }),
        ],
      }),
    ];
    const foto =
      "data" in g
        ? new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: "jpg",
                data: g.data,
                transformation: muat(g, 420, 300),
              }),
            ],
          })
        : new Paragraph({
            children: [
              new TextRun({
                text: g.catatan,
                italics: true,
                size: 20,
                color: "5B6577",
              }),
            ],
          });
    return new TableRow({
      cantSplit: true,
      children: [kotak([teks(String(i + 1))], 5), kotak(data, 38), kotak([foto], 57)],
    });
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Buku Tabungan KIP Kuliah",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Politeknik TEDC Bandung · ${rows.length} mahasiswa · diekspor ${wib(new Date())} WIB`,
                size: 20,
                color: "5B6577",
              }),
            ],
          }),
          rows.length
            ? new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    tableHeader: true,
                    children: [kepala("No", 5), kepala("Mahasiswa", 38), kepala("Buku tabungan", 57)],
                  }),
                  ...baris,
                ],
              })
            : teks("Tidak ada data yang cocok dengan filter."),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

/** Ekspor buku tabungan yang sudah dikirim, lengkap dengan fotonya. ?format=docx untuk Word, selain itu Excel. Mengikuti filter aktif. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Tidak diizinkan", { status: 403 });
  const f = Object.fromEntries(new URL(req.url).searchParams);
  const docx = f.format === "docx";

  const { rows } = await daftarBukuTabungan("sudah", f, true);
  const gambar: Gambar[] = [];
  for (const r of rows) gambar.push(await siapkanGambar(r));

  const buf = docx ? await word(rows, gambar) : await excel(rows, gambar);
  const tgl = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": docx ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="buku-tabungan-${tgl}.${docx ? "docx" : "xlsx"}"`,
      "Cache-Control": "no-store",
    },
  });
}
