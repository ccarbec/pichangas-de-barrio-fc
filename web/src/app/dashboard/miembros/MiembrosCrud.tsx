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
import { Toast } from "../../components/Toast";
import { Estrellas } from "../../components/Estrellas";
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
  statVelocidad: number;
  statTecnica: number;
  statDefensa: number;
  statFisico: number;
};

export function MiembrosCrud({ jugadores }: { jugadores: Jugador[] }) {
  const [tab, setTab] = useState<"lista" | "agregar">("lista");
  const [seleccionId, setSeleccionId] = useState<number | null>(jugadores[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const seleccionado = jugadores.find((j) => j.id === seleccionId) ?? null;

  const terminoBusqueda = busqueda.trim().toLowerCase();
  const jugadoresFiltrados = terminoBusqueda
    ? jugadores.filter((j) =>
        [j.nombre, j.apellidos, j.apodo ?? "", j.telefono]
          .join(" ")
          .toLowerCase()
          .includes(terminoBusqueda)
      )
    : jugadores;

  function run(fn: () => Promise<unknown>, mensajeExito?: string) {
    startTransition(async () => {
      setError(null);
      try {
        const resultado = await fn();
        if (resultado && typeof resultado === "object" && "error" in resultado && resultado.error) {
          setError(String(resultado.error));
        } else if (mensajeExito) {
          setToast(mensajeExito);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
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
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${tab === "lista" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
          >
            Lista
          </button>
          <button
            onClick={() => setTab("agregar")}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${tab === "agregar" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
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
            const resultado = await crearJugadorManual(formData);
            if (resultado?.error) {
              setError(resultado.error);
            } else {
              setTab("lista");
              setToast("Jugador agregado correctamente.");
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
          <button type="submit" className="col-span-full mt-2 self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90">
            Guardar jugador
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-3">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="🔍 Buscar por nombre, apodo o celular…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
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
                  {jugadoresFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-[var(--muted)]">
                        Ningún jugador coincide con &quot;{busqueda}&quot;.
                      </td>
                    </tr>
                  )}
                  {jugadoresFiltrados.map((j) => (
                  <tr
                    key={j.id}
                    onClick={() => {
                      setSeleccionId(j.id);
                      setConfirmarEliminar(false);
                    }}
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
                  action={(fd) => run(() => subirFotoJugador(fd), "Foto actualizada.")}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="jugadorId" value={seleccionado.id} />
                  <input type="file" name="foto" accept="image/*" className="text-xs" />
                  <button type="submit" className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs transition-colors hover:border-[var(--accent)]">
                    Subir foto
                  </button>
                </form>
              </div>

              <form
                key={seleccionado.id}
                action={(fd) => run(() => actualizarJugador(fd), "Datos actualizados.")}
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

                <div className="col-span-full">
                  <p className="mb-2 text-xs font-semibold uppercase text-[var(--muted)]">
                    ⚖️ Estadísticas (para armar equipos parejos)
                  </p>
                  <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] p-3">
                    <CampoEstrellas label="Velocidad" name="statVelocidad" valorInicial={seleccionado.statVelocidad} />
                    <CampoEstrellas label="Técnica" name="statTecnica" valorInicial={seleccionado.statTecnica} />
                    <CampoEstrellas label="Defensa" name="statDefensa" valorInicial={seleccionado.statDefensa} />
                    <CampoEstrellas label="Físico" name="statFisico" valorInicial={seleccionado.statFisico} />
                  </div>
                </div>

                <div className="col-span-full flex items-center gap-2">
                  <button type="submit" disabled={pending} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:hover:opacity-100">
                    💾 Guardar cambios
                  </button>
                  {seleccionado.estado === "activo" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => cambiarEstadoJugador(seleccionado.id, false), "Jugador inactivado.")}
                      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition-colors hover:border-[var(--accent)]"
                    >
                      🚫 Inactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => cambiarEstadoJugador(seleccionado.id, true), "Jugador reactivado.")}
                      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition-colors hover:border-[var(--accent)]"
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
                      onClick={() => run(() => eliminarJugador(seleccionado.id), "Jugador eliminado.")}
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

function CampoEstrellas({ label, name, valorInicial }: { label: string; name: string; valorInicial: number }) {
  const [valor, setValor] = useState(valorInicial);
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <input type="hidden" name={name} value={valor} />
      <Estrellas valor={valor} onChange={setValor} label={label} />
    </div>
  );
}
