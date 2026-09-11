export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-7 w-48 rounded-lg bg-[var(--surface)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-xl bg-[var(--surface)]" />
        <div className="h-24 rounded-xl bg-[var(--surface)]" />
        <div className="h-24 rounded-xl bg-[var(--surface)]" />
      </div>
      <div className="h-40 rounded-xl bg-[var(--surface)]" />
      <div className="h-40 rounded-xl bg-[var(--surface)]" />
    </div>
  );
}
