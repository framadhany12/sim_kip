import { gantiSandiAwal } from "@/app/actions/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Card } from "@/components/ui";

/** Ditampilkan menggantikan semua halaman sampai sandi awal dari admin diganti. */
export function FormSandiAwal({ nama }: { nama: string }) {
  return (
    <div className="mx-auto max-w-lg space-y-5 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat kata sandi baru</h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
          Halo {nama}, akun Anda dibuat oleh admin KIP Kuliah dengan sandi awal berupa NIK. Ganti dengan kata sandi milik Anda sendiri sebelum
          melanjutkan.
        </p>
      </div>
      <Card>
        <ActionForm action={gantiSandiAwal}>
          <Field name="password" type="password" label="Kata sandi baru" required autoComplete="new-password" hint="Minimal 8 karakter, berisi huruf dan angka, dan tidak memuat NIK." />
          <Field name="password2" type="password" label="Ulangi kata sandi baru" required autoComplete="new-password" />
          <div className="flex justify-end">
            <SubmitButton>Simpan Kata Sandi</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
