export function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-3">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate text-[var(--muted)]">{i.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--background)]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right font-semibold">{i.value}</span>
        </div>
      ))}
    </div>
  );
}
