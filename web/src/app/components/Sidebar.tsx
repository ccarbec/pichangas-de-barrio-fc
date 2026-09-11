"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Wallet,
  Users,
  Trophy,
  Settings,
  UserCircle,
  Images,
  Contact,
  X,
} from "lucide-react";

const ITEMS_ADMIN = [
  { href: "/dashboard", label: "Centro de Comando", icon: LayoutDashboard },
  { href: "/dashboard/partidos", label: "Partidos", icon: ClipboardList },
  { href: "/dashboard/pagos", label: "Pagos", icon: Wallet },
  { href: "/dashboard/miembros", label: "Gestión Miembros", icon: Users },
  { href: "/dashboard/tabla-club", label: "Tabla del Club", icon: Trophy },
  { href: "/dashboard/galeria", label: "Galería", icon: Images },
  { href: "/dashboard/perfiles", label: "Perfiles del Club", icon: Contact },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/perfil", label: "Mi Perfil", icon: UserCircle },
];

const ITEMS_JUGADOR = [
  { href: "/dashboard", label: "Centro de Comando", icon: LayoutDashboard },
  { href: "/dashboard/partidos", label: "Partidos", icon: ClipboardList },
  { href: "/dashboard/tabla-club", label: "Tabla del Club", icon: Trophy },
  { href: "/dashboard/galeria", label: "Galería", icon: Images },
  { href: "/dashboard/perfiles", label: "Perfiles del Club", icon: Contact },
  { href: "/dashboard/perfil", label: "Mi Perfil", icon: UserCircle },
];

export function Sidebar({
  esAdmin,
  abierto,
  onCerrar,
}: {
  esAdmin: boolean;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const pathname = usePathname();
  const items = esAdmin ? ITEMS_ADMIN : ITEMS_JUGADOR;

  const contenido = (
    <>
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="text-sm font-bold tracking-wide">PICHANGAS DE BARRIO FC</span>
        </div>
        <button onClick={onCerrar} className="text-[var(--muted)] md:hidden">
          <X size={20} />
        </button>
      </div>
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onCerrar}
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
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-[var(--surface)]/60 p-4 md:flex">
        {contenido}
      </aside>

      {/* Mobile drawer */}
      {abierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onCerrar} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col gap-1 bg-[var(--surface)] p-4 shadow-2xl">
            {contenido}
          </aside>
        </div>
      )}
    </>
  );
}
