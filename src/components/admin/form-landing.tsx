"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, SubmitButton, TextArea, Field, useFormErrors } from "@/components/form";
import { Card } from "@/components/ui";
import { pulihkanLanding, simpanLanding } from "@/app/actions/landing";
import type { LandingKonten } from "@/lib/landing";

const baris = (a: string[]) => a.join("\n");
const pasang = (a: { judul: string; isi: string }[]) => a.map((x) => `${x.judul} | ${x.isi}`).join("\n");

function Banner({ banner }: { banner: LandingKonten["banner"] }) {
  const s = useFormErrors();
  const [aktif, setAktif] = useState(s?.values ? s.values.bannerAktif === "on" : banner.aktif);
  return (
    <Card title="Pengumuman penting (banner)">
      <div className="space-y-4">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" name="bannerAktif" checked={aktif} onChange={(e) => setAktif(e.target.checked)} className="mt-0.5 size-5 accent-blue-700" />
          <span>
            <b className="block text-slate-900">Tampilkan banner di bagian atas landing page</b>
            Pakai untuk kabar mendadak, mis. perubahan syarat atau batas waktu dari kementerian.
          </span>
        </label>
        <TextArea name="bannerTeks" label="Teks pengumuman" rows={2} defaultValue={banner.teks} hint="Maksimal 400 karakter. Hanya tampil bila kotak di atas dicentang." />
      </div>
    </Card>
  );
}

function Tombol() {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <p className="text-[13px] text-slate-500">Perubahan langsung tampil bagi pengunjung setelah disimpan.</p>
      <SubmitButton>Simpan Perubahan</SubmitButton>
    </div>
  );
}

export function FormLanding({ k }: { k: LandingKonten }) {
  return (
    <ActionForm action={simpanLanding} className="space-y-5">
      <Banner banner={k.banner} />

      <Card title="Bagian utama (hero)">
        <div className="grid gap-4">
          <Field name="heroJudul" label="Judul" required defaultValue={k.hero.judul} />
          <Field name="heroSorot" label="Lanjutan judul (berwarna kuning)" defaultValue={k.hero.sorot} hint="Disambung langsung setelah judul dan ditampilkan menyala." />
          <TextArea name="heroDeskripsi" label="Deskripsi" required rows={3} defaultValue={k.hero.deskripsi} />
        </div>
      </Card>

      <Card title="Persyaratan pendaftar">
        <div className="grid gap-4">
          <Field name="syaratJudul" label="Judul kotak" required defaultValue={k.syarat.judul} />
          <TextArea name="syaratItem" label="Daftar persyaratan" required rows={5} defaultValue={baris(k.syarat.item)} hint="Satu persyaratan per baris." />
        </div>
      </Card>

      <Card title="Berkas yang disiapkan">
        <div className="grid gap-4">
          <Field name="berkasJudul" label="Judul kotak" required defaultValue={k.berkas.judul} />
          <TextArea name="berkasItem" label="Daftar berkas" required rows={6} defaultValue={baris(k.berkas.item)} hint="Satu berkas per baris." />
          <Field name="berkasCatatan" label="Catatan di bawah daftar" defaultValue={k.berkas.catatan} />
        </div>
      </Card>

      <Card title="Tentang KIP Kuliah">
        <div className="grid gap-4">
          <Field name="kipJudul" label="Judul bagian" required defaultValue={k.kip.judul} />
          <TextArea name="kipRingkas" label="Penjelasan singkat" required rows={4} defaultValue={k.kip.ringkas} />
          <TextArea name="kipSasaran" label="Diperuntukkan bagi" required rows={4} defaultValue={baris(k.kip.sasaran)} hint="Satu sasaran per baris." />
          <TextArea
            name="kipManfaat"
            label="Kartu manfaat"
            required
            rows={6}
            defaultValue={pasang(k.kip.manfaat)}
            hint="Satu kartu per baris dengan format: Judul | Isi. Pisahkan judul dan isi dengan tanda |."
          />
        </div>
      </Card>

      <Card title="Cara mendaftar">
        <div className="grid gap-4">
          <Field name="alurJudul" label="Judul bagian" required defaultValue={k.alur.judul} />
          <TextArea
            name="alurLangkah"
            label="Langkah-langkah"
            required
            rows={7}
            defaultValue={pasang(k.alur.langkah)}
            hint="Satu langkah per baris dengan format: Judul | Isi. Nomor otomatis mengikuti urutan."
          />
        </div>
      </Card>

      <Card title="Profil kampus">
        <div className="grid gap-4">
          <TextArea name="kampusRingkas" label="Profil singkat kampus" required rows={4} defaultValue={k.kampus.ringkas} />
          <TextArea name="kampusAlamat" label="Alamat kampus" required rows={2} defaultValue={k.kampus.alamat} />
        </div>
      </Card>

      <Tombol />
    </ActionForm>
  );
}

/** Memberi tahu induk saat aksi berhasil, supaya formulir utama dimuat ulang dengan isi bawaan. */
function PantauSukses({ onSukses }: { onSukses: () => void }) {
  const s = useFormErrors();
  useEffect(() => {
    if (s?.ok) onSukses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);
  return null;
}

/**
 * Editor landing page. Formulir tidak dibuat ulang setelah menyimpan (pesan berhasil tetap terlihat);
 * ia hanya dimuat ulang setelah "Kembalikan ke bawaan" agar isiannya kembali ke bawaan.
 */
export function EditorLanding({ k, diubah }: { k: LandingKonten; diubah: boolean }) {
  const router = useRouter();
  const [versi, setVersi] = useState(0);
  const menunggu = useRef(false);
  const tanda = JSON.stringify(k);
  useEffect(() => {
    if (menunggu.current) {
      menunggu.current = false;
      setVersi((v) => v + 1);
    }
  }, [tanda]);
  return (
    <>
      <FormLanding key={versi} k={k} />
      <Card title="Kembalikan ke bawaan">
        <FormPulihkan
          diubah={diubah}
          onSukses={() => {
            menunggu.current = true;
            router.refresh();
          }}
        />
      </Card>
    </>
  );
}

export function FormPulihkan({ onSukses, diubah = true }: { onSukses?: () => void; diubah?: boolean }) {
  const [yakin, setYakin] = useState(false);
  return (
    <ActionForm action={pulihkanLanding} className="space-y-3">
      {onSukses && <PantauSukses onSukses={() => { setYakin(false); onSukses(); }} />}
      {!diubah ? (
        <p className="text-sm text-slate-600">Isi landing page saat ini masih bawaan, belum ada yang perlu dikembalikan.</p>
      ) : !yakin ? (
        <button type="button" onClick={() => setYakin(true)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-300 hover:bg-rose-50">
          Kembalikan ke isi bawaan
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4" role="alertdialog" aria-label="Konfirmasi kembalikan ke bawaan">
          <p className="text-sm text-rose-950">Semua perubahan landing page akan dihapus dan kembali ke isi bawaan. Lanjutkan?</p>
          <div className="flex flex-wrap gap-2">
            <SubmitButton variant="danger">Ya, kembalikan</SubmitButton>
            <button type="button" onClick={() => setYakin(false)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
              Batal
            </button>
          </div>
        </div>
      )}
    </ActionForm>
  );
}
