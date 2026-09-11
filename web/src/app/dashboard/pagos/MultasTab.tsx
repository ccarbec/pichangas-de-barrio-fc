"use client";

import { useState, useTransition } from "react";
import { verificarMulta, rechazarMulta, marcarMultaPagadaEfectivo } from "@/actions/multas";

type MultaVerif = {
  id: number;
  monto: number;
  tipo: string;
  nombre: string;
  partido: string | null;
  comprobante: string | null;
};
type MultaDebe = { id: number; monto: number; tipo: string; nombre: string };

export function MultasTab({
  pendientesVerificacion,
  todasPendientes,
}: {
  pendientesVerificacion: MultaVerif[];
  todasPendientes: MultaDebe[];
}) {
  const [pending, startTransition] = useTransition();
  const [notaAbierta, setNotaAbierta] = useState<number | null>(null);
  const [nota, setNota] = useState("");

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">⚠️ Multas</h2>
      <p className="mb-4 text-xs text-[var(--muted)]">
        Se generan solas al marcar tardanza o no-asistencia en Partidos → Ver inscritos.
      </p>

      {pendientesVerificacion.length > 0 && (
        <div className="mb-6 flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase text-[var(--muted)]">Comprobantes por revisar</h3>
          {pendientesVerificacion.map((m) => (
            <div key={m.id} className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row">
              {m.comprobante && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.comprobante} alt="Comprobante" className="h-32 w-32 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <p className="font-semibold">
                  {m.nombre} — {m.tipo === "tardanza" ? "Tardanza" : "No asistencia"}
                </p>
                {m.partido && <p className="text-xs text-[var(--muted)]">{m.partido}</p>}
                <p className="mt-1 text-sm">Monto: S/ {m.monto.toFixed(2)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    disabled={pending}
                    onClick={() => startTransition(() => verificarMulta(m.id))}
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
                  >
                    ✅ Aprobar
                  </button>
                  {notaAbierta === m.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                        placeholder="Motivo (opcional)"
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
                      />
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await rechazarMulta(m.id, nota);
                            setNotaAbierta(null);
                            setNota("");
                          })
                        }
                        className="rounded-lg border border-[var(--danger)] px-2 py-1 text-xs text-[var(--danger)]"
                      >
                        Confirmar rechazo
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNotaAbierta(m.id)}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]"
                    >
                      ❌ Rechazar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--muted)]">Todas las multas pendientes</h3>
      {todasPendientes.length === 0 && (
        <p className="text-sm text-emerald-400">No hay multas pendientes de pago.</p>
      )}
      <div className="flex flex-col gap-2">
        {todasPendientes.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--background)] px-3 py-2 text-sm">
            <span className="min-w-0 break-words font-medium">{m.nombre}</span>
            <span className="text-[var(--muted)]">{m.tipo === "tardanza" ? "Tardanza" : "No asistencia"}</span>
            <span>S/ {m.monto.toFixed(2)}</span>
            <button
              disabled={pending}
              onClick={() => startTransition(() => marcarMultaPagadaEfectivo(m.id))}
              className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs whitespace-nowrap transition-colors hover:border-[var(--accent)]"
            >
              💵 Pagó en efectivo
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
