const VARIANTS = {
  active: "bg-[var(--badge-active-bg)] text-[var(--badge-active-fg)]",
  role: "bg-[var(--badge-role-bg)] text-[var(--badge-role-fg)]",
  danger: "bg-red-950 text-[var(--danger)]",
  warning: "bg-amber-950 text-amber-300",
  neutral: "bg-slate-800 text-slate-300",
} as const;

export function Badge({
  children,
  variant = "role",
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide whitespace-nowrap ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
