const VARIANTS = {
  active: "bg-[var(--badge-active-bg)] text-[var(--badge-active-fg)]",
  role: "bg-[var(--badge-role-bg)] text-[var(--badge-role-fg)]",
  danger: "bg-red-950 text-[var(--danger)]",
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
