"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Menu, LogOut, UserCircle, Eye } from "lucide-react";
import { logout, alternarVistaJugador } from "@/actions/auth";

export function TopNav({
  nombre,
  esAdmin,
  esAdminReal,
  vistaJugador,
  onAbrirMenu,
}: {
  nombre: string;
  esAdmin: boolean;
  esAdminReal: boolean;
  vistaJugador: boolean;
  onAbrirMenu: () => void;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/40 px-4 py-3 sm:px-6">
      <button onClick={onAbrirMenu} className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)] md:hidden">
        <Menu size={22} />
      </button>
      <span className="hidden text-sm font-medium text-[var(--muted)] md:block" />

      <div className="flex items-center gap-3">
        {!esAdmin && (
          <Link
            href="/dashboard/perfil"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <UserCircle size={16} /> Mi Perfil
          </Link>
        )}
        <div className="relative flex items-center gap-3">
          <span className="hidden text-sm font-medium sm:block">{nombre}</span>
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="h-8 w-8 rounded-full bg-[var(--accent)] font-semibold text-[var(--accent-foreground)]"
          >
            {nombre.charAt(0).toUpperCase()}
          </button>
          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
              <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl">
                {esAdminReal && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setMenuAbierto(false);
                      startTransition(() => alternarVistaJugador(!vistaJugador));
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:opacity-50"
                  >
                    <Eye size={16} /> {vistaJugador ? "Ver como admin" : "Ver como jugador"}
                  </button>
                )}
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  >
                    <LogOut size={16} /> Cerrar sesión
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
