import { DaftarHasil } from "@/components/admin/daftar-hasil";
import type { FilterPendaftar } from "@/lib/admin-query";

export const metadata = { title: "Mahasiswa Ditolak" };

export default async function Halaman({ searchParams }: { searchParams: Promise<FilterPendaftar> }) {
  return <DaftarHasil jenis="ditolak" f={await searchParams} />;
}
