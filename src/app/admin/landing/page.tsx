import { ExternalLink } from "lucide-react";
import { EditorLanding } from "@/components/admin/form-landing";
import { Alert, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { ambilLanding } from "@/lib/landing";

export const metadata = { title: "Landing Page" };

export default async function KelolaLanding() {
  await requireAdmin();
  const { konten, diubah } = await ambilLanding();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Landing Page"
        desc="Ubah isi halaman depan kapan saja, mis. persyaratan atau berkas yang berubah mendadak dari kementerian. Perubahan langsung tampil setelah disimpan."
        action={
          <a href="/?pratinjau=1" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
            Lihat landing page <ExternalLink className="size-4" aria-hidden />
          </a>
        }
      />
      <Alert tone="info" title="Yang perlu diperhatikan">
        Teks di sini hanya mengubah <b>tampilan</b> landing page. Aturan isian formulir (mis. batas umur dan tahun lulus) tidak ikut berubah, jadi bila syaratnya berubah, hubungi pengembang untuk menyesuaikan formulir.
        {diubah ? " Isi saat ini sudah pernah diubah dari bawaan." : " Isi saat ini masih bawaan."}
      </Alert>
      <EditorLanding k={konten} diubah={diubah} />
    </div>
  );
}
