import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Dl } from "./ui";
import { BERKAS_INFO, DESIL_LABEL, JENIS_URUT, STATUS_NIKAH_LABEL, hitungUmur, rupiah, yaTidak } from "@/lib/constants";
import type { PendaftaranLengkap } from "@/lib/pendaftaran";

function Bagian({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  return (
    <Card
      title={title}
      action={
        href && (
          <Link href={href} className="text-sm font-medium text-blue-700 hover:underline">
            Ubah
          </Link>
        )
      }
    >
      {children}
    </Card>
  );
}

const kosong = <p className="text-sm text-amber-700">Belum diisi.</p>;
/** Untuk kolom yang ditambahkan belakangan dan belum diisi pendaftar lama. */
const Belum = () => <span className="text-amber-700">Belum diisi</span>;

/** Tampilan seluruh isian pendaftaran — dipakai di Ringkasan (pendaftar) dan detail pendaftar (admin). */
export function RingkasanData({ d, editLinks, berkasSlot }: { d: PendaftaranLengkap; editLinks?: boolean; berkasSlot?: ReactNode }) {
  const link = (s: string) => (editLinks ? `/formulir/${s}` : undefined);
  const x = d.diri;
  return (
    <div className="space-y-4">
      <Bagian title="Data Diri" href={link("data-diri")}>
        {x ? (
          <Dl
            items={[
              ["No. Pendaftaran KIP Kuliah", x.nomorPendaftaranKip ? <span key="kip" className="font-mono">{x.nomorPendaftaranKip}</span> : <Belum key="kip" />],
              ["Desil", x.desil ? DESIL_LABEL[x.desil] : <Belum key="desil" />],
              ["Penerima PIP", x.penerimaPip == null ? <Belum key="pip" /> : yaTidak(x.penerimaPip)],
              ["Nama lengkap", x.namaLengkap],
              ["NIK", <span key="nik" className="font-mono">{x.nik}</span>],
              ["NISN", x.nisn ? <span key="nisn" className="font-mono">{x.nisn}</span> : <Belum key="nisn" />],
              ["Tempat, tanggal lahir", `${x.tempatLahir}, ${new Date(x.tanggalLahir).toLocaleDateString("id-ID", { dateStyle: "long" })} (${hitungUmur(x.tanggalLahir)} tahun)`],
              ["Jenis kelamin", x.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"],
              ["Agama", x.agama ?? <Belum key="agama" />],
              ["Status pernikahan", x.statusPernikahan ? STATUS_NIKAH_LABEL[x.statusPernikahan] : <Belum key="nikah" />],
              ["Nomor HP/WhatsApp", x.kontak],
              ["Alamat", `${x.alamatLengkap}, RT ${x.rt}/RW ${x.rw}, ${x.desaKelurahan}`],
              ["Kecamatan", x.kecamatan],
              ["Kabupaten/Kota", `${x.kabupaten}, ${x.provinsi}`],
            ]}
          />
        ) : (
          kosong
        )}
      </Bagian>
      <Bagian title="Data Keluarga" href={link("keluarga")}>
        {d.keluarga ? (
          <Dl
            items={[
              ["Nama ayah", d.keluarga.namaAyah],
              ["Nama ibu", d.keluarga.namaIbu],
              ["HP/WA orang tua/wali", d.keluarga.teleponOrangTua ?? <Belum key="telp" />],
              ["Nama wali", d.keluarga.namaWali ?? "-"],
              ["Anggota keluarga serumah", `${d.keluarga.jumlahAnggotaKeluarga} orang`],
            ]}
          />
        ) : (
          kosong
        )}
      </Bagian>
      <Bagian title="Ekonomi Orang Tua/Wali" href={link("ekonomi")}>
        {d.ekonomi ? (
          <Dl
            items={[
              ["Penghasilan per bulan", rupiah(d.ekonomi.penghasilanBulanan)],
              ["Pekerjaan", d.ekonomi.pekerjaan],
              ["Tanggungan", `${d.ekonomi.tanggungan} orang`],
              ["Keterangan tambahan", d.ekonomi.keteranganTambahan ?? "-"],
            ]}
          />
        ) : (
          kosong
        )}
      </Bagian>
      <Bagian title="Sekolah & Pilihan Jurusan" href={link("sekolah")}>
        {d.sekolah ? (
          <Dl
            items={[
              ["Nama sekolah", d.sekolah.namaSekolah],
              ["NPSN", d.sekolah.npsn],
              ["Tahun lulus", String(d.sekolah.tahunLulus)],
              ["Jurusan di sekolah", d.sekolah.jurusanSekolah],
              ["Jurusan 1", d.pilihan?.jurusan1 ?? "-"],
              ["Jurusan 2", d.pilihan?.jurusan2 ?? "-"],
            ]}
          />
        ) : (
          kosong
        )}
      </Bagian>
      <Bagian title="Rekomendasi" href={link("rekomendasi")}>
        {d.rekomendasi ? (
          <Dl
            items={[
              ["Rekomendasi dari", d.rekomendasi.sumber],
              ["Nama perekomendasi", d.rekomendasi.namaPerekomendasi ?? "-"],
              ["HP perekomendasi", d.rekomendasi.teleponPerekomendasi ?? "-"],
            ]}
          />
        ) : (
          kosong
        )}
      </Bagian>
      <Bagian title="Berkas" href={editLinks ? "/formulir/berkas" : undefined}>
        {berkasSlot ?? (
          <ul className="divide-y divide-slate-100">
            {JENIS_URUT.map((j) => {
              const b = d.berkas[j];
              return (
                <li key={j} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="text-slate-800">
                    {BERKAS_INFO[j].label}
                    {!BERKAS_INFO[j].wajib && <span className="text-slate-500"> (opsional)</span>}
                  </span>
                  {b ? (
                    <a href={`/api/berkas/${b.id}`} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">
                      Lihat berkas ↗
                    </a>
                  ) : (
                    <span className={BERKAS_INFO[j].wajib ? "text-amber-700" : "text-slate-400"}>Belum diunggah</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Bagian>
    </div>
  );
}
