"use client";

import { useState, useEffect } from "react";
import { obtenerPagosDePartido } from "@/actions/pagos";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { ETIQUETA_INSCRIPCION, ETIQUETA_PAGO } from "@/lib/estilos";

type Partido = { id: number; etiqueta: string };
type FilaPago = {
  id: number;
  nombre: string;
  telefono: string;
  estadoInscripcion: string;
  pagoId: number | null;
  monto: number | null;
  estadoPago: string;
  metodoPago: string | null;
  tieneComprobante: boolean;
};

export function PagosPorPartidoTab({ partidos }: { partidos: Partido[] }) {
  const [partidoId, setPartidoId] = useState(partidos[0]?.id);
  const [filas, setFilas] = useState<FilaPago[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partidoId) return;
    obtenerPagosDePartido(partidoId)
      .then((r) => {
        setFilas(r);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar los pagos."));
  }, [partidoId]);

  if (partidos.length === 0) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Pagos por partido</h2>
        <EmptyState icon="💳" texto="Todavía no hay partidos." />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        Pagos por partido — abiertos o cerrados
      </h2>
      <select
        value={partidoId}
        onChange={(e) => setPartidoId(Number(e.target.value))}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
      >
        {partidos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.etiqueta}
          </option>
        ))}
      </select>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="pb-2 pr-3">Jugador</th>
              <th className="pb-2 pr-3">Inscripción</th>
              <th className="pb-2 pr-3">Pago</th>
              <th className="pb-2 pr-3">Monto</th>
              <th className="pb-2">Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={5} className="py-3 text-[var(--danger)]">
                  {error}
                </td>
              </tr>
            )}
            {filas === null && !error && (
              <tr>
                <td colSpan={5} className="py-3 text-[var(--muted)]">
                  Cargando…
                </td>
              </tr>
            )}
            {filas?.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-[var(--muted)]">
                  Nadie se inscribió a este partido.
                </td>
              </tr>
            )}
            {filas?.map((f) => (
              <tr key={f.id} className="border-b border-[var(--border)]/50 last:border-0">
                <td className="py-2 pr-3 font-medium whitespace-nowrap">{f.nombre}</td>
                <td className="py-2 pr-3">
                  <Badge variant={ETIQUETA_INSCRIPCION[f.estadoInscripcion]?.variant ?? "neutral"}>
                    {ETIQUETA_INSCRIPCION[f.estadoInscripcion]?.texto ?? f.estadoInscripcion}
                  </Badge>
                </td>
                <td className="py-2 pr-3">
                  <Badge variant={ETIQUETA_PAGO[f.estadoPago]?.variant ?? "neutral"}>
                    {ETIQUETA_PAGO[f.estadoPago]?.texto ?? "Sin pago"}
                  </Badge>
                  {f.metodoPago && <span className="ml-2 text-xs text-[var(--muted)]">({f.metodoPago})</span>}
                </td>
                <td className="py-2 pr-3">{f.monto != null ? `S/ ${f.monto.toFixed(2)}` : "—"}</td>
                <td className="py-2">
                  {f.tieneComprobante && f.pagoId ? (
                    <a
                      href={`/api/comprobante/${f.pagoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--accent)] transition-colors hover:underline"
                    >
                      🧾 Ver
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
