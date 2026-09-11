"use client";

import { useState, useEffect } from "react";
import { obtenerCuadre } from "@/actions/pagos";
import { EmptyState } from "../../components/EmptyState";

type Partido = { id: number; etiqueta: string; costoCancha: number };

export function CuadreTab({ partidos }: { partidos: Partido[] }) {
  const [partidoId, setPartidoId] = useState(partidos[0]?.id);
  const [cuadre, setCuadre] = useState<{ recaudado: number; pendiente: number } | null>(null);
  const partido = partidos.find((p) => p.id === partidoId);

  useEffect(() => {
    if (!partidoId) return;
    obtenerCuadre(partidoId).then(setCuadre);
  }, [partidoId]);

  if (partidos.length === 0) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Cuadre por partido</h2>
        <EmptyState icon="💰" texto="Todavía no hay partidos." />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Cuadre por partido</h2>
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

      {cuadre && partido && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Recaudado (verificado)" value={cuadre.recaudado} />
          <Metric label="Pendiente de verificar" value={cuadre.pendiente} />
          <Metric label="Costo cancha" value={partido.costoCancha} />
          <Metric label="Saldo" value={cuadre.recaudado - partido.costoCancha} />
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="text-lg font-semibold">S/ {value.toFixed(2)}</p>
    </div>
  );
}
