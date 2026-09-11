"use client";

import { useTransition } from "react";
import { actualizarMiPerfil, subirFotoJugador } from "@/actions/jugadores";
import { POSICIONES_SUGERIDAS } from "@/lib/estilos";

type Jugador = {
  id: number;
  apodo: string | null;
  posicion: string | null;
  equipoHincha: string;
  camiseta: string;
  resena: string;
  foto: string | null;
};

export function PerfilForm({ jugador }: { jugador: Jugador }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex flex-col items-center gap-3">
        {jugador.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={jugador.foto} alt="" className="h-40 w-40 rounded-xl object-cover" />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-[var(--surface)] text-xs text-[var(--muted)]">
            Sin foto
          </div>
        )}
        <form action={(fd) => startTransition(() => subirFotoJugador(fd))} className="flex flex-col items-center gap-2">
          <input type="hidden" name="jugadorId" value={jugador.id} />
          <input type="file" name="foto" accept="image/png,image/jpeg" className="text-xs" />
          <button type="submit" disabled={pending} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs">
            Guardar foto
          </button>
        </form>
      </div>

      <form
        action={(fd) => startTransition(() => actualizarMiPerfil(fd))}
        className="flex flex-1 flex-col gap-3"
      >
        <input type="hidden" name="jugadorId" value={jugador.id} />
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Apodo</label>
          <input name="apodo" defaultValue={jugador.apodo ?? ""} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Posición</label>
          <datalist id="posiciones-sugeridas">
            {POSICIONES_SUGERIDAS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <input
            name="posicion"
            list="posiciones-sugeridas"
            defaultValue={jugador.posicion ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Hincha de qué equipo</label>
          <input name="equipoHincha" defaultValue={jugador.equipoHincha} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Camiseta que usas</label>
          <input name="camiseta" defaultValue={jugador.camiseta} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Reseña — cuéntanos algo sobre ti</label>
          <textarea
            name="resena"
            defaultValue={jugador.resena}
            rows={3}
            placeholder="Ej: Juego hace 10 años, me gusta la pizza post-partido y nunca fallo un penal 😄"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-1 self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)]"
        >
          💾 Guardar cambios
        </button>
      </form>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm";
