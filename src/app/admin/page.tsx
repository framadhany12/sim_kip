import { DashboardLive } from "@/components/admin/dashboard-live";
import { ambilStatistik } from "@/lib/statistik";
import { tahunBerjalan } from "@/lib/tahun";

export const metadata = { title: "Dashboard Admin" };

export default async function AdminHome() {
  // Bawaan: tahun berjalan (otomatis berpindah tiap 1 Januari). Render awal di server, lalu dashboard memperbarui diri tiap 10 detik.
  const awal = await ambilStatistik({ tahun: tahunBerjalan(), hari: 30 });
  return <DashboardLive awal={awal} />;
}
