"use client";

import { useState, useTransition } from "react";
import { confirmarAsistencia, cancelarInscripcion } from "@/actions/inscripciones";
import { registrarPago } from "@/actions/pagos";
import { Badge } from "../../components/Badge";
import { ArchivoInput } from "../../components/ArchivoInput";
import { YapeQR } from "../../components/YapeQR";
import { ETIQUETA_INSCRIPCION, ETIQUETA_PAGO } from "@/lib/estilos";

type Partido = {
  id: number;
  fecha: string;
  hora: string;
  cancha: string;
  cupoMax: number;
  costoPorJugador: number;
  notas: string | null;
  arquerosMax: number;
};

type Inscripcion = {
  id: number;
  estado: string;
  pago: { estado: string; nota: string | null } | null;
} | null;

type DatosYape = { qrYape: string | null; nombreYape: string | null; telefonoYape: string | null };

export function PartidoJugador({
  partido,
  inscripcion,
  confirmados,
  arquerosConfirmados,
  datosYape,
}: {
  partido: Partido;
  jugadorId: number;
  inscripcion: Inscripcion;
  confirmados: number;
  arquerosConfirmados: number;
  datosYape: DatosYape;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enviandoComprobante, setEnviandoComprobante] = useState(false);
  const inscritoActivo = inscripcion && inscripcion.estado !== "cancelado";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold break-words">
            {partido.fecha} · {partido.hora} — {partido.cancha}
          </p>
          <p className="text-sm text-[var(--muted)]">S/ {partido.costoPorJugador.toFixed(2)} por jugador</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Cupo {confirmados}/{partido.cupoMax} · 🧤 Arqueros {arquerosConfirmados}/{partido.arquerosMax}
          </p>
          {partido.notas && <p className="mt-1 text-xs text-[var(--muted)]">{partido.notas}</p>}
          {inscritoActivo && inscripcion && (
            <div className="mt-2">
              <Badge variant={ETIQUETA_INSCRIPCION[inscripcion.estado]?.variant ?? "neutral"}>
                {ETIQUETA_INSCRIPCION[inscripcion.estado]?.texto ?? inscripcion.estado}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {!inscritoActivo ? (
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const resultado = await confirmarAsistencia(partido.id);
                  if (resultado?.error) setError(resultado.error);
                })
              }
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
            >
              Confirmar asistencia
            </button>
          ) : (
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  try {
                    await cancelarInscripcion(inscripcion!.id);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Error");
                  }
                })
              }
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:opacity-50"
            >
              Cancelar mi asistencia
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}

      {inscritoActivo && inscripcion?.estado === "confirmado" && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <Badge variant={ETIQUETA_PAGO[inscripcion.pago?.estado ?? "sin_pago"]?.variant ?? "neutral"}>
            {ETIQUETA_PAGO[inscripcion.pago?.estado ?? "sin_pago"]?.texto ?? "Sin pago"}
          </Badge>
          {inscripcion.pago?.estado === "rechazado" && (
            <p className="mt-2 text-sm text-[var(--danger)]">
              Tu comprobante fue rechazado{inscripcion.pago.nota ? `: ${inscripcion.pago.nota}` : ""}. Sube uno nuevo.
            </p>
          )}
          {inscripcion.pago?.estado === "verificado" ? (
            <p className="mt-2 text-sm text-emerald-400">Pago verificado. ¡Nos vemos en la cancha!</p>
          ) : (
            <form
              key={inscripcion.pago?.estado ?? "sin_pago"}
              action={async (formData) => {
                setError(null);
                setEnviandoComprobante(true);
                const resultado = await registrarPago(formData);
                setEnviandoComprobante(false);
                if (resultado?.error) setError(resultado.error);
              }}
              className="mt-3 flex flex-col gap-2"
            >
              <YapeQR {...datosYape} />
              <p className="text-sm font-medium">💸 Sube aquí tu comprobante de pago (captura de Yape)</p>
              <input type="hidden" name="inscripcionId" value={inscripcion.id} />
              <input type="hidden" name="monto" value={partido.costoPorJugador} />
              <div className="flex flex-wrap items-center gap-3">
                <ArchivoInput
                  id={`comprobante-partido-${inscripcion.id}`}
                  name="comprobante"
                  accept="image/*"
                  required
                  disabled={enviandoComprobante}
                  texto="📎 Selecciona tu comprobante"
                />
                <button
                  type="submit"
                  disabled={enviandoComprobante}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
                >
                  {enviandoComprobante ? "Enviando…" : "Enviar comprobante"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
