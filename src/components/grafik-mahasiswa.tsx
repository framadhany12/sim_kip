"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StatusMahasiswa } from "@/db/schema";
import type { BarisKelompok, JumlahStatus } from "@/lib/statistik-mahasiswa";

// Warna status mengikuti palet grafik dashboard admin.
const SERI: { key: StatusMahasiswa; nama: string; warna: string }[] = [
  { key: "aktif", nama: "Aktif", warna: "#1baf7a" },
  { key: "lulus", nama: "Lulus", warna: "#2a78d6" },
  { key: "tidak_aktif", nama: "Tidak aktif", warna: "#ec835a" },
  { key: "dicabut", nama: "Dicabut KIP-K", warna: "#d03b3b" },
];
const C = { grid: "#e1e0d9", muted: "#898781", ink2: "#52514e", netral: "#c3c2b7" };
const sumbu = { fontSize: 12, fill: C.muted } as const;
const fmt = new Intl.NumberFormat("id-ID");

type EntriTooltip = { dataKey?: unknown; value?: unknown; name?: unknown; color?: string; payload?: { fill?: unknown } };
type PropsTooltip = { active?: boolean; payload?: readonly EntriTooltip[]; label?: unknown };
const tt = (p: PropsTooltip) => ({ active: p.active, payload: p.payload, label: p.label });

function TooltipIsi({ active, payload, label }: PropsTooltip) {
  if (!active || !payload?.length) return null;
  const isi = payload.filter((p) => Number(p.value) > 0);
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label != null && <p className="mb-1 font-medium text-slate-500">{String(label)}</p>}
      <ul className="space-y-0.5">
        {(isi.length ? isi : payload).map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: (p.payload?.fill as string) ?? p.color }} aria-hidden />
            <b className="text-sm tabular-nums text-slate-900">{fmt.format(Number(p.value))}</b>
            <span className="text-slate-500">{String(p.name ?? "")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legenda() {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {SERI.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ background: s.warna }} />
          {s.nama}
        </li>
      ))}
    </ul>
  );
}

function Panel({ judul, sub, children, className = "" }: { judul: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`} aria-label={judul}>
      <h3 className="text-[15px] font-semibold text-slate-900">{judul}</h3>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Grafik jumlah mahasiswa KIP-K: komposisi status, per angkatan, dan per program studi. */
export function GrafikMahasiswa({ total, angkatan, jurusan }: { total: JumlahStatus; angkatan: BarisKelompok[]; jurusan: BarisKelompok[] }) {
  const komposisi = SERI.map((s) => ({ nama: s.nama, n: total[s.key], warna: s.warna })).filter((x) => x.n > 0);
  const tinggiProdi = Math.max(140, jurusan.length * 38 + 20);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <Panel judul="Komposisi status" sub="Seluruh mahasiswa penerima KIP-K">
        {total.total === 0 ? (
          <p className="text-sm text-slate-500">Belum ada mahasiswa.</p>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="relative size-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={komposisi} dataKey="n" nameKey="nama" innerRadius={58} outerRadius={86} paddingAngle={komposisi.length > 1 ? 2 : 0} stroke="#fff" strokeWidth={2}>
                    {komposisi.map((x) => (
                      <Cell key={x.nama} fill={x.warna} />
                    ))}
                  </Pie>
                  <Tooltip content={(p) => <TooltipIsi {...tt(p)} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">{fmt.format(total.total)}</p>
                  <p className="text-[11px] text-slate-500">mahasiswa</p>
                </div>
              </div>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {SERI.map((s) => (
                <li key={s.key} className="flex items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.warna }} aria-hidden />
                  <span className="flex-1 text-slate-600">{s.nama}</span>
                  <b className="tabular-nums text-slate-900">{fmt.format(total[s.key])}</b>
                  <span className="w-10 text-right text-xs tabular-nums text-slate-500">{total.total ? Math.round((total[s.key] / total.total) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel judul="Mahasiswa per angkatan" sub="Jumlah tiap status mahasiswa">
        {angkatan.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada mahasiswa.</p>
        ) : (
          <>
            <Legenda />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={angkatan} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke={C.grid} />
                  <XAxis dataKey="label" tick={{ ...sumbu, fill: C.ink2 }} axisLine={{ stroke: C.netral }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={sumbu} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(42,120,214,0.06)" }} content={(p) => <TooltipIsi {...tt(p)} />} />
                  {SERI.map((s, i) => (
                    <Bar key={s.key} dataKey={s.key} name={s.nama} stackId="status" fill={s.warna} maxBarSize={48} radius={i === SERI.length - 1 ? [4, 4, 0, 0] : 0} animationDuration={500} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Panel>

      <Panel judul="Mahasiswa per program studi" sub="Jumlah tiap status mahasiswa" className="xl:col-span-2">
        {jurusan.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada mahasiswa.</p>
        ) : (
          <>
            <Legenda />
            <div style={{ height: tinggiProdi }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jurusan} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap="28%">
                  <CartesianGrid horizontal={false} stroke={C.grid} />
                  <XAxis type="number" allowDecimals={false} tick={sumbu} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" width={170} tick={{ ...sumbu, fill: C.ink2 }} axisLine={{ stroke: C.netral }} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(42,120,214,0.06)" }} content={(p) => <TooltipIsi {...tt(p)} />} />
                  {SERI.map((s, i) => (
                    <Bar key={s.key} dataKey={s.key} name={s.nama} stackId="status" fill={s.warna} maxBarSize={22} radius={i === SERI.length - 1 ? [0, 4, 4, 0] : 0} animationDuration={500} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
