import Link from "next/link";
import { Alert } from "@/components/ui";
import { pengumumanUntukMahasiswa } from "@/lib/pelaporan-akademik";

const tglPendek = (s: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));

/** Pengumuman dari admin untuk mahasiswa. Yang terkait semester hilang sendiri setelah mahasiswa melaporkan IPK semester itu. */
export async function BannerPengumuman({ pendaftaranId }: { pendaftaranId: string }) {
  const daftar = await pengumumanUntukMahasiswa(pendaftaranId);
  if (daftar.length === 0) return null;
  return (
    <div className="space-y-3">
      {daftar.map((p) => (
        <Alert key={p.id} tone="warning" title={p.judul}>
          <span className="whitespace-pre-line">{p.isi}</span>
          {p.tenggat && (
            <span className="mt-1 block text-sm font-semibold">Batas waktu: {tglPendek(p.tenggat)}</span>
          )}
          {p.semester && (
            <Link href="/mahasiswa/ipk" className="mt-2 inline-block font-semibold underline">
              Laporkan IPK Semester {p.semester} →
            </Link>
          )}
        </Alert>
      ))}
    </div>
  );
}
