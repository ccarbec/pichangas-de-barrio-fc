"use client";

export function Estrellas({
  valor,
  onChange,
  label,
}: {
  valor: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={label ? `${label}: ${n} de 5` : `${n} de 5`}
          className={`text-xl leading-none transition-transform hover:scale-110 ${n <= valor ? "" : "text-[var(--muted)] opacity-50"}`}
        >
          {n <= valor ? "⭐" : "☆"}
        </button>
      ))}
    </div>
  );
}
