"use client";

import { useState, useTransition } from "react";
import { crearPartido } from "@/actions/partidos";
import { Toast } from "../../components/Toast";

type Estadio = {
  id: number;
  nombre: string;
  costoCancha: number;
  costoPorJugador: number;
};

export function NuevoPartidoForm({ estadios }: { estadios: Estadio[] }) {
  const [abierto, setAbierto] = useState(false);
  const [estadioId, setEstadioId] = useState<string>(estadios[0]?.id.toString() ?? "otro");
  const estadio = estadios.find((e) => e.id.toString() === estadioId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full px-5 py-3 text-left text-sm font-semibold"
      >
        ➕ Programar nueva pichanga
      </button>
      {abierto && (
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              try {
                await crearPartido(formData);
                setAbierto(false);
                setToast("Pichanga programada correctamente.");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Error al programar la pichanga.");
              }
            });
          }}
          className="flex flex-col gap-3 border-t border-[var(--border)] p-5"
        >
          {estadios.length > 0 && (
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Zona / estadio</label>
              <select
                value={estadioId}
                onChange={(e) => setEstadioId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                {estadios.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
                <option value="otro">✍️ Otro (escribir manualmente)</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Fecha</label>
              <input
                type="date"
                name="fecha"
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Hora</label>
              <input
                type="time"
                name="hora"
                defaultValue="19:00"
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          {!estadio && (
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Cancha / lugar</label>
              <input
                name="cancha"
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
          )}
          {estadio && <input type="hidden" name="cancha" value={estadio.nombre} />}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Cupo máximo</label>
              <input
                type="number"
                name="cupoMax"
                min={2}
                max={40}
                defaultValue={14}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Costo cancha (S/)</label>
              <input
                type="number"
                name="costoCancha"
                step="0.5"
                min={0}
                defaultValue={estadio?.costoCancha ?? 120}
                key={`cc-${estadioId}`}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Costo por jugador (S/)</label>
              <input
                type="number"
                name="costoPorJugador"
                step="0.5"
                min={0}
                defaultValue={estadio?.costoPorJugador ?? 10}
                key={`cj-${estadioId}`}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Notas (opcional)</label>
            <textarea
              name="notas"
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
          >
            {pending ? "Guardando…" : "Programar pichanga"}
          </button>
        </form>
      )}
    </div>
  );
}
