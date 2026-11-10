"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, Clock3, UsersRound, XCircle, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import type { StatistikPendaftar } from "@/lib/statistik-pendaftar";

// Palet sama dengan dashboard admin agar konsisten.
const WARNA = { proses: "#2a78d6", diterima: "#0ca30c", ditolak: "#d03b3b", p1: "#2a78d6", p2: "#eb6834", grid: "#e1e0d9", muted: "#898781" };
const fmt = new Intl.NumberFormat("id-ID");
const sumbu = { fontSize: 12, fill: WARNA.muted };

function Kpi({ label, nilai, ikon: Ikon, warna }: { label: string; nilai: number; ikon: LucideIcon; warna: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: `${warna}1a`, color: warna }}>
        <Ikon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-slate-900">{fmt.format(nilai)}</p>
      </div>
    </div>
  );
}

function TooltipIsi({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string; payload?: { nama?: string } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-900">{label ?? payload[0].payload?.nama}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-slate-600">
          <span className="size-2 rounded-sm" style={{ background: p.color }} aria-hidden />
          {p.name}: <b className="tabular-nums text-slate-900">{fmt.format(p.value ?? 0)}</b>
        </p>
      ))}
    </div>
  );
}

/** Ringkasan pendaftar tahun berjalan: jumlah, hasil seleksi, dan peminat tiap jurusan. */
export function StatistikSeleksi({ s }: { s: StatistikPendaftar }) {
  const hasil = [
    { nama: "Diterima", n: s.diterima, warna: WARNA.diterima },
    { nama: "Tidak diterima", n: s.ditolak, warna: WARNA.ditolak },
    { nama: "Dalam proses", n: s.proses, warna: WARNA.proses },
  ];
  const ada = s.total > 0;
  const jurusan = s.jurusan;
  const tinggi = Math.max(220, jurusan.length * 64);

  return (
    <section aria-labelledby="judul-statistik" className="space-y-4">
      <div>
        <h2 id="judul-statistik" className="text-lg font-bold text-slate-900">
          Statistik pendaftar KIP Kuliah {s.tahun}
        </h2>
        <p className="text-sm text-slate-600">Gambaran seluruh pendaftar yang sudah mengirim formulir. Data bersifat ringkasan dan tidak memuat identitas siapa pun.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total pendaftar" nilai={s.total} ikon={UsersRound} warna="#0d2a63" />
        <Kpi label="Diterima" nilai={s.diterima} ikon={CheckCircle2} warna={WARNA.diterima} />
        <Kpi label="Tidak diterima" nilai={s.ditolak} ikon={XCircle} warna={WARNA.ditolak} />
        <Kpi label="Dalam proses" nilai={s.proses} ikon={Clock3} warna={WARNA.proses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card title="Hasil seleksi">
          {!ada ? (
            <p className="py-10 text-center text-sm text-slate-500">Belum ada pendaftar yang mengirim formulir.</p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative size-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={hasil} dataKey="n" nameKey="nama" innerRadius={58} outerRadius={86} paddingAngle={2} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
                      {hasil.map((x) => (
                        <Cell key={x.nama} fill={x.warna} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipIsi />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{fmt.format(s.total)}</p>
                    <p className="text-xs text-slate-500">pendaftar</p>
                  </div>
                </div>
              </div>
              <ul className="w-full space-y-2 text-sm">
                {hasil.map((x) => (
                  <li key={x.nama} className="flex items-center gap-2.5">
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ background: x.warna }} aria-hidden />
                    <span className="flex-1 text-slate-600">{x.nama}</span>
                    <b className="tabular-nums text-slate-900">{fmt.format(x.n)}</b>
                    <span className="w-10 text-right text-xs tabular-nums text-slate-500">{Math.round((x.n / s.total) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card title="Pendaftar tiap jurusan">
          {jurusan.length === 0 || !ada ? (
            <p className="py-10 text-center text-sm text-slate-500">Belum ada data pendaftar per jurusan.</p>
          ) : (
            <>
              <div style={{ height: tinggi }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jurusan} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
                    <CartesianGrid horizontal={false} stroke={WARNA.grid} />
                    <XAxis type="number" allowDecimals={false} tick={sumbu} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nama" width={150} tick={{ ...sumbu, fill: "#52514e" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(42,120,214,0.06)" }} content={<TooltipIsi />} />
                    <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="p1" name="Pilihan 1" fill={WARNA.p1} maxBarSize={16} radius={[0, 4, 4, 0]} animationDuration={500} />
                    <Bar dataKey="p2" name="Pilihan 2" fill={WARNA.p2} maxBarSize={16} radius={[0, 4, 4, 0]} animationDuration={500} />
                    <Bar dataKey="diterima" name="Diterima" fill={WARNA.diterima} maxBarSize={16} radius={[0, 4, 4, 0]} animationDuration={500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium text-blue-700">Lihat dalam bentuk tabel</summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="py-2 pr-3 font-semibold">Jurusan</th>
                        <th className="px-3 py-2 text-right font-semibold">Pilihan 1</th>
                        <th className="px-3 py-2 text-right font-semibold">Pilihan 2</th>
                        <th className="py-2 pl-3 text-right font-semibold">Diterima</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jurusan.map((j) => (
                        <tr key={j.nama}>
                          <td className="py-2 pr-3 text-slate-800">{j.nama}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt.format(j.p1)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt.format(j.p2)}</td>
                          <td className="py-2 pl-3 text-right tabular-nums">{fmt.format(j.diterima)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}
