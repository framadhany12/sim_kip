import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export type TitikIpk = { label: string; rata: number; n: number };
export type StatistikIpk = {
  keseluruhan: { rata: number; n: number } | null;
  angkatan: TitikIpk[];
  jurusan: TitikIpk[];
  /** Jumlah kelompok yang disembunyikan karena anggotanya kurang dari `minimalN` (perlindungan privasi). */
  disembunyikan: number;
  minimalN: number;
};

type Baris = Record<string, unknown>;

/**
 * Rata-rata IPK per angkatan (kolom angkatan, atau tahun akun dibuat WIB) dan per jurusan diterima.
 * Tiap mahasiswa dihitung SEKALI memakai IPK pada semester terakhir yang ia laporkan.
 * `minimalN` > 1 menyembunyikan kelompok kecil agar rata-ratanya tidak membuka IPK individu (dipakai untuk tampilan mahasiswa).
 */
export async function ambilStatistikIpk(minimalN = 1): Promise<StatistikIpk> {
  const db = await getDb();
  const dasar = sql`
    select coalesce(p.angkatan, year(date_add(u.created_at, interval 7 hour))) angkatan, coalesce(j.nama, 'Tanpa jurusan') jurusan, l.ipk ipk
    from pendaftaran p
    join users u on u.id = p.user_id
    join laporan_akademik l on l.pendaftaran_id = p.id
    left join jurusan j on j.id = p.jurusan_diterima_id
    where p.status = 'diterima' and p.hasil = 'diterima'
      and l.semester = (select max(x.semester) from laporan_akademik x where x.pendaftaran_id = p.id)`;
  const jalankan = async (q: ReturnType<typeof sql>) => ((await db.execute(q)) as unknown as [Baris[]])[0];
  const [perAngkatan, perJurusan, [total]] = await Promise.all([
    jalankan(sql`select angkatan label, round(avg(ipk), 2) rata, count(*) n from (${dasar}) t group by angkatan order by angkatan`),
    jalankan(sql`select jurusan label, round(avg(ipk), 2) rata, count(*) n from (${dasar}) t group by jurusan order by rata desc, jurusan`),
    jalankan(sql`select round(avg(ipk), 2) rata, count(*) n from (${dasar}) t`),
  ]);
  const ubah = (r: Baris): TitikIpk => ({ label: String(r.label), rata: Number(r.rata), n: Number(r.n) });
  const angkatanSemua = perAngkatan.map(ubah);
  const jurusanSemua = perJurusan.map(ubah);
  const lolos = (t: TitikIpk) => t.n >= minimalN;
  const n = Number(total?.n ?? 0);
  return {
    // Rata-rata keseluruhan juga baru ditampilkan bila cukup banyak mahasiswa yang melapor.
    keseluruhan: n >= minimalN && n > 0 ? { rata: Number(total.rata), n } : null,
    angkatan: angkatanSemua.filter(lolos),
    jurusan: jurusanSemua.filter(lolos),
    disembunyikan: angkatanSemua.filter((t) => !lolos(t)).length + jurusanSemua.filter((t) => !lolos(t)).length,
    minimalN,
  };
}
