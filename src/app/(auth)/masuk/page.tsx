import Link from "next/link";
import { masuk } from "@/app/actions/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Alert } from "@/components/ui";

export const metadata = { title: "Masuk" };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Masuk ke akun</h1>
      <p className="mt-1 text-sm text-slate-600">Lanjutkan pendaftaran atau cek status KIP Kuliah Anda.</p>
      <div className="mt-6">
        {reset && (
          <div className="mb-5">
            <Alert tone="success">Kata sandi berhasil diatur ulang. Silakan masuk dengan kata sandi baru.</Alert>
          </div>
        )}
        <ActionForm action={masuk}>
          <Field name="email" label="Email atau NIK" required autoComplete="username" placeholder="nama@gmail.com atau 16 digit NIK" />
          <Field name="password" type="password" label="Kata sandi" required autoComplete="current-password" />
          <div className="flex items-center justify-between gap-3">
            <Link href="/lupa-sandi" className="text-sm font-medium text-blue-700 hover:underline">
              Lupa kata sandi?
            </Link>
            <SubmitButton>Masuk</SubmitButton>
          </div>
        </ActionForm>
      </div>
      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-blue-700 hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </>
  );
}
