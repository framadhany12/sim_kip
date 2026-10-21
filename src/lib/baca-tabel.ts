import "server-only";

/** Sel hasil baca. `angka` = sel Excel bertipe angka (NIK 16 digit di sel angka sudah kehilangan digit terakhirnya). */
export type Sel = { teks: string; angka: boolean };

/** Baca sheet pertama .xlsx atau isi .csv (pemisah `,` atau `;` dikenali dari baris pertama) menjadi baris sel. */
export async function bacaTabel(file: File): Promise<Sel[][]> {
  const buf = Buffer.from(await file.arrayBuffer());
  if (/\.csv$/i.test(file.name)) {
    const baris = buf.toString("utf8").replace(/^﻿/, "").split(/\r?\n/);
    const pertama = baris[0] ?? "";
    const pemisah = (pertama.match(/;/g)?.length ?? 0) > (pertama.match(/,/g)?.length ?? 0) ? ";" : ",";
    return baris.map((l) => l.split(pemisah).map((c) => ({ teks: c.replace(/^"|"$/g, "").trim(), angka: false })));
  }
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const rows: Sel[][] = [];
  wb.worksheets[0]?.eachRow((r) =>
    rows.push(
      (r.values as unknown[]).slice(1).map((v) => ({
        teks: (v == null ? "" : typeof v === "object" && "text" in v ? String(v.text) : String(v)).trim(),
        angka: typeof v === "number",
      })),
    ),
  );
  return rows;
}
