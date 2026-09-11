"use client";

import { useState, useTransition } from "react";
import { verificarPago, rechazarPago } from "@/actions/pagos";

type Pago = {
  id: number;
  monto: number;
  nombre: string;
  partido: string;
  comprobante: string | null;
};

export function PagosPendientesTab({ pagos }: { pagos: Pago[] }) {
  const [pending, startTransition] = useTransition();
  const [notaAbierta, setNotaAbierta] = useState<number | null>(null);
  const [nota, setNota] = useState("");

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        Pendientes de verificar
      </h2>
      {pagos.length === 0 && <p className="text-sm text-emerald-400">No hay comprobantes pendientes de verificar.</p>}
      <div className="flex flex-col gap-4">
        {pagos.map((p) => (
          <div key={p.id} className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 last:border-0 sm:flex-row">
            {p.comprobante && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.comprobante} alt="Comprobante" className="h-40 w-40 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{p.nombre}</p>
              <p className="text-sm text-[var(--muted)]">{p.partido}</p>
              <p className="mt-1 text-sm">
                Monto: <span className="font-semibold">S/ {p.monto.toFixed(2)}</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => verificarPago(p.id))}
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-foreground)]"
                >
                  ✅ Aprobar
                </button>
                {notaAbierta === p.id ? (
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
                          await rechazarPago(p.id, nota);
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
                    onClick={() => setNotaAbierta(p.id)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    ❌ Rechazar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
