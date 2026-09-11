"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registrarJugador } from "@/actions/auth";
import { POSICIONES_SUGERIDAS } from "@/lib/estilos";

export default function RegistroPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Pichangas de Barrio FC" className="h-16 w-16 rounded-xl object-cover" />
          <h1 className="text-lg font-bold">Crear cuenta de jugador</h1>
          <p className="text-sm text-[var(--muted)]">Únete al club para inscribirte a las pichangas.</p>
        </div>

        <datalist id="posiciones-sugeridas">
          {POSICIONES_SUGERIDAS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>

        <form
          action={(fd) => {
            setError(null);
            if (fd.get("password") !== confirmar) {
              setError("Las contraseñas no coinciden.");
              return;
            }
            startTransition(async () => {
              const resultado = await registrarJugador(fd);
              if (resultado?.error) setError(resultado.error);
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Nombres</label>
              <input
                name="nombres"
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Apellidos</label>
              <input
                name="apellidos"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

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
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Posición (opcional)</label>
            <input
              name="posicion"
              list="posiciones-sugeridas"
              placeholder="Ej: Volante, Cualquiera"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Confirmar contraseña</label>
            <input
              type="password"
              required
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
          >
            {pending ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-4 block text-center text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </div>
    </main>
  );
}
