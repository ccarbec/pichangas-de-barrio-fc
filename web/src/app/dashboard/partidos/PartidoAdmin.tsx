"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoPartido, duplicarPartido } from "@/actions/partidos";
import { agregarJugadorAPartido, cancelarInscripcion, reemplazarJugador } from "@/actions/inscripciones";
import { marcarPagoManual } from "@/actions/pagos";
import { marcarMultaPagadaEfectivo } from "@/actions/multas";
import { AsistenciaSelect } from "./AsistenciaSelect";
import { Badge } from "../../components/Badge";
import { ETIQUETA_INSCRIPCION, ETIQUETA_PAGO, emojiPosicion, esArquero, nombreCompleto } from "@/lib/estilos";

const ETIQUETA_ASISTENCIA_EXCEL: Record<string, string> = {
  llego: "Llegó",
  tardanza: "Tardanza",
  no_llego: "No llegó",
};

type Jugador = { id: number; apellidos: string; apodo: string | null; posicion: string | null; usuario: { nombre: string; telefono: string } };
type Inscripcion = {
  id: number;
  jugadorId: number;
  estado: string;
  asistio: string | null;
  jugador: Jugador;
  pago: { id: number; estado: string } | null;
};
type Multa = { id: number; jugadorId: number; tipo: string; monto: number; estado: string };
type Partido = {
  id: number;
  fecha: string;
  hora: string;
  cancha: string;
  cupoMax: number;
  costoCancha: number;
  costoPorJugador: number;
  estado: string;
};

export function PartidoAdmin({
  partido,
  inscritos,
  multas,
  jugadoresRegistrados,
}: {
  partido: Partido;
  inscritos: Inscripcion[];
  multas: Multa[];
  jugadoresRegistrados: Jugador[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [verInscritos, setVerInscritos] = useState(false);
  const [reemplazoDe, setReemplazoDe] = useState<number | null>(null);
  const [autorizarCierre, setAutorizarCierre] = useState(false);

  const confirmados = inscritos.filter((i) => i.estado === "confirmado");
  const arquerosConfirmados = confirmados.filter((i) => esArquero(i.jugador.posicion)).length;
  const idsEnPartido = new Set(inscritos.map((i) => i.jugadorId));
  const disponibles = jugadoresRegistrados.filter((j) => !idsEnPartido.has(j.id));
  const multasPorJugador = new Map(multas.map((m) => [m.jugadorId, m]));
  const multasHuerfanas = multas.filter((m) => !idsEnPartido.has(m.jugadorId) && m.estado !== "pagado");

  const faltanPago = confirmados.filter((i) => i.pago?.estado !== "verificado" && i.asistio !== "no_llego").length;
  const recaudado = inscritos.reduce((sum, i) => (i.pago?.estado === "verificado" ? sum + partido.costoPorJugador : sum), 0);

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      setError(null);
      try {
        const resultado = await fn();
        if (resultado && typeof resultado === "object" && "error" in resultado && resultado.error) {
          setError(String(resultado.error));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  async function exportarExcel() {
    const XLSX = await import("xlsx");
    const filas = inscritos.map((i) => {
      const multa = multasPorJugador.get(i.jugadorId);
      return {
        Jugador: nombreCompleto(i.jugador),
        Celular: i.jugador.usuario.telefono,
        Posición: i.jugador.posicion ?? "",
        Inscripción: ETIQUETA_INSCRIPCION[i.estado]?.texto ?? i.estado,
        Pago: ETIQUETA_PAGO[i.pago?.estado ?? "sin_pago"]?.texto ?? "Sin pago",
        Asistencia: i.asistio ? (ETIQUETA_ASISTENCIA_EXCEL[i.asistio] ?? i.asistio) : "Sin marcar",
        Multa: multa ? `${multa.tipo === "tardanza" ? "Tardanza" : "No asistencia"} — S/ ${multa.monto.toFixed(2)} (${multa.estado === "pagado" ? "pagada" : "pendiente"})` : "",
      };
    });
    const hoja = XLSX.utils.json_to_sheet(filas);
    hoja["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 36 }];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Inscritos");
    XLSX.writeFile(libro, `inscritos_${partido.fecha}.xlsx`);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words">
            {partido.fecha} · {partido.hora} — {partido.cancha}
          </p>
          <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-[var(--background)]">
            <div
              className="h-full bg-[var(--accent)]"
              style={{ width: `${Math.min((confirmados.length / partido.cupoMax) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Cupo {confirmados.length}/{partido.cupoMax} · 🧤 Arqueros {arquerosConfirmados}/2 · Cancha S/{" "}
            {partido.costoCancha.toFixed(2)} · S/ {partido.costoPorJugador.toFixed(2)} por jugador
          </p>
        </div>

        {partido.estado === "programado" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={pending || (faltanPago > 0 && !autorizarCierre)}
              onClick={() => run(() => cambiarEstadoPartido(partido.id, "jugado"))}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40"
            >
              ✅ Cerrar (jugado)
            </button>
            <button
              disabled={pending}
              onClick={() => run(() => cambiarEstadoPartido(partido.id, "cancelado"))}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs whitespace-nowrap text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              🚫 Cancelar
            </button>
          </div>
        )}
      </div>

      {partido.estado === "programado" && faltanPago > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-950/50 px-3 py-2 text-xs text-amber-300">
          <input type="checkbox" checked={autorizarCierre} onChange={(e) => setAutorizarCierre(e.target.checked)} />
          ⚠️ Faltan {faltanPago} jugador(es) por pagar — autorizo cerrar de todas formas.
        </div>
      )}

      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={() => setVerInscritos((v) => !v)}
          className="text-sm font-semibold text-[var(--accent)]"
        >
          {verInscritos ? "▾" : "▸"} Ver inscritos ({inscritos.length})
        </button>
        {inscritos.length > 0 && (
          <button
            onClick={exportarExcel}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          >
            📥 Exportar a Excel
          </button>
        )}
      </div>

      {verInscritos && (
        <div className="mt-3 flex flex-col gap-3 border-t border-[var(--border)] pt-4">
          {disponibles.length > 0 && (
            <AgregarJugador partidoId={partido.id} disponibles={disponibles} onError={setError} pending={pending} run={run} />
          )}
          {inscritos.length === 0 && <p className="text-sm text-[var(--muted)]">Todavía nadie se ha inscrito.</p>}

          {inscritos.map((i) => {
            const multa = multasPorJugador.get(i.jugadorId);
            const puedeGestionar = i.estado === "confirmado" && partido.estado !== "cancelado";
            return (
              <div key={i.id} className="rounded-lg border border-[var(--border)] p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 break-words text-sm font-medium">
                    {emojiPosicion(i.jugador.posicion)} {nombreCompleto(i.jugador)} ({i.jugador.usuario.telefono})
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={ETIQUETA_INSCRIPCION[i.estado]?.variant ?? "neutral"}>
                      {ETIQUETA_INSCRIPCION[i.estado]?.texto ?? i.estado}
                    </Badge>
                    <Badge variant={ETIQUETA_PAGO[i.pago?.estado ?? "sin_pago"]?.variant ?? "neutral"}>
                      {ETIQUETA_PAGO[i.pago?.estado ?? "sin_pago"]?.texto ?? "Sin pago"}
                    </Badge>
                    <button
                      disabled={pending}
                      onClick={() => run(() => cancelarInscripcion(i.id))}
                      className="text-xs whitespace-nowrap text-[var(--danger)] hover:underline"
                    >
                      🗑️ Quitar
                    </button>
                  </div>
                </div>

                {puedeGestionar && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {i.pago?.estado !== "verificado" && (
                      <button
                        disabled={pending}
                        onClick={() => run(() => marcarPagoManual(i.id, partido.costoPorJugador))}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-xs transition-colors hover:border-[var(--accent)]"
                      >
                        💵 Pagó en efectivo
                      </button>
                    )}
                    <AsistenciaSelect
                      inscripcionId={i.id}
                      jugadorId={i.jugadorId}
                      partidoId={partido.id}
                      valorActual={i.asistio}
                      disabled={pending}
                    />
                  </div>
                )}

                {multa && (
                  <div className="mt-2 flex items-center justify-between rounded-md bg-[var(--background)] px-3 py-2 text-xs">
                    <span>
                      ⚠️ Multa por {multa.tipo === "tardanza" ? "tardanza" : "no asistencia"}: S/{" "}
                      {multa.monto.toFixed(2)}
                    </span>
                    {multa.estado === "pagado" ? (
                      <Badge variant="active">Pagado</Badge>
                    ) : (
                      <button
                        disabled={pending}
                        onClick={() => run(() => marcarMultaPagadaEfectivo(multa.id))}
                        className="rounded-md border border-[var(--border)] px-2 py-1 transition-colors hover:border-[var(--accent)]"
                      >
                        💵 Multa pagada (efectivo)
                      </button>
                    )}
                  </div>
                )}

                {i.asistio === "no_llego" && (
                  <div className="mt-2">
                    {reemplazoDe !== i.id ? (
                      <button onClick={() => setReemplazoDe(i.id)} className="text-xs text-[var(--accent)]">
                        🔁 Buscar reemplazo
                      </button>
                    ) : (
                      <ReemplazoForm
                        candidatos={jugadoresRegistrados.filter((j) => !idsEnPartido.has(j.id))}
                        onConfirmar={(jugadorId) =>
                          run(async () => {
                            await reemplazarJugador(i.id, jugadorId);
                            setReemplazoDe(null);
                          })
                        }
                        pending={pending}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {multasHuerfanas.length > 0 && (
            <div className="mt-2 border-t border-[var(--border)] pt-3">
              <p className="mb-2 text-xs text-[var(--muted)]">
                Estos jugadores ya no están en la lista, pero siguen debiendo esta multa:
              </p>
              {multasHuerfanas.map((m) => {
                const j = jugadoresRegistrados.find((jr) => jr.id === m.jugadorId);
                return (
                  <div key={m.id} className="flex items-center justify-between py-1 text-sm">
                    <span>{j ? nombreCompleto(j) : `Jugador #${m.jugadorId}`}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {m.tipo === "tardanza" ? "Tardanza" : "No asistencia"} — S/ {m.monto.toFixed(2)}
                    </span>
                    <button
                      disabled={pending}
                      onClick={() => run(() => marcarMultaPagadaEfectivo(m.id))}
                      className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:border-[var(--accent)]"
                    >
                      💵 Marcar pagada
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-2 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-3 text-sm">
            <div>
              <p className="text-xs text-[var(--muted)]">Recaudado</p>
              <p className="font-semibold">S/ {recaudado.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Costo cancha</p>
              <p className="font-semibold">S/ {partido.costoCancha.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Saldo</p>
              <p className="font-semibold">S/ {(recaudado - partido.costoCancha).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {partido.estado === "cancelado" && (
        <RepetirForm partidoId={partido.id} pending={pending} run={run} duplicar={duplicarPartido} />
      )}
    </div>
  );
}

function AgregarJugador({
  partidoId,
  disponibles,
  pending,
  run,
}: {
  partidoId: number;
  disponibles: Jugador[];
  onError: (e: string | null) => void;
  pending: boolean;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [elegido, setElegido] = useState(disponibles[0]?.id ?? 0);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select
        value={elegido}
        onChange={(e) => setElegido(Number(e.target.value))}
        className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
      >
        {disponibles.map((j) => (
          <option key={j.id} value={j.id}>
            {nombreCompleto(j)} — {j.usuario.telefono}
          </option>
        ))}
      </select>
      <button
        disabled={pending}
        onClick={() => run(() => agregarJugadorAPartido(partidoId, elegido))}
        className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
      >
        Agregar
      </button>
    </div>
  );
}

function ReemplazoForm({
  candidatos,
  onConfirmar,
  pending,
}: {
  candidatos: Jugador[];
  onConfirmar: (jugadorId: number) => void;
  pending: boolean;
}) {
  const [elegido, setElegido] = useState(candidatos[0]?.id ?? 0);
  if (candidatos.length === 0) return <p className="text-xs text-[var(--muted)]">No hay más jugadores disponibles.</p>;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select
        value={elegido}
        onChange={(e) => setElegido(Number(e.target.value))}
        className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
      >
        {candidatos.map((j) => (
          <option key={j.id} value={j.id}>
            {nombreCompleto(j)} — {j.usuario.telefono}
          </option>
        ))}
      </select>
      <button
        disabled={pending}
        onClick={() => onConfirmar(elegido)}
        className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
      >
        Confirmar
      </button>
    </div>
  );
}

function RepetirForm({
  partidoId,
  pending,
  run,
  duplicar,
}: {
  partidoId: number;
  pending: boolean;
  run: (fn: () => Promise<unknown>) => void;
  duplicar: (id: number, fecha: string, hora: string) => Promise<void>;
}) {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("19:00");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
      />
      <input
        type="time"
        value={hora}
        onChange={(e) => setHora(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
      />
      <button
        disabled={pending || !fecha}
        onClick={() => run(() => duplicar(partidoId, fecha, hora))}
        className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
      >
        🔁 Duplicar
      </button>
    </div>
  );
}
