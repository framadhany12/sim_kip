import Link from "next/link";
import { redirect } from "next/navigation";
import { ScanLine } from "lucide-react";
import { Hero } from "@/components/hero";
import { Card } from "@/components/ui";
import { tanggal } from "@/lib/constants";
import { kegiatanUntukMahasiswa, statusKegiatan } from "@/lib/kegiatan";
import { konteksPendaftar } from "@/lib/konteks";
import { sudahMahasiswa } from "@/lib/pendaftaran";

export const metadata = { title: "Kegiatan" };

const BADGE = {
  akan: ["Akan datang", "bg-blue-50 text-blue-800 ring-blue-200"],
  berlangsung: ["Berlangsung", "bg-emerald-50 text-emerald-800 ring-emerald-200"],
  selesai: ["Selesai", "bg-slate-100 text-slate-700 ring-slate-300"],
} as const;

export default async function KegiatanMahasiswaPage() {
  const { d } = await konteksPendaftar();
  if (!sudahMahasiswa(d)) redirect("/dashboard");
  const daftar = await kegiatanUntukMahasiswa(d.id);

  return (
    <div className="space-y-6">
      <Hero eyebrow="Kemahasiswaan" title="Kegiatan" desc="Kegiatan yang diadakan kemahasiswaan. Pindai barcode di lokasi untuk mencatat kehadiran Anda." />
      <div className="flex">
        <Link
          href="/mahasiswa/kegiatan/scan"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gradient-to-b from-[#2563eb] to-[#1646a0] px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:brightness-110"
        >
          <ScanLine className="size-5" aria-hidden /> Scan Presensi
        </Link>
      </div>
      {daftar.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Belum ada kegiatan.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {daftar.map((k) => {
            const [label, cls] = BADGE[statusKegiatan(k)];
            return (
              <Card key={k.id}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-900">{k.nama}</h2>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>{label}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {tanggal(k.mulai)} s.d. {tanggal(k.selesai)}
                  {k.lokasi && <> · {k.lokasi}</>}
                </p>
                {k.deskripsi && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{k.deskripsi}</p>}
                <p className={`mt-3 text-sm font-semibold ${k.waktuHadir ? "text-emerald-700" : "text-slate-500"}`}>
                  {k.waktuHadir ? `✓ Hadir (${tanggal(k.waktuHadir)})` : statusKegiatan(k) === "selesai" ? "Tidak tercatat hadir" : "Belum presensi"}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
