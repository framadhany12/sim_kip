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
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <Link href="/formulir/rekomendasi" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Kembali
        </Link>
        <Link href="/formulir/ringkasan" className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">
          Lanjut ke Ringkasan →
        </Link>
      </div>
    </Card>
  );
}
