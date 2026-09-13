"use client";

export function Estrellas({
  valor,
  onChange,
  label,
  readOnly,
}: {
  valor: number;
  onChange?: (n: number) => void;
  label?: string;
  readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <div className="flex items-center gap-1" aria-label={label ? `${label}: ${valor} de 5` : `${valor} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`text-xl leading-none ${n <= valor ? "" : "text-[var(--muted)] opacity-50"}`}>
            {n <= valor ? "⭐" : "☆"}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          aria-label={label ? `${label}: ${n} de 5` : `${n} de 5`}
          className={`text-xl leading-none transition-transform hover:scale-110 ${n <= valor ? "" : "text-[var(--muted)] opacity-50"}`}
        >
          {n <= valor ? "⭐" : "☆"}
        </button>
      ))}
    </div>
  );
}
