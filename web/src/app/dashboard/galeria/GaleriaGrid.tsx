"use client";

import { useState, useTransition } from "react";
import { eliminarGaleriaItem } from "@/actions/galeria";
import { EmptyState } from "../../components/EmptyState";

type Item = {
  id: number;
  tipo: string;
  mime: string;
  descripcion: string | null;
  fechaSubida: string;
  partidoEtiqueta: string | null;
  subidoPor: string;
};

export function GaleriaGrid({ items, esAdmin }: { items: Item[]; esAdmin: boolean }) {
  const [pending, startTransition] = useTransition();
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return <EmptyState icon="📸" texto="Todavía no hay fotos ni videos en la galería." />;
  }

  function eliminar(id: number) {
    setEliminandoId(id);
    setError(null);
    startTransition(async () => {
      try {
        await eliminarGaleriaItem(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al quitar el archivo.");
      } finally {
        setEliminandoId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
    {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {item.tipo === "video" ? (
            <video
              src={`/api/galeria/${item.id}`}
              controls
              className="aspect-video w-full bg-black object-contain"
            />
          ) : (
            <a href={`/api/galeria/${item.id}`} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/galeria/${item.id}`}
                alt={item.descripcion ?? "Foto de la galería"}
                className="aspect-video w-full bg-black object-contain"
              />
            </a>
          )}
          <div className="p-3">
            {item.descripcion && <p className="text-sm">{item.descripcion}</p>}
            {item.partidoEtiqueta && <p className="mt-1 text-xs text-[var(--muted)]">⚽ {item.partidoEtiqueta}</p>}
            <p className="mt-1 text-xs text-[var(--muted)]">Subido por {item.subidoPor}</p>
            {esAdmin && (
              <button
                disabled={pending && eliminandoId === item.id}
                onClick={() => eliminar(item.id)}
                className="mt-2 text-xs text-[var(--danger)] transition-colors hover:underline"
              >
                🗑️ Quitar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}
