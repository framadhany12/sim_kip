"use client";

import { usePathname } from "next/navigation";

/** Header situs publik/pendaftar tidak dipakai di panel admin (admin punya sidebar & topbar sendiri). */
export function SembunyikanDiAdmin({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/admin" || path.startsWith("/admin/")) return null;
  return <>{children}</>;
}
