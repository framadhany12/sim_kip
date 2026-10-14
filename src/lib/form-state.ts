export type FormState =
  | {
      ok?: boolean;
      message?: string;
      errors?: Record<string, string>;
      /** Nilai yang dikirim, dipakai mengisi ulang formulir saat validasi gagal. */
      values?: Record<string, string>;
    }
  | undefined;

export type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;

export function nilaiForm(fd: FormData) {
  const values: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") values[k] = v.trim();
  return values;
}
