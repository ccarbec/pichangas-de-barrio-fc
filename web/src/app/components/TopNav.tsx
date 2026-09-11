import { Bell } from "lucide-react";

const TABS = ["INICIO", "NOTICIAS", "CALENDARIO", "GALERÍA"];

export function TopNav({ nombre }: { nombre: string }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/40 px-6 py-3">
      <nav className="hidden gap-6 text-sm font-medium text-[var(--muted)] sm:flex">
        {TABS.map((tab) => (
          <span key={tab} className="cursor-pointer hover:text-[var(--foreground)]">
            {tab}
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <button className="relative text-[var(--muted)] hover:text-[var(--foreground)]">
          <Bell size={20} />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--danger)]" />
        </button>
        <span className="text-sm font-medium">{nombre}</span>
        <div className="h-8 w-8 rounded-full bg-[var(--accent)]" />
      </div>
    </header>
  );
}
