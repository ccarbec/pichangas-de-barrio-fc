"use client";

import { useState, useTransition, useRef } from "react";
import { subirComprobanteMulta } from "@/actions/multas";
import { Toast } from "../../components/Toast";

type Multa = {
  id: number;
  tipo: string;
  monto: number;
  estado: string;
  nota: string | null;
  partidoEtiqueta: string | null;
};

export function MisMultas({ multas }: { multas: Multa[] }) {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-amber-800/50 bg-amber-950/30 p-5">
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-300">⚠️ Mis multas pendientes</h2>
      <p className="text-xs text-[var(--muted)]">
        Mientras tengas una multa por no asistencia sin pagar, no podrás confirmar en otras pichangas.
      </p>
      <div className="flex flex-col gap-3">
        {multas.map((m) => (
          <MultaItem key={m.id} multa={m} onPagada={() => setToast("Comprobante enviado — esperando verificación.")} />
        ))}
      </div>
    </section>
  );
}

function MultaItem({ multa, onPagada }: { multa: Multa; onPagada: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const etiquetaTipo = multa.tipo === "tardanza" ? "Tardanza" : "No asistencia";

  return (
    <div className="rounded-lg bg-[var(--background)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {etiquetaTipo} — S/ {multa.monto.toFixed(2)}
          {multa.partidoEtiqueta && (
            <span className="ml-2 text-xs text-[var(--muted)]">({multa.partidoEtiqueta})</span>
          )}
        </span>
        {multa.estado === "pendiente_verificacion" && (
          <span className="text-xs font-semibold text-amber-300">Esperando verificación</span>
        )}
      </div>

      {multa.nota && (
        <p className="mt-1 text-xs text-[var(--danger)]">Comprobante rechazado: {multa.nota}</p>
      )}

      {multa.estado === "debe" && (
        <form
          ref={formRef}
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const resultado = await subirComprobanteMulta(fd);
              if (resultado?.error) {
                setError(resultado.error);
              } else {
                formRef.current?.reset();
                onPagada();
              }
            });
          }}
          className="mt-2 flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="multaId" value={multa.id} />
          <input
            type="file"
            name="comprobante"
            accept="image/*"
            required
            disabled={pending}
            className="text-xs text-[var(--muted)]"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
          >
            {pending ? "Enviando…" : "💵 Enviar comprobante de pago"}
          </button>
        </form>
      )}

      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
