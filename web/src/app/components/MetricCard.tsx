export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}
