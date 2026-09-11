"use client";

import { useState, useTransition } from "react";
import { marcarAsistenciaMultiple } from "@/actions/inscripciones";
import { ETIQUETAS_ASISTENCIA } from "@/lib/estilos";

export function AsistenciaSelect({
  inscripcionId,
  jugadorId,
  partidoId,
  valorActual,
  disabled,
}: {
  inscripcionId: number;
  jugadorId: number;
  partidoId: number;
  valorActual: string | null;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [valor, setValor] = useState(valorActual ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <select
        value={valor}
        disabled={disabled || pending}
        onChange={(e) => {
          const nuevoValor = e.target.value;
          const anterior = valor;
          setValor(nuevoValor);
          setError(null);
          startTransition(async () => {
            const estado = nuevoValor || null;
            const resultado = await marcarAsistenciaMultiple(partidoId, [{ inscripcionId, jugadorId, estado }]);
            if (resultado?.error) {
              setValor(anterior);
              setError(resultado.error);
            }
          });
        }}
        className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
      >
        {ETIQUETAS_ASISTENCIA.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
