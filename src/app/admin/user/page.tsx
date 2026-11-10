import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profilAdmin, users } from "@/db/schema";
import { FormAdminBaru } from "@/components/admin/form-admin-baru";
import { TombolAktif } from "@/components/admin/tombol-aktif";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { tanggal } from "@/lib/constants";

export const metadata = { title: "Manajemen User" };

export default async function ManajemenUserPage() {
  const saya = await requireAdmin();
  const db = await getDb();
  const rows = await db
    .select({ id: users.id, nama: users.nama, email: users.email, createdAt: users.createdAt, aktif: users.aktif, jabatan: profilAdmin.jabatan, whatsapp: profilAdmin.whatsapp, tampil: profilAdmin.tampil })
    .from(users)
    .leftJoin(profilAdmin, eq(profilAdmin.userId, users.id))
    .where(eq(users.role, "admin"))
    .orderBy(asc(users.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen User"
        desc="Kelola akun admin: tambah admin baru, aktifkan/nonaktifkan akun, atur ulang kata sandi admin, dan lengkapi profil yang ditampilkan ke calon mahasiswa di halaman Bantuan."
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Admin</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Jabatan</th>
              <th className="px-4 py-3 font-semibold">Di halaman Bantuan</th>
              <th className="px-4 py-3 font-semibold">Dibuat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {r.nama} {r.id === saya.id && <span className="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">Anda</span>}
                  </p>
                  <p className="text-slate-500">{r.email}</p>
                </td>
                <td className="px-4 py-3"><TombolAktif userId={r.id} nama={r.nama} aktif={r.aktif} dilarang={r.id === saya.id} /></td>
                <td className="px-4 py-3 text-slate-700">{r.jabatan || <span className="text-slate-500">Belum diisi</span>}</td>
                <td className="px-4 py-3">
                  {r.tampil ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-300">Ditampilkan</span>
                  ) : (
                    <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-300">Disembunyikan</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{tanggal(r.createdAt, false)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/user/${r.id}`} className="font-semibold text-blue-700 hover:underline">
                    Kelola
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title="Tambah admin baru">
        <FormAdminBaru />
      </Card>
    </div>
  );
}
