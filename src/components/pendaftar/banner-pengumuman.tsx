import Link from "next/link";
import { Alert } from "@/components/ui";
import { JENIS_PENGUMUMAN_BT } from "@/lib/buku-tabungan";
import { pengumumanUntukMahasiswa } from "@/lib/pelaporan-akademik";

const tglPendek = (s: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));

/**
 * Pengumuman dari admin untuk mahasiswa. Yang terkait semester hilang sendiri setelah mahasiswa melaporkan IPK semester itu;
 * yang buku tabungan hilang setelah ia mengirim. Pesan pribadi (laporan IPK dihapus admin) ditandai berbeda dari pengumuman umum.
 */
export async function BannerPengumuman({ pendaftaranId }: { pendaftaranId: string }) {
  const daftar = await pengumumanUntukMahasiswa(pendaftaranId);
  if (daftar.length === 0) return null;
  return (
    <div className="space-y-3">
      {daftar.map((p) => (
        <Alert key={p.id} tone={p.pendaftaranId ? "error" : "warning"} title={p.judul}>
          {p.pendaftaranId && <span className="block text-xs font-semibold uppercase tracking-wide opacity-80">Pesan dari admin untuk Anda</span>}
          <span className="whitespace-pre-line">{p.isi}</span>
          {p.tenggat && (
            <span className="mt-1 block text-sm font-semibold">Batas waktu: {tglPendek(p.tenggat)}</span>
          )}
          {p.jenis === JENIS_PENGUMUMAN_BT && (
            <Link href="/mahasiswa/buku-tabungan" className="mt-2 inline-block font-semibold underline">
              Isi Buku Tabungan
            </Link>
          )}
          {p.semester && (
            <Link href="/mahasiswa/ipk" className="mt-2 inline-block font-semibold underline">
              {p.pendaftaranId ? `Kirim ulang laporan Semester ${p.semester}` : `Laporkan IPK Semester ${p.semester} →`}
            </Link>
          )}
        </Alert>
      ))}
    </div>
  );
}
