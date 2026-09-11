"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { restablecerPassword } from "@/actions/auth";

export default function ResetPasswordPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">🔑</span>
          <h1 className="text-lg font-bold">Recuperar contraseña</h1>
          <p className="text-sm text-[var(--muted)]">Escribe tu celular para poner una contraseña nueva.</p>
        </div>

        {exito ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-emerald-400">✅ Tu contraseña fue actualizada.</p>
            <Link
              href="/login"
              className="rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const resultado = await restablecerPassword(fd);
                if (resultado?.error) {
                  setError(resultado.error);
                } else {
                  setExito(true);
                }
              });
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Celular</label>
              <input
                name="celular"
                placeholder="999999999"
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Nueva contraseña</label>
              <input
                name="nuevaPassword"
                type="password"
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
            >
              {pending ? "Guardando…" : "Restablecer contraseña"}
            </button>

            <Link
              href="/login"
              className="text-center text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Volver a iniciar sesión
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
