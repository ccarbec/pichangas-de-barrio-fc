"use client";

import { useTransition } from "react";
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

  return (
    <select
      defaultValue={valorActual ?? ""}
      disabled={disabled || pending}
      onChange={(e) => {
        const estado = e.target.value || null;
        startTransition(() => {
          marcarAsistenciaMultiple(partidoId, [{ inscripcionId, jugadorId, estado }]);
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
  );
}
