import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { STATUS_MAHASISWA, type StatusMahasiswa } from "@/db/schema";

type Baris = Record<string, unknown>;
export type JumlahStatus = Record<StatusMahasiswa, number> & { total: number };
export type BarisKelompok = JumlahStatus & { label: string; rataIpk: number | null; melapor: number };

const kosong = (): JumlahStatus => ({ aktif: 0, dicabut: 0, tidak_aktif: 0, lulus: 0, total: 0 });

/**
 * Ringkasan mahasiswa KIP-K (pendaftar dengan status & hasil Diterima, termasuk mahasiswa lama hasil impor):
 * jumlah per status mahasiswa, per angkatan, per program studi, serta rata-rata IPK.
 * IPK tiap mahasiswa = IPK pada semester terakhir yang ia laporkan (sama dengan grafik IPK).
 */
export async function ambilStatistikMahasiswa() {
  const db = await getDb();
  const dasar = sql`
    select p.status_mahasiswa status,
      coalesce(p.angkatan, year(date_add(u.created_at, interval 7 hour))) angkatan,
      coalesce(j.nama, 'Tanpa jurusan') jurusan,
      p.nim is not null nim_ada,
      (select l.ipk from laporan_akademik l where l.pendaftaran_id = p.id order by l.semester desc limit 1) ipk
    from pendaftaran p
    join users u on u.id = p.user_id
    left join jurusan j on j.id = p.jurusan_diterima_id
    where p.status = 'diterima' and p.hasil = 'diterima'`;
  const jalankan = async (q: ReturnType<typeof sql>) => ((await db.execute(q)) as unknown as [Baris[]])[0];
  const kelompok = (kolom: string) =>
    jalankan(
      sql`select ${sql.raw(kolom)} label, status, count(*) n, count(ipk) melapor, sum(ipk) jumlah_ipk, sum(nim_ada) nim from (${dasar}) t group by ${sql.raw(kolom)}, status`,
    );
  const [perAngkatan, perJurusan] = await Promise.all([kelompok("angkatan"), kelompok("jurusan")]);

  const susun = (rows: Baris[]) => {
    const peta = new Map<string, BarisKelompok & { jumlahIpk: number }>();
    for (const r of rows) {
      const label = String(r.label);
      const b = peta.get(label) ?? { ...kosong(), label, rataIpk: null, melapor: 0, jumlahIpk: 0 };
      const status = STATUS_MAHASISWA.find((s) => s === r.status) ?? "aktif";
      b[status] += Number(r.n);
      b.total += Number(r.n);
      b.melapor += Number(r.melapor);
      b.jumlahIpk += Number(r.jumlah_ipk ?? 0);
      peta.set(label, b);
    }
    return [...peta.values()].map(({ jumlahIpk, ...b }) => ({ ...b, rataIpk: b.melapor ? Math.round((jumlahIpk / b.melapor) * 100) / 100 : null }));
  };

  const angkatan = susun(perAngkatan).sort((a, b) => Number(a.label) - Number(b.label));
  const jurusan = susun(perJurusan).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  const total = kosong();
  let melapor = 0;
  let jumlahIpk = 0;
  let nimTerisi = 0;
  for (const r of perAngkatan) {
    const status = STATUS_MAHASISWA.find((s) => s === r.status) ?? "aktif";
    total[status] += Number(r.n);
    total.total += Number(r.n);
    melapor += Number(r.melapor);
    jumlahIpk += Number(r.jumlah_ipk ?? 0);
    nimTerisi += Number(r.nim ?? 0);
  }
  return {
    total,
    rataIpk: melapor ? Math.round((jumlahIpk / melapor) * 100) / 100 : null,
    melapor,
    nimTerisi,
    angkatan,
    jurusan,
  };
}
