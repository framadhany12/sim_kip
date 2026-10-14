import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>;
}
