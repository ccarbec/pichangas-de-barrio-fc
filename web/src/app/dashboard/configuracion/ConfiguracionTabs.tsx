"use client";

import { useState, useTransition } from "react";
import { crearEstadio, actualizarEstadio, cambiarEstadoEstadio, subirFotoEstadio } from "@/actions/estadios";
import { guardarClubConfig } from "@/actions/club-config";
import { Badge } from "../../components/Badge";
import { Toast } from "../../components/Toast";

type Estadio = {
  id: number;
  nombre: string;
  costoCancha: number;
  costoPorJugador: number;
  estado: string;
  foto: string | null;
};
type Config = {
  nombreYape: string;
  telefonoYape: string;
  montoMultaTardanza: number;
  montoMultaNoAsistio: number;
};

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm";

export function ConfiguracionTabs({ estadios, config }: { estadios: Estadio[]; config: Config }) {
  const [tab, setTab] = useState<"estadios" | "yape">("estadios");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("estadios")}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${tab === "estadios" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
          >
            🏟️ Zonas y estadios
          </button>
          <button
            onClick={() => setTab("yape")}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${tab === "yape" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
          >
            💰 Yape y multas
          </button>
        </div>
      </div>

      {tab === "estadios" ? <EstadiosTab estadios={estadios} /> : <YapeTab config={config} />}
    </div>
  );
}

function EstadiosTab({ estadios }: { estadios: Estadio[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [seleccionId, setSeleccionId] = useState<number | null>(estadios[0]?.id ?? null);
  const seleccionado = estadios.find((e) => e.id === seleccionId) ?? null;

  const [toast, setToast] = useState<string | null>(null);

  function run(fn: () => Promise<unknown>, mensajeExito?: string) {
    startTransition(async () => {
      setError(null);
      try {
        await fn();
        if (mensajeExito) setToast(mensajeExito);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
      <form
        action={(fd) => run(() => crearEstadio(fd), "Zona agregada.")}
        className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Nombre de la zona / estadio</label>
          <input name="nombre" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Costo cancha (S/)</label>
          <input name="costoCancha" type="number" step="0.5" min={0} defaultValue={120} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Costo por jugador (S/)</label>
          <input name="costoPorJugador" type="number" step="0.5" min={0} defaultValue={10} required className={inputClass} />
        </div>
        <button type="submit" className="col-span-full self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90">
          ➕ Agregar zona
        </button>
      </form>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="p-3">Zona</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {estadios.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSeleccionId(e.id)}
                  className={`cursor-pointer border-b border-[var(--border)]/50 last:border-0 ${seleccionId === e.id ? "bg-[var(--surface-hover)]" : ""}`}
                >
                  <td className="p-3 font-medium whitespace-nowrap">{e.nombre}</td>
                  <td className="p-3">
                    <Badge variant={e.estado === "activo" ? "active" : "danger"}>{e.estado.toUpperCase()}</Badge>
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
                <img src={seleccionado.foto} alt="" className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-[var(--background)]" />
              )}
              <form action={(fd) => run(() => subirFotoEstadio(fd), "Foto actualizada.")} className="flex items-center gap-2">
                <input type="hidden" name="estadioId" value={seleccionado.id} />
                <input type="file" name="foto" accept="image/png,image/jpeg" className="text-xs" />
                <button type="submit" className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs transition-colors hover:border-[var(--accent)]">
                  Subir foto
                </button>
              </form>
            </div>

            <form
              key={seleccionado.id}
              action={(fd) => run(() => actualizarEstadio(fd), "Datos actualizados.")}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <input type="hidden" name="estadioId" value={seleccionado.id} />
              <div className="col-span-full">
                <label className="mb-1 block text-xs text-[var(--muted)]">Nombre</label>
                <input name="nombre" defaultValue={seleccionado.nombre} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">Costo cancha (S/)</label>
                <input name="costoCancha" type="number" step="0.5" defaultValue={seleccionado.costoCancha} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">Costo por jugador (S/)</label>
                <input name="costoPorJugador" type="number" step="0.5" defaultValue={seleccionado.costoPorJugador} className={inputClass} />
              </div>
              <div className="col-span-full flex items-center gap-2">
                <button type="submit" disabled={pending} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:hover:opacity-100">
                  💾 Guardar
                </button>
                {seleccionado.estado === "activo" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => cambiarEstadoEstadio(seleccionado.id, false), "Zona desactivada.")}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition-colors hover:border-[var(--accent)]"
                  >
                    Desactivar
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => cambiarEstadoEstadio(seleccionado.id, true), "Zona reactivada.")}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition-colors hover:border-[var(--accent)]"
                  >
                    Reactivar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function YapeTab({ config }: { config: Config }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          try {
            await guardarClubConfig(fd);
            setToast("Configuración guardada.");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Error");
          }
        });
      }}
      className="grid max-w-md grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">Nombre en Yape</label>
        <input name="nombreYape" defaultValue={config.nombreYape} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">Celular Yape</label>
        <input name="telefonoYape" defaultValue={config.telefonoYape} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">Multa por tardanza (S/)</label>
        <input name="montoMultaTardanza" type="number" step="0.5" defaultValue={config.montoMultaTardanza} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">Multa por no asistir (S/)</label>
        <input name="montoMultaNoAsistio" type="number" step="0.5" defaultValue={config.montoMultaNoAsistio} className={inputClass} />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button type="submit" disabled={pending} className="mt-1 self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:hover:opacity-100">
        💾 Guardar configuración
      </button>
    </form>
  );
}
