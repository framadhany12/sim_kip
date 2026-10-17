"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Memantau jumlah presensi; rekap disegarkan otomatis begitu ada mahasiswa yang scan (tanpa muat ulang manual). */
export function MuatUlangPresensi({ kegiatanId, jumlahAwal, detik = 2 }: { kegiatanId: string; jumlahAwal: number; detik?: number }) {
  const router = useRouter();
  const terakhir = useRef(jumlahAwal);

  useEffect(() => {
    terakhir.current = jumlahAwal;
  }, [jumlahAwal]);

  useEffect(() => {
    let sibuk = false;
    async function cek() {
      if (sibuk || document.visibilityState !== "visible") return;
      sibuk = true;
      try {
        const r = await fetch(`/api/admin/kegiatan/${kegiatanId}/jumlah`, { cache: "no-store" });
        if (!r.ok) return;
        const { jumlah } = (await r.json()) as { jumlah: number };
        if (jumlah !== terakhir.current) {
          terakhir.current = jumlah;
          router.refresh();
        }
      } catch {
        // jaringan putus sesaat: coba lagi pada putaran berikutnya
      } finally {
        sibuk = false;
      }
    }
    const id = setInterval(cek, detik * 1000);
    document.addEventListener("visibilitychange", cek);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", cek);
    };
  }, [kegiatanId, detik, router]);

  return null;
}
