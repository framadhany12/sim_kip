"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Menyegarkan data halaman server secara berkala selama tab terlihat (mis. rekap presensi yang terus bertambah). */
export function MuatUlangBerkala({ detik = 10 }: { detik?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, detik * 1000);
    return () => clearInterval(id);
  }, [router, detik]);
  return null;
}
