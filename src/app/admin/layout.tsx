import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { pertanyaan } from "@/db/schema";
import { keluar } from "@/app/actions/auth";
import { AdminShell } from "@/components/admin/shell";
import { LogoTedc } from "@/components/logo";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(pertanyaan).where(sql`${pertanyaan.jawaban} is null`);
  return (
    <AdminShell nama={admin.nama} email={admin.email} pertanyaanBaru={Number(n)} logo={<LogoTedc size={36} />} aksiKeluar={keluar}>
      {children}
    </AdminShell>
  );
}
