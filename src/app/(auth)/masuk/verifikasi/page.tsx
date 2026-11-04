import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import QRCode from "qrcode";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { FormAktivasi, FormKodeMasuk } from "@/components/form-authenticator";
import { bacaTiketMfa } from "@/lib/mfa";
import { buatRahasiaTotp, dekripsiRahasia, enkripsiRahasia, urlOtpauth } from "@/lib/totp";

export const metadata = { title: "Verifikasi 2 Langkah" };

export default async function VerifikasiMfaPage() {
  const userId = await bacaTiketMfa();
  if (!userId) redirect("/masuk");
  const db = await getDb();
  const [u] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.role, "admin"), eq(users.aktif, true)));
  if (!u) redirect("/masuk");

  const kembali = (
    <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
      <Link href="/masuk" className="font-semibold text-blue-700 hover:underline">
        ← Kembali ke halaman masuk
      </Link>
    </p>
  );

  if (u.totpAktif && u.totpSecret)
    return (
      <>
        <h1 className="text-xl font-bold text-slate-900">Verifikasi 2 langkah</h1>
        <p className="mt-1 text-sm text-slate-600">Masukkan kode dari aplikasi authenticator di ponsel Anda untuk masuk sebagai admin.</p>
        <div className="mt-6">
          <FormKodeMasuk />
        </div>
        {kembali}
      </>
    );

  // Belum diaktifkan: buat rahasia sekali (tetap sama bila halaman dimuat ulang) sampai kodenya dikonfirmasi.
  let rahasia = u.totpSecret ? dekripsiRahasia(u.totpSecret) : "";
  if (!rahasia) {
    rahasia = buatRahasiaTotp();
    await db.update(users).set({ totpSecret: enkripsiRahasia(rahasia) }).where(eq(users.id, u.id));
  }
  const qr = await QRCode.toDataURL(urlOtpauth(u.email, rahasia), { margin: 1, width: 220 });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Aktifkan authenticator</h1>
      <p className="mt-1 text-sm text-slate-600">Akun admin wajib memakai verifikasi 2 langkah. Lakukan sekali saja, sekarang.</p>
      <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm text-slate-700">
        <li>
          Pasang Google Authenticator, Microsoft Authenticator, atau Authy di ponsel Anda.
        </li>
        <li>
          Pindai kode QR ini dari aplikasi tersebut.
          <div className="mt-3 flex flex-col items-center gap-2 rounded-lg bg-white p-3 ring-1 ring-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Kode QR untuk aplikasi authenticator" width={220} height={220} className="rounded bg-white" />
            <p className="text-center text-[13px] text-slate-600">
              Tidak bisa memindai? Masukkan kunci ini manual:
              <span className="mt-1 block break-all font-mono text-[13px] font-semibold tracking-wide text-slate-900">{rahasia.match(/.{1,4}/g)?.join(" ")}</span>
            </p>
          </div>
        </li>
        <li>Masukkan kode 6 digit yang muncul di aplikasi.</li>
      </ol>
      <div className="mt-5">
        <FormAktivasi />
      </div>
      {kembali}
    </>
  );
}
