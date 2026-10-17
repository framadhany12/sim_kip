import Link from "next/link";
import { redirect } from "next/navigation";
import { Hero } from "@/components/hero";
import { Stepper } from "@/components/stepper";
import { Alert } from "@/components/ui";
import { konteksPendaftar } from "@/lib/konteks";
import { sudahMahasiswa } from "@/lib/pendaftaran";

export default async function FormulirLayout({ children }: { children: React.ReactNode }) {
  const { d, cek, sudahDikirim, terkunci } = await konteksPendaftar();
  // Setelah diterima, akun berfungsi sebagai akun mahasiswa: formulir pendaftaran tidak lagi ditampilkan.
  if (sudahMahasiswa(d)) redirect("/mahasiswa");
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
      {terkunci && (
        <Alert tone="warning" title="Data pendaftaran terkunci">
          Pendaftaran Anda sudah memasuki tahap Pengusulan, sehingga data dan berkas <b>tidak dapat diubah lagi</b>. Bila ada data yang salah, hubungi admin lewat{" "}
          <Link href="/bantuan" className="font-semibold underline">
            halaman Bantuan
          </Link>
          .
        </Alert>
      )}
      {sudahDikirim && !terkunci && (
        <Alert tone="info" title="Pendaftaran sudah dikirim">
          Anda masih bisa memperbarui data dan mengganti berkas; setiap perubahan terlihat oleh admin. Pilihan
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
