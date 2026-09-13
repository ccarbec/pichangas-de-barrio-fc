"use client";

import { useState, useTransition } from "react";
import { crearEstadio, actualizarEstadio, cambiarEstadoEstadio, subirFotoEstadio } from "@/actions/estadios";
import { guardarClubConfig, subirQrYape } from "@/actions/club-config";
import { crearPlantilla, actualizarPlantilla, eliminarPlantilla } from "@/actions/plantillas";
import { TIPOS_PLANTILLA, type TipoPlantilla } from "@/lib/plantillas";
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
  qrYape: string | null;
};
type Plantillas = Record<TipoPlantilla, { id: number; texto: string }[]>;

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm";

export function ConfiguracionTabs({
  estadios,
  config,
  plantillas,
}: {
  estadios: Estadio[];
  config: Config;
  plantillas: Plantillas;
}) {
  const [tab, setTab] = useState<"estadios" | "yape" | "mensajes">("estadios");

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
          <button
            onClick={() => setTab("mensajes")}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${tab === "mensajes" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
          >
            💬 Mensajes WhatsApp
          </button>
        </div>
      </div>

      {tab === "estadios" ? (
        <EstadiosTab estadios={estadios} />
      ) : tab === "yape" ? (
        <YapeTab config={config} />
      ) : (
        <MensajesTab plantillas={plantillas} />
      )}
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
                <input type="file" name="foto" accept="image/*" className="text-xs" />
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
    <div className="flex max-w-md flex-col gap-4">
      <QrYapeCard qrYape={config.qrYape} />

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
        className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
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
    </div>
  );
}

function QrYapeCard({ qrYape }: { qrYape: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
      <p className="mb-3 text-sm font-semibold">📱 QR de Yape</p>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Los jugadores lo van a ver justo donde suben su comprobante, para que puedan yapear escaneándolo ahí mismo.
      </p>
      <div className="mb-3 flex items-center gap-4">
        {qrYape ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrYape} alt="QR de Yape" className="h-32 w-32 rounded-lg border border-[var(--border)] object-contain bg-white p-1" />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-[var(--background)] text-center text-xs text-[var(--muted)]">
            Sin QR todavía
          </div>
        )}
      </div>
      <form
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const resultado = await subirQrYape(fd);
            if (resultado?.error) setError(resultado.error);
            else setToast("QR actualizado.");
          });
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="file" name="qr" accept="image/*" className="text-xs" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs transition-colors hover:border-[var(--accent)] disabled:opacity-60"
        >
          {pending ? "Subiendo…" : "Subir QR"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}

const VARIABLES_PARTIDO = "{nombre} {fecha} {hora} {cancha} {costo} {saludo}";
const VARIABLES_MULTA = "{nombre} {monto} {fecha} {saludo}";

const ETIQUETAS_PLANTILLA: Record<TipoPlantilla, { titulo: string; descripcion: string; variables: string }> = {
  recordatorio: {
    titulo: "Recordatorio del partido",
    descripcion: "Se manda una vez, la mañana del mismo día, a todos los confirmados.",
    variables: VARIABLES_PARTIDO,
  },
  pago_pendiente: {
    titulo: "Recordatorio de pago pendiente",
    descripcion: "Se manda cuando faltan entre 6 y 24 horas para el partido, a quien no tenga el pago verificado.",
    variables: VARIABLES_PARTIDO,
  },
  cupo_liberado: {
    titulo: "Aviso: se liberó tu cupo",
    descripcion: "Se manda cuando faltan 6 horas o menos y se cancela la inscripción por falta de pago.",
    variables: VARIABLES_PARTIDO,
  },
  promovido: {
    titulo: "Aviso: entraste a jugar",
    descripcion: "Se manda a quien sube de la lista de espera a confirmado por un cupo recién liberado.",
    variables: VARIABLES_PARTIDO,
  },
  cierre_partido: {
    titulo: "Aliento después del partido",
    descripcion:
      "No se manda solo — Carlos lo dispara a mano (acceso directo \"Enviar Mensaje de Cierre\") después de cerrar un partido, y solo llega a quienes de verdad jugaron (llegaron o llegaron tarde).",
    variables: VARIABLES_PARTIDO,
  },
  multa_pendiente: {
    titulo: "Recordatorio de multa sin pagar",
    descripcion: "Se manda una sola vez por multa, a quien tenga una multa en estado \"debe\".",
    variables: VARIABLES_MULTA,
  },
};

function MensajesTab({ plantillas }: { plantillas: Plantillas }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
        Cada tipo de mensaje puede tener varias versiones — cada vez que se manda, el sistema elige una al azar para
        que no le llegue siempre el mismo texto a todos.
      </div>
      {TIPOS_PLANTILLA.map((tipo) => (
        <PlantillaSeccion key={tipo} tipo={tipo} variantes={plantillas[tipo]} />
      ))}
    </div>
  );
}

function PlantillaSeccion({ tipo, variantes }: { tipo: TipoPlantilla; variantes: { id: number; texto: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const etiqueta = ETIQUETAS_PLANTILLA[tipo];

  function run(fn: () => Promise<{ error?: string } | void>, mensajeExito?: string) {
    startTransition(async () => {
      setError(null);
      const resultado = await fn();
      if (resultado && resultado.error) {
        setError(resultado.error);
      } else if (mensajeExito) {
        setToast(mensajeExito);
      }
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
      <h3 className="font-semibold">{etiqueta.titulo}</h3>
      <p className="text-xs text-[var(--muted)]">{etiqueta.descripcion}</p>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Variables: <code className="text-[var(--foreground)]">{etiqueta.variables}</code>
      </p>

      <div className="flex flex-col gap-2">
        {variantes.map((v) => (
          <form
            key={v.id}
            action={(fd) => run(() => actualizarPlantilla(v.id, String(fd.get("texto"))), "Mensaje actualizado.")}
            className="flex flex-col gap-2 rounded-lg border border-[var(--border)] p-3 sm:flex-row sm:items-start"
          >
            <textarea name="texto" defaultValue={v.texto} rows={2} className={`${inputClass} sm:flex-1`} />
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs transition-colors hover:border-[var(--accent)] disabled:opacity-60">
                💾 Guardar
              </button>
              <button
                type="button"
                disabled={pending || variantes.length <= 1}
                onClick={() => run(() => eliminarPlantilla(v.id), "Mensaje eliminado.")}
                title={variantes.length <= 1 ? "Debe quedar al menos un mensaje de este tipo" : undefined}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--danger)] transition-colors hover:border-[var(--danger)] disabled:opacity-40"
              >
                🗑️
              </button>
            </div>
          </form>
        ))}
      </div>

      <form
        key={variantes.length}
        action={(fd) => run(() => crearPlantilla(tipo, String(fd.get("texto"))), "Mensaje agregado.")}
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start"
      >
        <textarea name="texto" placeholder="Nueva variante de mensaje…" rows={2} className={`${inputClass} sm:flex-1`} />
        <button type="submit" disabled={pending} className="self-start rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-60">
          ➕ Agregar
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
