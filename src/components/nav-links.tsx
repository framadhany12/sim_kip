"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string; match?: string; exact?: boolean }[] }) {
  const path = usePathname();
  return (
    <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
      {links.map((l) => {
        const base = l.match ?? l.href;
        const active = l.exact ? path === base : path === base || path.startsWith(base + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
