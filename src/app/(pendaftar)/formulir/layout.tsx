import Link from "next/link";
import { Hero } from "@/components/hero";
import { Stepper } from "@/components/stepper";
import { Alert } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";

export default async function FormulirLayout({ children }: { children: React.ReactNode }) {
  const { d, cek, sudahDikirim } = await konteksPendaftar();
  return (
    <div className="space-y-6">
      <Hero
        eyebrow="Pendaftaran KIP Kuliah"
        title="Formulir Pendaftaran"
        desc={<>Isi berurutan. Setiap langkah tersimpan otomatis saat Anda menekan <b>Simpan & Lanjut</b>, jadi Anda bisa berhenti dan melanjutkan kapan saja.</>}
      />
      <Stepper selesai={cek.langkah} />
      {d.status === "perbaikan" && (
        <Alert tone="warning" title="Admin meminta perbaikan">
          {d.catatanAdmin}
          <br />
          Perbaiki isian/berkas yang disebutkan, lalu kirim ulang di langkah <b>Ringkasan & Kirim</b>.
        </Alert>
      )}
      {sudahDikirim && (
        <Alert tone="info" title="Pendaftaran sudah dikirim">
          Anda masih bisa memperbarui data dan mengganti berkas; setiap perubahan tercatat di riwayat dan terlihat oleh admin. Pilihan
          jurusan hanya dapat diubah oleh admin. Pantau perkembangan di{" "}
          <Link href="/status" className="font-semibold underline">
            halaman Status
          </Link>
          .
        </Alert>
      )}
      {children}
    </div>
  );
}
