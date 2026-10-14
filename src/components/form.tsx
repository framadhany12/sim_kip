"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import type { FormAction, FormState } from "@/lib/form-state";
import { inputCls } from "@/lib/styles";
import { Alert } from "./ui";

const Ctx = createContext<FormState>(undefined);

export function ActionForm({
  action,
  children,
  className = "space-y-5",
  disabled,
  resetOnSuccess,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);
  // Dipanggil manual (bukan lewat prop `action`) agar React tidak me-reset isian saat validasi gagal.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => formAction(fd));
  }
  return (
    <Ctx.Provider value={state}>
      <PendingCtx.Provider value={pending}>
        <form ref={ref} onSubmit={onSubmit} className="space-y-5" noValidate>
          {state?.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
          {/* Tata letak (jarak/grid) diterapkan di fieldset karena dialah induk langsung kolom-kolom formulir. */}
          <fieldset disabled={disabled} className={`m-0 min-w-0 border-0 p-0 ${className}`}>
            {children}
          </fieldset>
        </form>
      </PendingCtx.Provider>
    </Ctx.Provider>
  );
}

const PendingCtx = createContext(false);

export { inputCls };

type Common = { name: string; label: string; hint?: string; contoh?: string; required?: boolean; className?: string };

function useField(name: string, defaultValue?: string | number | null) {
  const s = useContext(Ctx);
  return {
    value: s?.values?.[name] ?? (defaultValue == null ? "" : String(defaultValue)),
    error: s?.errors?.[name],
  };
}

export function FieldShell({ name, label, hint, contoh, required, error, children, className }: Common & { error?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-800">
        {label} {required ? <span className="text-rose-600">*</span> : <span className="font-normal text-slate-500">(opsional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${name}-err`} className="mt-1.5 text-sm text-rose-700">
          {error}
        </p>
      ) : (
        (hint || contoh) && (
          <p className="mt-1.5 text-[13px] leading-snug text-slate-500">
            {hint}
            {contoh && (
              <>
                {hint && " "}
                <span className="text-slate-600">
                  Contoh: <span className="font-mono text-[12px] text-slate-700">{contoh}</span>
                </span>
              </>
            )}
          </p>
        )
      )}
    </div>
  );
}

export function Field({
  defaultValue,
  type = "text",
  inputMode,
  placeholder,
  maxLength,
  autoComplete,
  ...c
}: Common & {
  defaultValue?: string | number | null;
  type?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
}) {
  const f = useField(c.name, defaultValue);
  return (
    <FieldShell {...c} error={f.error}>
      <input
        id={c.name}
        name={c.name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        defaultValue={f.value}
        aria-invalid={!!f.error}
        aria-describedby={f.error ? `${c.name}-err` : undefined}
        className={inputCls}
      />
    </FieldShell>
  );
}

export function TextArea({ defaultValue, rows = 3, ...c }: Common & { defaultValue?: string | null; rows?: number }) {
  const f = useField(c.name, defaultValue);
  return (
    <FieldShell {...c} error={f.error}>
      <textarea id={c.name} name={c.name} rows={rows} defaultValue={f.value} aria-invalid={!!f.error} className={inputCls} />
    </FieldShell>
  );
}

export function Select({
  defaultValue,
  options,
  placeholder = "— Pilih —",
  ...c
}: Common & { defaultValue?: string | number | null; options: { value: string; label: string }[]; placeholder?: string }) {
  const f = useField(c.name, defaultValue);
  return (
    <FieldShell {...c} error={f.error}>
      <select id={c.name} name={c.name} defaultValue={f.value} aria-invalid={!!f.error} className={inputCls}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function Checkbox({ name, children }: { name: string; children: ReactNode }) {
  const error = useContext(Ctx)?.errors?.[name];
  return (
    <div>
      <label className="flex items-start gap-3 py-1 text-[15px] leading-snug text-slate-700">
        <input type="checkbox" name={name} className="mt-0.5 size-5 shrink-0 accent-blue-700" />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1.5 pl-8 text-sm text-rose-700">{error}</p>}
    </div>
  );
}

export function useFormErrors() {
  return useContext(Ctx);
}

export function SubmitButton({ children, variant = "primary", name, value, className = "" }: { children: ReactNode; variant?: "primary" | "danger" | "secondary" | "success"; name?: string; value?: string; className?: string }) {
  const pending = useContext(PendingCtx);
  const styles = {
    primary: "bg-blue-700 text-white hover:bg-blue-800",
    success: "bg-emerald-700 text-white hover:bg-emerald-800",
    danger: "bg-rose-700 text-white hover:bg-rose-800",
    secondary: "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50",
  }[variant];
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 min-h-11 text-[15px] font-semibold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {pending ? "Memproses…" : children}
    </button>
  );
}
