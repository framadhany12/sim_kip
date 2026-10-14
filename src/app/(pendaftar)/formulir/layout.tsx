import Link from "next/link";
import { Stepper } from "@/components/stepper";
import { Alert } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";

export default async function FormulirLayout({ children }: { children: React.ReactNode }) {
  const { d, cek, editable } = await konteksPendaftar();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Formulir Pendaftaran</h1>
        <p className="mt-1 text-[15px] text-slate-600">
          Isi berurutan. Setiap langkah tersimpan otomatis saat Anda menekan <b>Simpan & Lanjut</b>, jadi Anda bisa berhenti dan melanjutkan kapan saja.
        </p>
      </div>
      <Stepper selesai={cek.langkah} />
      {d.status === "perbaikan" && (
        <Alert tone="warning" title="Admin meminta perbaikan">
          {d.catatanAdmin}
          <br />
          Perbaiki isian/berkas yang disebutkan, lalu kirim ulang di langkah <b>Ringkasan & Kirim</b>.
        </Alert>
      )}
      {!editable && (
        <Alert tone="info" title="Formulir terkunci">
          Pendaftaran sudah dikirim, jadi isian tidak dapat diubah. Pantau perkembangannya di{" "}
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
