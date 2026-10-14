"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links, hanyaDesktop }: { links: { href: string; label: string; match?: string; exact?: boolean }[]; hanyaDesktop?: boolean }) {
  const path = usePathname();
  return (
    <nav className={`order-last -mx-1 w-full gap-1 overflow-x-auto ${hanyaDesktop ? "hidden lg:order-none lg:flex lg:w-auto" : "hidden md:order-none md:flex md:w-auto"}`}>
      {links.map((l) => {
        const base = l.match ?? l.href;
        const active = l.exact ? path === base : path === base || path.startsWith(base + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active ? "bg-white/15 text-white ring-1 ring-inset ring-white/20" : "text-blue-100/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
