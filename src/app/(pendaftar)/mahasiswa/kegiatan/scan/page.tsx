import Link from "next/link";
import { redirect } from "next/navigation";
import { PindaiPresensi } from "@/components/pendaftar/pindai-presensi";
import { Card } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";
import { sudahMahasiswa } from "@/lib/pendaftaran";

export const metadata = { title: "Scan Presensi" };

export default async function ScanPage() {
  const { d } = await konteksPendaftar();
  if (!sudahMahasiswa(d)) redirect("/dashboard");
  return (
    <div className="space-y-6">
      <Link href="/mahasiswa/kegiatan" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Kembali ke Kegiatan
      </Link>
      <Card title="Scan Presensi Kegiatan">
        <p className="mb-4 text-sm text-slate-600">Arahkan kamera ke barcode yang ditampilkan di lokasi kegiatan. Barcode berganti otomatis, jadi pindai langsung di tempat.</p>
        <PindaiPresensi />
      </Card>
    </div>
  );
}
