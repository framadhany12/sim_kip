"use client";

import { useEffect, useMemo, useState } from "react";
import { FieldShell, inputCls, useFormErrors } from "./form";

type Kab = { id: string; nama: string; provinsi: string };

/** Dropdown bertingkat: Provinsi → Kabupaten/Kota → Kecamatan (dari dataset wilayah resmi). */
export function WilayahSelect({ kabupaten, defaultKab, defaultKec }: { kabupaten: Kab[]; defaultKab?: string; defaultKec?: string }) {
  const errors = useFormErrors()?.errors;
  const provinsiList = useMemo(() => [...new Set(kabupaten.map((k) => k.provinsi))].sort(), [kabupaten]);
  const [prov, setProv] = useState(() => kabupaten.find((k) => k.id === defaultKab)?.provinsi ?? "");
  const [kab, setKab] = useState(defaultKab ?? "");
  const [kec, setKec] = useState(defaultKec ?? "");
  const [kecList, setKecList] = useState<{ id: string; nama: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!kab) return setKecList([]);
    let batal = false;
    setLoading(true);
    fetch(`/api/wilayah/kecamatan?kab=${encodeURIComponent(kab)}`)
      .then((r) => r.json())
      .then((rows) => !batal && setKecList(rows))
      .finally(() => !batal && setLoading(false));
    return () => {
      batal = true;
    };
  }, [kab]);

  return (
    <>
      <FieldShell name="provinsi" label="Provinsi" required hint="Pilih provinsi dulu agar daftar kabupaten/kota lebih singkat.">
        <select
          id="provinsi"
          className={inputCls}
          value={prov}
          onChange={(e) => {
            setProv(e.target.value);
            setKab("");
            setKec("");
          }}
        >
          <option value="">— Pilih provinsi —</option>
          {provinsiList.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </FieldShell>
      <FieldShell name="kabupatenId" label="Kabupaten/Kota" required error={errors?.kabupatenId} hint="Sesuai alamat di Kartu Keluarga.">
        <select
          id="kabupatenId"
          name="kabupatenId"
          className={inputCls}
          value={kab}
          disabled={!prov}
          aria-invalid={!!errors?.kabupatenId}
          onChange={(e) => {
            setKab(e.target.value);
            setKec("");
          }}
        >
          <option value="">{prov ? "— Pilih kabupaten/kota —" : "Pilih provinsi terlebih dahulu"}</option>
          {kabupaten
            .filter((k) => k.provinsi === prov)
            .map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
        </select>
      </FieldShell>
      <FieldShell name="kecamatanId" label="Kecamatan" required error={errors?.kecamatanId}>
        <select
          id="kecamatanId"
          name="kecamatanId"
          className={inputCls}
          value={kec}
          disabled={!kab || loading}
          aria-invalid={!!errors?.kecamatanId}
          onChange={(e) => setKec(e.target.value)}
        >
          <option value="">{loading ? "Memuat…" : kab ? "— Pilih kecamatan —" : "Pilih kabupaten/kota terlebih dahulu"}</option>
          {kecList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
      </FieldShell>
    </>
  );
}
