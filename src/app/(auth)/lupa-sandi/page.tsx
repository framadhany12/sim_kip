import Link from "next/link";
import { lupaSandi } from "@/app/actions/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";

export const metadata = { title: "Lupa Kata Sandi" };

export default function LupaSandiPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Lupa kata sandi</h1>
      <p className="mt-1 text-sm text-slate-600">Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat kata sandi baru ke email tersebut.</p>
      <div className="mt-6">
        <ActionForm action={lupaSandi}>
          <Field name="email" type="email" inputMode="email" label="Email" required autoComplete="username" />
          <SubmitButton>Kirim Tautan</SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm">
        <Link href="/masuk" className="font-semibold text-blue-700 hover:underline">
          ← Kembali ke halaman masuk
        </Link>
      </p>
    </>
  );
}
