"use client";

import { useState, useTransition } from "react";
import { activarMiPerfil } from "@/actions/jugadores";
import { POSICIONES_SUGERIDAS } from "@/lib/estilos";

export function ActivarPerfilForm() {
  const [apodo, setApodo] = useState("");
  const [posicion, setPosicion] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => activarMiPerfil(apodo, posicion));
      }}
      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">Apodo</label>
        <input
          value={apodo}
          onChange={(e) => setApodo(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">Posición</label>
        <select
          value={posicion}
          onChange={(e) => setPosicion(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        >
          <option value="">Sin definir</option>
          {POSICIONES_SUGERIDAS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
      >
        🎽 Activar mi perfil de jugador
      </button>
    </form>
  );
}
