import { simpanProfilAdmin } from "@/app/actions/pengguna";
import { ActionForm, Field, SubmitButton, TextArea } from "@/components/form";

type Profil = { jabatan: string | null; whatsapp: string | null; keterangan: string | null; tampil: boolean } | null | undefined;

/** Form profil sederhana admin; dipakai di halaman Manajemen User dan Akun Saya. */
export function FormProfilAdmin({ userId, profil }: { userId: string; profil: Profil }) {
  return (
    <ActionForm action={simpanProfilAdmin.bind(null, userId)} className="grid items-start gap-4 sm:grid-cols-2">
      <Field name="jabatan" label="Jabatan / peran" defaultValue={profil?.jabatan} contoh="Pengelola KIP Kuliah" />
      <Field name="whatsapp" type="tel" inputMode="tel" label="Nomor WhatsApp" defaultValue={profil?.whatsapp ? "0" + profil.whatsapp.replace(/^62/, "") : ""} contoh="081234567890" />
      <div className="sm:col-span-2">
        <TextArea name="keterangan" label="Keterangan singkat" rows={2} defaultValue={profil?.keterangan} hint="Mis. jam layanan atau topik yang bisa ditanyakan. Maksimal 300 karakter." />
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-[15px] text-slate-800 sm:col-span-2">
        <input type="checkbox" name="tampil" defaultChecked={profil?.tampil} className="mt-0.5 size-5 shrink-0 accent-blue-700" />
        <span>
          <b>Tampilkan di halaman Bantuan</b>
          <span className="block text-[13px] text-slate-600">Calon mahasiswa dapat melihat nama, jabatan, dan tombol WhatsApp admin ini untuk memastikan kontak resmi pengelola KIP Kuliah.</span>
        </span>
      </label>
      <div className="sm:col-span-2">
        <SubmitButton>Simpan Profil</SubmitButton>
      </div>
    </ActionForm>
  );
}
