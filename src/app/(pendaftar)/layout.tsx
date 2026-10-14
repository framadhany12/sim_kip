import { requirePendaftar } from "@/lib/auth";

export default async function PendaftarLayout({ children }: { children: React.ReactNode }) {
  await requirePendaftar();
  return <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>;
}
