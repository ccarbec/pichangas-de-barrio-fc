"use client";

import { useState, useTransition } from "react";
import {
  crearJugadorManual,
  actualizarJugador,
  cambiarEstadoJugador,
  eliminarJugador,
  subirFotoJugador,
} from "@/actions/jugadores";
import { Badge } from "../../components/Badge";
import { nombreCompleto, POSICIONES_SUGERIDAS } from "@/lib/estilos";

type Jugador = {
  id: number;
  usuarioId: number;
  nombre: string;
  apellidos: string;
  apodo: string | null;
  posicion: string | null;
  equipoHincha: string;
  camiseta: string;
  telefono: string;
  rol: string;
  estado: string;
  foto: string | null;
  tieneHistorial: boolean;
};

export function MiembrosCrud({ jugadores }: { jugadores: Jugador[] }) {
  const [tab, setTab] = useState<"lista" | "agregar">("lista");
  const [seleccionId, setSeleccionId] = useState<number | null>(jugadores[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const seleccionado = jugadores.find((j) => j.id === seleccionId) ?? null;

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <datalist id="posiciones-sugeridas">
        {POSICIONES_SUGERIDAS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Gestión Miembros</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("lista")}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === "lista" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]"}`}
          >
            Lista
          </button>
          <button
            onClick={() => setTab("agregar")}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === "agregar" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]"}`}
          >
            ➕ Agregar
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {tab === "agregar" ? (
        <form
          action={async (formData) => {
            setError(null);
            try {
              await crearJugadorManual(formData);
              setTab("lista");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error");
            }
          }}
          className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-2"
        >
          <Campo label="Nombres"><input name="nombres" required className={inputClass} /></Campo>
          <Campo label="Apellidos"><input name="apellidos" className={inputClass} /></Campo>
          <Campo label="Apodo"><input name="apodo" className={inputClass} /></Campo>
          <Campo label="Celular"><input name="telefono" required className={inputClass} /></Campo>
          <Campo label="Posición">
            <input name="posicion" list="posiciones-sugeridas" placeholder="Ej: Volante, Cualquiera" className={inputClass} />
          </Campo>
          <Campo label="Contraseña inicial"><input name="password" type="password" required className={inputClass} /></Campo>
          <Campo label="Hincha de qué equipo"><input name="equipoHincha" className={inputClass} /></Campo>
          <Campo label="Camiseta"><input name="camiseta" className={inputClass} /></Campo>
          <button type="submit" className="col-span-full mt-2 self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)]">
            Guardar jugador
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="p-3">Jugador</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map((j) => (
                  <tr
                    key={j.id}
                    onClick={() => setSeleccionId(j.id)}
                    className={`cursor-pointer border-b border-[var(--border)]/50 last:border-0 ${seleccionId === j.id ? "bg-[var(--surface-hover)]" : ""}`}
                  >
                    <td className="p-3 font-medium whitespace-nowrap">
                      {nombreCompleto({ apellidos: j.apellidos, apodo: j.apodo, usuario: { nombre: j.nombre } })}
                    </td>
                    <td className="p-3"><Badge variant="role">{j.rol.toUpperCase()}</Badge></td>
                    <td className="p-3">
                      <Badge variant={j.estado === "activo" ? "active" : "danger"}>{j.estado.toUpperCase()}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {seleccionado && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                {seleccionado.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={seleccionado.foto} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[var(--background)]" />
                )}
                <form
                  action={(fd) => run(() => subirFotoJugador(fd))}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="jugadorId" value={seleccionado.id} />
                  <input type="file" name="foto" accept="image/png,image/jpeg" className="text-xs" />
                  <button type="submit" className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs">
                    Subir foto
                  </button>
                </form>
              </div>

              <form
                key={seleccionado.id}
                action={(fd) => run(() => actualizarJugador(fd))}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="jugadorId" value={seleccionado.id} />
                <Campo label="Nombres"><input name="nombres" defaultValue={seleccionado.nombre} className={inputClass} /></Campo>
                <Campo label="Apellidos"><input name="apellidos" defaultValue={seleccionado.apellidos} className={inputClass} /></Campo>
                <Campo label="Apodo"><input name="apodo" defaultValue={seleccionado.apodo ?? ""} className={inputClass} /></Campo>
                <Campo label="Posición">
                  <input
                    name="posicion"
                    list="posiciones-sugeridas"
                    defaultValue={seleccionado.posicion ?? ""}
                    className={inputClass}
                  />
                </Campo>
                <Campo label="Hincha de qué equipo"><input name="equipoHincha" defaultValue={seleccionado.equipoHincha} className={inputClass} /></Campo>
                <Campo label="Camiseta"><input name="camiseta" defaultValue={seleccionado.camiseta} className={inputClass} /></Campo>
                <Campo label="Rol">
                  <select name="rol" defaultValue={seleccionado.rol} className={inputClass}>
                    <option value="jugador">jugador</option>
                    <option value="admin">admin</option>
                  </select>
                </Campo>
                <Campo label="Nueva contraseña (opcional)"><input name="nuevaPassword" type="password" className={inputClass} /></Campo>

                <div className="col-span-full flex items-center gap-2">
                  <button type="submit" disabled={pending} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)]">
                    💾 Guardar cambios
                  </button>
                  {seleccionado.estado === "activo" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => cambiarEstadoJugador(seleccionado.id, false))}
                      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
                    >
                      🚫 Inactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => cambiarEstadoJugador(seleccionado.id, true))}
                      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
                    >
                      ♻️ Reactivar
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-[var(--muted)]">
                  🗑️ Zona de eliminación permanente
                </p>
                {seleccionado.tieneHistorial ? (
                  <p className="text-xs text-[var(--muted)]">
                    Este jugador ya tiene partidos registrados — usa &quot;Inactivar&quot; para no perder ese historial.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <input type="checkbox" checked={confirmarEliminar} onChange={(e) => setConfirmarEliminar(e.target.checked)} />
                      Confirmo que quiero eliminarlo permanentemente
                    </label>
                    <button
                      disabled={!confirmarEliminar || pending}
                      onClick={() => run(() => eliminarJugador(seleccionado.id))}
                      className="rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs whitespace-nowrap text-[var(--danger)] disabled:opacity-40"
                    >
                      Eliminar definitivamente
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-[var(--muted)]">{label}</label>
      {children}
    </div>
  );
}
