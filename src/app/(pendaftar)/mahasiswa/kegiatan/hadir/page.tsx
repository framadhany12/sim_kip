import Link from "next/link";
import { redirect } from "next/navigation";
import { CatatKehadiran } from "@/components/pendaftar/pindai-presensi";
import { Card } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";
import { sudahMahasiswa } from "@/lib/pendaftaran";

export const metadata = { title: "Presensi Kegiatan" };

export default async function HadirPage({ searchParams }: { searchParams: Promise<{ k?: string; t?: string }> }) {
  const { d } = await konteksPendaftar();
  if (!sudahMahasiswa(d)) redirect("/dashboard");
  const { k, t } = await searchParams;
  return (
    <div className="space-y-6">
      <Card title="Presensi Kegiatan">
        {k && t ? <CatatKehadiran kegiatanId={k} token={t} /> : <p className="text-sm text-rose-700">Tautan barcode tidak lengkap.</p>}
        <p className="mt-4">
          <Link href="/mahasiswa/kegiatan" className="text-sm font-semibold text-blue-700 hover:underline">
            Lihat daftar kegiatan →
          </Link>
        </p>
      </Card>
    </div>
  );
}
