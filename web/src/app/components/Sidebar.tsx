"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  CalendarDays,
  ClipboardList,
  Images,
  Users,
  UserCircle,
} from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Centro de Comando", icon: LayoutDashboard },
  { href: "/dashboard/partidos", label: "Partidos", icon: ClipboardList },
  { href: "/dashboard/noticias", label: "Noticias", icon: Newspaper },
  { href: "/dashboard/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/dashboard/galerias", label: "Galerías", icon: Images },
  { href: "/dashboard/miembros", label: "Gestión Miembros", icon: Users },
  { href: "/dashboard/perfil", label: "Mi Perfil", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-[var(--surface)]/60 p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="text-2xl">⚽</span>
        <span className="text-sm font-bold tracking-wide">PICHANGAS DE BARRIO FC</span>
      </div>
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-[var(--accent)] font-semibold text-[var(--accent-foreground)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
