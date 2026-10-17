import Link from "next/link";
import { redirect } from "next/navigation";
import { BannerPengumuman } from "@/components/pendaftar/banner-pengumuman";
import { Hero } from "@/components/hero";
import { FormAkademik } from "@/components/pendaftar/form-akademik";
import { Alert, Card, Dl } from "@/components/ui";
import { STATUS_NIKAH_LABEL } from "@/lib/constants";
import { konteksPendaftar } from "@/lib/konteks";
import { sudahMahasiswa } from "@/lib/pendaftaran";

export const metadata = { title: "Mahasiswa" };

const tglLahir = (s: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));

export default async function MahasiswaPage({ searchParams }: { searchParams: Promise<{ tersimpan?: string }> }) {
  const { user, d } = await konteksPendaftar();
  if (!sudahMahasiswa(d)) redirect("/dashboard");
  const { tersimpan } = await searchParams;
  const x = d.diri;

  return (
    <div className="space-y-6">
      <Hero eyebrow="Politeknik TEDC Bandung" title="Data Mahasiswa" desc="Identitas, alamat, dan data akademik Anda sebagai mahasiswa penerima KIP Kuliah." />
      <BannerPengumuman pendaftaranId={d.id} />
      {tersimpan === "identitas" && <Alert tone="success">Identitas & alamat berhasil diperbarui.</Alert>}

      <Card
        title="Identitas"
        action={
          <Link href="/mahasiswa/ubah" className="text-sm font-semibold text-blue-700 hover:underline">
            Ubah identitas & alamat
          </Link>
        }
      >
        <Dl
          items={[
            ["Nama lengkap", x?.namaLengkap ?? user.nama],
            ["NIK", x?.nik ?? d.user.nik],
            ["NISN", x?.nisn],
            ["Tempat, tanggal lahir", x ? `${x.tempatLahir}, ${tglLahir(x.tanggalLahir)}` : null],
            ["Jenis kelamin", x ? (x.jenisKelamin === "L" ? "Laki-laki" : "Perempuan") : null],
            ["Agama", x?.agama],
            ["Status pernikahan", x ? STATUS_NIKAH_LABEL[x.statusPernikahan ?? ""] : null],
            ["Nomor HP/WhatsApp", x?.kontak],
            ["Email", user.email],
          ]}
        />
      </Card>

      <Card title="Alamat">
        <Dl
          items={[
            ["Alamat lengkap", x?.alamatLengkap],
            ["RT / RW", x ? `${x.rt} / ${x.rw}` : null],
            ["Desa/Kelurahan", x?.desaKelurahan],
            ["Kecamatan", x?.kecamatan],
            ["Kabupaten/Kota", x?.kabupaten],
            ["Provinsi", x?.provinsi],
          ]}
        />
      </Card>

      <Card
        title="Pelaporan IPK & Transkrip"
        action={
          <Link href="/mahasiswa/ipk" className="text-sm font-semibold text-blue-700 hover:underline">
            Laporkan IPK
          </Link>
        }
      >
        <p className="text-sm text-slate-600">Laporkan IPK tiap semester beserta berkas transkrip nilai Anda.</p>
      </Card>

      <Card title="Akademik">
        <div className="mb-5">
          <Dl items={[["Program studi (jurusan diterima)", d.jurusanDiterima]]} />
          <p className="mt-2 text-xs text-slate-500">Program studi ditetapkan saat pengumuman dan hanya dapat diubah oleh admin.</p>
        </div>
        <FormAkademik nim={d.nim} kelas={d.kelas} />
      </Card>
    </div>
  );
}
