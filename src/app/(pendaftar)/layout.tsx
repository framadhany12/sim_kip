import { requirePendaftar } from "@/lib/auth";

export default async function PendaftarLayout({ children }: { children: React.ReactNode }) {
  await requirePendaftar();
  // pb-28: ruang untuk menu bawah (HP/tablet) beserta area aman perangkat.
  return <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:pb-10">{children}</main>;
}
