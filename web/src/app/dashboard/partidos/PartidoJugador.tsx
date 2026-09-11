"use client";

import { useState, useTransition } from "react";
import { confirmarAsistencia, cancelarInscripcion } from "@/actions/inscripciones";
import { registrarPago } from "@/actions/pagos";
import { Badge } from "../../components/Badge";
import { ETIQUETA_INSCRIPCION, ETIQUETA_PAGO } from "@/lib/estilos";

type Partido = {
  id: number;
  fecha: string;
  hora: string;
  cancha: string;
  cupoMax: number;
  costoPorJugador: number;
  notas: string | null;
};

type Inscripcion = {
  id: number;
  estado: string;
  pago: { estado: string; nota: string | null } | null;
} | null;

export function PartidoJugador({
  partido,
  inscripcion,
}: {
  partido: Partido;
  jugadorId: number;
  inscripcion: Inscripcion;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inscritoActivo = inscripcion && inscripcion.estado !== "cancelado";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {partido.fecha} · {partido.hora} — {partido.cancha}
          </p>
          <p className="text-sm text-[var(--muted)]">S/ {partido.costoPorJugador.toFixed(2)} por jugador</p>
          {partido.notas && <p className="mt-1 text-xs text-[var(--muted)]">{partido.notas}</p>}
          {inscritoActivo && inscripcion && (
            <div className="mt-2">
              <Badge variant={ETIQUETA_INSCRIPCION[inscripcion.estado]?.variant ?? "neutral"}>
                {ETIQUETA_INSCRIPCION[inscripcion.estado]?.texto ?? inscripcion.estado}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {!inscritoActivo ? (
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  try {
                    await confirmarAsistencia(partido.id);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Error");
                  }
                })
              }
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
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
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
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
              action={async (formData) => {
                setError(null);
                try {
                  await registrarPago(formData);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Error al subir el comprobante.");
                }
              }}
              className="mt-3 flex flex-wrap items-center gap-3"
            >
              <input type="hidden" name="inscripcionId" value={inscripcion.id} />
              <input type="hidden" name="monto" value={partido.costoPorJugador} />
              <input
                type="file"
                name="comprobante"
                accept="image/png,image/jpeg"
                required
                className="text-sm text-[var(--muted)]"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)]"
              >
                Enviar comprobante
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
