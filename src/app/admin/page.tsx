import { DashboardLive } from "@/components/admin/dashboard-live";
import { daftarTahun } from "@/lib/admin-query";
import { ambilStatistik } from "@/lib/statistik";
import { tahunSekarang, TAHUN_MULAI } from "@/lib/tahun";

export const metadata = { title: "Dashboard Admin" };

export default async function AdminHome() {
  // Bawaan: tahun berjalan (minimal 2026). Render awal di server, lalu dashboard memperbarui diri tiap 10 detik.
  const tahun = Math.max(TAHUN_MULAI, tahunSekarang());
  const [awal, pilihanTahun] = await Promise.all([ambilStatistik({ tahun, hari: 30 }), daftarTahun()]);
  return <DashboardLive awal={awal} daftarTahun={pilihanTahun} />;
}
