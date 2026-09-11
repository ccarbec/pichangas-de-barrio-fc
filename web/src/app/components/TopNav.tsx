"use client";

import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { logout } from "@/actions/auth";

export function TopNav({ nombre, onAbrirMenu }: { nombre: string; onAbrirMenu: () => void }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/40 px-4 py-3 sm:px-6">
      <button onClick={onAbrirMenu} className="text-[var(--muted)] hover:text-[var(--foreground)] md:hidden">
        <Menu size={22} />
      </button>
      <span className="hidden text-sm font-medium text-[var(--muted)] md:block" />

      <div className="relative flex items-center gap-3">
        <span className="text-sm font-medium">{nombre}</span>
        <button
          onClick={() => setMenuAbierto((v) => !v)}
          className="h-8 w-8 rounded-full bg-[var(--accent)] font-semibold text-[var(--accent-foreground)]"
        >
          {nombre.charAt(0).toUpperCase()}
        </button>
        {menuAbierto && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
            <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
