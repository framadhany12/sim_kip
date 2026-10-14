"use client";

import { useState } from "react";
import { Field, FieldShell, inputCls, useFormErrors } from "./form";

type Sumber = { id: string; nama: string; butuhKontak: boolean };

export function RekomendasiFields({
  sumber,
  defaultSumber,
  defaultNama,
  defaultTelepon,
}: {
  sumber: Sumber[];
  defaultSumber?: string;
  defaultNama?: string | null;
  defaultTelepon?: string | null;
}) {
  const state = useFormErrors();
  const [pilih, setPilih] = useState(state?.values?.sumberId ?? defaultSumber ?? "");
  const terpilih = sumber.find((s) => s.id === pilih);
  const wajibKontak = terpilih?.butuhKontak ?? true;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FieldShell
        name="sumberId"
        label="Rekomendasi dari"
        required
        error={state?.errors?.sumberId}
        hint="Dari mana Anda mendapat informasi atau rekomendasi untuk mendaftar di Politeknik TEDC?"
        className="sm:col-span-2"
      >
        <select id="sumberId" name="sumberId" value={pilih} onChange={(e) => setPilih(e.target.value)} aria-invalid={!!state?.errors?.sumberId} className={inputCls}>
          <option value="">— Pilih —</option>
          {sumber.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
      </FieldShell>
      <Field
        name="namaPerekomendasi"
        label="Nama perekomendasi"
        required={wajibKontak}
        defaultValue={defaultNama}
        hint={wajibKontak ? "Nama lengkap orang yang merekomendasikan." : "Boleh dikosongkan. Bisa diisi nama akun media sosial."}
        contoh={wajibKontak ? "Budi Santoso" : "@poltektedc"}
      />
      <Field
        name="teleponPerekomendasi"
        label="Nomor HP perekomendasi"
        required={wajibKontak}
        inputMode="tel"
        defaultValue={defaultTelepon}
        hint={wajibKontak ? "Nomor HP/WhatsApp aktif perekomendasi." : "Boleh dikosongkan."}
        contoh="081234567890"
      />
    </div>
  );
}
