export function EmptyState({ icon, texto }: { icon: string; texto: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-6 py-10 text-center">
      <span className="text-3xl opacity-60">{icon}</span>
      <p className="text-sm text-[var(--muted)]">{texto}</p>
    </div>
  );
}
