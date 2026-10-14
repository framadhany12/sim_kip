import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profilAdmin, users } from "@/db/schema";
import { aturSandiAdmin } from "@/app/actions/pengguna";
import { FormProfilAdmin } from "@/components/admin/form-profil-admin";
import { FormSandi } from "@/components/admin/form-sandi";
import { Card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { tanggal } from "@/lib/constants";

export const metadata = { title: "Kelola Admin" };

export default async function KelolaAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saya = await requireAdmin();
  const db = await getDb();
  const [u] = await db.select().from(users).where(and(eq(users.id, id), eq(users.role, "admin")));
  if (!u) notFound();
  const [profil] = await db.select().from(profilAdmin).where(eq(profilAdmin.userId, id));
  const diriSendiri = saya.id === id;

  return (
    <div className="space-y-5">
      <Link href="/admin/user" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Manajemen User
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{u.nama}</h1>
        <p className="text-sm text-slate-600">
          {u.email} · dibuat {tanggal(u.createdAt, false)}
          {diriSendiri && " · akun Anda"}
        </p>
      </div>
      <Card title="Profil untuk calon mahasiswa">
        <FormProfilAdmin userId={u.id} profil={profil} />
      </Card>
      <Card title="Kata sandi">
        {diriSendiri ? (
          <p className="text-sm text-slate-600">
            Untuk mengubah kata sandi Anda sendiri, gunakan menu{" "}
            <Link href="/admin/akun" className="font-semibold text-blue-700 hover:underline">
              Akun Saya
            </Link>
            .
          </p>
        ) : (
          <FormSandi nama={u.nama} action={aturSandiAdmin.bind(null, u.id)} admin />
        )}
      </Card>
    </div>
  );
}
