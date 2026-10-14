import { perbaruiAkun, ubahSandi } from "@/app/actions/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Akun Saya" };

export default async function AkunPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Akun Saya" desc="Perbarui nama dan kata sandi akun Anda." />
      <Card title="Data akun">
        <ActionForm action={perbaruiAkun}>
          <Field name="nama" label="Nama" required defaultValue={user.nama} />
          {user.role === "admin" ? (
            <Field name="email" type="email" label="Email (untuk login)" required defaultValue={user.email} />
          ) : (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-800">Email (untuk login)</p>
              <p className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-700">
                {user.email}
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-300">✓ Terverifikasi</span>
              </p>
              <p className="mt-1.5 text-[13px] text-slate-500">Email yang sudah diverifikasi tidak dapat diganti sendiri. Hubungi admin lewat Tanya Admin bila perlu.</p>
            </div>
          )}
          <div className="flex justify-end">
            <SubmitButton>Simpan</SubmitButton>
          </div>
        </ActionForm>
      </Card>
      <Card title="Ubah kata sandi">
        <ActionForm action={ubahSandi}>
          <Field name="lama" type="password" label="Kata sandi lama" required autoComplete="current-password" />
          <Field name="password" type="password" label="Kata sandi baru" required autoComplete="new-password" hint="Minimal 8 karakter, berisi huruf dan angka." />
          <Field name="password2" type="password" label="Ulangi kata sandi baru" required autoComplete="new-password" />
          <div className="flex justify-end">
            <SubmitButton>Ubah Kata Sandi</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
