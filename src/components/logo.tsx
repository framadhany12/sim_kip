import Image from "next/image";
import { KAMPUS } from "@/lib/profil";

export function LogoTedc({ size = 40, className = "", priority = true }: { size?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo-tedc.png"
      alt={`Logo ${KAMPUS.nama}`}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      priority={priority}
      unoptimized
    />
  );
}
