"use client";

import { useState, useTransition } from "react";
import { activarMiPerfil } from "@/actions/jugadores";

const POSICIONES = ["Arquero", "Defensa", "Mediocampo", "Delantero", "Cualquiera"];

export function ActivarPerfilForm({ usuarioId }: { usuarioId: number }) {
  const [apodo, setApodo] = useState("");
  const [posicion, setPosicion] = useState(POSICIONES[4]);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => activarMiPerfil(usuarioId, apodo, posicion));
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
          {POSICIONES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)]"
      >
        🎽 Activar mi perfil de jugador
      </button>
    </form>
  );
}
