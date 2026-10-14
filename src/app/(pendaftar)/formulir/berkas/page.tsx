import Link from "next/link";
import { Card } from "@/components/ui";
import { UploadBerkas } from "@/components/upload-berkas";
import { BERKAS_INFO, BERKAS_UTAMA, LINK_FORMAT_SURAT, MAX_FILE_MB } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";
import { ringkasBerkas } from "@/lib/berkas-view";

export const metadata = { title: "Unggah Berkas" };

export default async function BerkasPage() {
  const { d } = await konteksPendaftar();
  const jumlah = BERKAS_UTAMA.filter((j) => d.berkas[j]).length;
  return (
    <Card title="6. Unggah Berkas Persyaratan" action={<span className="text-sm text-slate-600">{jumlah} dari {BERKAS_UTAMA.length} berkas wajib</span>}>
      <p className="mb-4 text-sm text-slate-600">
        Format PDF, JPG, atau PNG, maksimal {MAX_FILE_MB} MB per berkas. Pastikan tulisan terbaca jelas, tidak buram, dan tidak terpotong. Klik gambar kecil untuk
        melihat pratinjau; tekan <b>Ganti</b> bila berkas salah atau kurang jelas.
      </p>
      <div className="space-y-3">
        {BERKAS_UTAMA.map((j) => (
          <UploadBerkas
            key={j}
            jenis={j}
            label={BERKAS_INFO[j].label}
            tips={BERKAS_INFO[j].tips}
            wajib
            berkas={ringkasBerkas(d.berkas[j])}
            editable
            extra={
              j === "surat_permohonan_direktur" ? (
                <a href={LINK_FORMAT_SURAT} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[13px] font-semibold text-blue-700 hover:underline">
                  Buka format resmi surat (s.id/permohonandirektur-kiptedc) ↗
                </a>
              ) : undefined
            }
          />
        ))}
      </div>
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-20 -mx-4 -mb-4 mt-6 flex items-stretch gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mb-5 sm:items-center sm:justify-between sm:px-5 lg:static lg:mx-0 lg:mb-0 lg:gap-3 lg:border-slate-100 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-5 lg:backdrop-blur-none">
        <Link href="/formulir/rekomendasi" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-600 ring-1 ring-slate-300 hover:text-slate-900 sm:ring-0">
          ← Kembali
        </Link>
        <Link href="/formulir/ringkasan" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-gradient-to-b from-[#2563eb] to-[#1646a0] px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:brightness-110 sm:flex-none">
          Lanjut ke Ringkasan →
        </Link>
      </div>
    </Card>
  );
}
