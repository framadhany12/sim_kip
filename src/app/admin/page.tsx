import { DashboardLive } from "@/components/admin/dashboard-live";
import { daftarGelombang } from "@/lib/admin-query";
import { GELOMBANG_AKTIF } from "@/lib/pendaftaran";
import { ambilStatistik } from "@/lib/statistik";

export const metadata = { title: "Dashboard Admin" };

export default async function AdminHome() {
  // Render awal di server (tanpa layar kosong); setelah itu dashboard memperbarui diri tiap 10 detik.
  const [awal, gelombangList] = await Promise.all([ambilStatistik({ gelombang: GELOMBANG_AKTIF, hari: 30 }), daftarGelombang()]);
  const pilihan = [...new Set([GELOMBANG_AKTIF, ...gelombangList])];
  return <DashboardLive awal={awal} daftarGelombang={pilihan} />;
}
