"use client";

import { useState, useTransition, useRef } from "react";
import { subirGaleria } from "@/actions/galeria";
import { Toast } from "../../components/Toast";

type Partido = { id: number; etiqueta: string };

export function GaleriaUploadForm({ partidos }: { partidos: Partido[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await subirGaleria(formData);
            formRef.current?.reset();
            setToast("Archivo subido a la galería.");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Error al subir el archivo.");
          }
        });
      }}
      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      {toast && <Toast mensaje={toast} onCerrar={() => setToast(null)} />}
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Subir a la galería</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Foto o video (máx. 5MB foto / 20MB video)</label>
          <input
            type="file"
            name="archivo"
            accept="image/*,video/*"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Pichanga (opcional)</label>
          <select
            name="partidoId"
            defaultValue=""
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="">Sin asociar</option>
            {partidos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--muted)]">Descripción (opcional)</label>
        <input
          name="descripcion"
          placeholder="Ej: Gol de tiro libre en el minuto 80"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
      >
        {pending ? "Subiendo…" : "📤 Subir"}
      </button>
    </form>
  );
}
