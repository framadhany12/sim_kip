import Link from "next/link";
import type { ReactNode } from "react";
import type { Status } from "@/db/schema";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/constants";

export function Card({ children, className = "", title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, desc, action }: { title: string; desc?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-[15px] text-slate-600">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

const ALERT = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};
const ALERT_ICON = { info: "ℹ", success: "✓", warning: "!", error: "✕" };

export function Alert({ tone = "info", title, children }: { tone?: keyof typeof ALERT; title?: string; children?: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${ALERT[tone]}`}>
      <span aria-hidden className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-current/10 text-xs font-bold">
        {ALERT_ICON[tone]}
      </span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_TONE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const cls =
    variant === "primary"
      ? "bg-blue-700 text-white hover:bg-blue-800"
      : "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50";
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition ${cls}`}>
      {children}
    </Link>
  );
}

export function Dl({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
          <dd className="mt-0.5 break-words text-[15px] text-slate-900">{v || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}
