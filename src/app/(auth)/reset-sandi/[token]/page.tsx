import Link from "next/link";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { resetSandi } from "@/app/actions/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Alert } from "@/components/ui";
import { sha256 } from "@/lib/auth";

export const metadata = { title: "Atur Ulang Kata Sandi" };

export default async function ResetSandiPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDb();
  const [r] = await db
    .select({ email: users.email })
    .from(passwordResets)
    .innerJoin(users, eq(users.id, passwordResets.userId))
    .where(and(eq(passwordResets.id, sha256(token)), gt(passwordResets.expiresAt, new Date())));

  if (!r)
    return (
      <>
        <h1 className="text-xl font-bold text-slate-900">Tautan tidak berlaku</h1>
        <div className="mt-4 space-y-4">
          <Alert tone="error">
            Tautan atur ulang kata sandi sudah kedaluwarsa (berlaku 1 jam) atau sudah pernah dipakai. Tautan juga tidak berlaku lagi bila Anda sudah
            meminta tautan yang lebih baru.
          </Alert>
          <Link href="/lupa-sandi" className="inline-flex w-full justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            Minta Tautan Baru
          </Link>
        </div>
      </>
    );

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Buat kata sandi baru</h1>
      <p className="mt-1 text-sm text-slate-600">
        Untuk akun <b className="text-slate-900">{r.email}</b>. Setelah disimpan, Anda perlu masuk lagi di semua perangkat.
      </p>
      <div className="mt-6">
        <ActionForm action={resetSandi.bind(null, token)}>
          <input type="text" name="username" autoComplete="username" defaultValue={r.email} hidden readOnly />
          <Field name="password" type="password" label="Kata sandi baru" required autoComplete="new-password" hint="Minimal 8 karakter, berisi huruf dan angka." />
          <Field name="password2" type="password" label="Ulangi kata sandi baru" required autoComplete="new-password" />
          <SubmitButton className="w-full">Simpan Kata Sandi</SubmitButton>
        </ActionForm>
      </div>
    </>
  );
}
