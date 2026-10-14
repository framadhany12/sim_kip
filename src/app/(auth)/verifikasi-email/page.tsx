import Link from "next/link";
import { cookies } from "next/headers";
import { kirimUlangVerifikasi } from "@/app/actions/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Alert } from "@/components/ui";

export const metadata = { title: "Verifikasi Email" };

/** Samarkan sebagian email: s***i@gmail.com */
function samarkan(email: string) {
  const [u, d] = email.split("@");
  if (!d) return email;
  return `${u[0]}${"*".repeat(Math.max(1, u.length - 2))}${u.length > 1 ? u[u.length - 1] : ""}@${d}`;
}

export default async function VerifikasiEmailPage({ searchParams }: { searchParams: Promise<{ status?: string; belum?: string }> }) {
  const { status, belum } = await searchParams;
  const jar = await cookies();
  const email = jar.get("kip_verif_email")?.value;
  const devLink = process.env.NODE_ENV !== "production" ? jar.get("kip_dev_link")?.value : undefined;

  return (
    <>
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-blue-50 text-2xl" aria-hidden>
        ✉
      </div>
      <h1 className="mt-4 text-center text-xl font-bold text-slate-900">
        {status === "tidak-berlaku" ? "Tautan tidak berlaku" : "Cek email Anda"}
      </h1>

      <div className="mt-4 space-y-4">
        {status === "tidak-berlaku" ? (
          <Alert tone="error">
            Tautan verifikasi sudah kedaluwarsa atau sudah pernah dipakai. Bila akun Anda sudah aktif, silakan{" "}
            <Link href="/masuk" className="font-semibold underline">
              masuk
            </Link>
            . Bila belum, minta tautan baru di bawah.
          </Alert>
        ) : belum ? (
          <Alert tone="warning" title="Email belum diverifikasi">
            Akun Anda belum aktif. Buka tautan verifikasi yang kami kirim ke email Anda, atau minta tautan baru di bawah.
          </Alert>
        ) : (
          <p className="text-center text-[15px] text-slate-600">
            Kami mengirim tautan verifikasi ke <b className="text-slate-900">{email ? samarkan(email) : "email Anda"}</b>. Buka email tersebut dan tekan{" "}
            <b>Verifikasi Email</b> untuk mengaktifkan akun. Tautan berlaku 24 jam.
          </p>
        )}

        <ul className="space-y-1.5 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <li>• Tidak ada di Kotak Masuk? Periksa folder <b>Spam</b> atau <b>Promosi</b>.</li>
          <li>• Pastikan alamat email yang Anda ketik benar.</li>
          <li>• Akun belum bisa dipakai masuk sebelum email diverifikasi.</li>
        </ul>

        {devLink && (
          <Alert tone="info" title="Mode pengembangan (SMTP belum diatur)">
            Email tidak benar-benar dikirim. Gunakan tautan ini untuk menguji:{" "}
            <a href={devLink} className="break-all font-semibold underline">
              {devLink}
            </a>
          </Alert>
        )}

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">Belum menerima email?</p>
          <ActionForm action={kirimUlangVerifikasi} className="space-y-3">
            {email ? <input type="hidden" name="email" value={email} /> : <Field name="email" type="email" label="Email yang dipakai saat mendaftar" required autoComplete="email" />}
            <SubmitButton variant="secondary" className="w-full">
              Kirim Ulang Tautan Verifikasi
            </SubmitButton>
          </ActionForm>
        </div>
      </div>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
        Salah email?{" "}
        <Link href="/daftar" className="font-semibold text-blue-700 hover:underline">
          Daftar ulang
        </Link>{" "}
        ·{" "}
        <Link href="/masuk" className="font-semibold text-blue-700 hover:underline">
          Masuk
        </Link>
      </p>
    </>
  );
}
