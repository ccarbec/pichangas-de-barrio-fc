"use client";

import { useState } from "react";

export function ArchivoInput({
  id,
  name,
  accept,
  required,
  disabled,
  texto = "📎 Seleccionar archivo",
}: {
  id: string;
  name: string;
  accept?: string;
  required?: boolean;
  disabled?: boolean;
  texto?: string;
}) {
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className={`max-w-[14rem] cursor-pointer truncate rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--accent)] ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        {nombreArchivo ?? texto}
      </label>
      <input
        id={id}
        type="file"
        name={name}
        accept={accept}
        required={required}
        disabled={disabled}
        className="hidden"
        onChange={(e) => setNombreArchivo(e.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}
