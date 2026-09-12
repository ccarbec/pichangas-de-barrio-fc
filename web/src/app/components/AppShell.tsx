"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppShell({
  nombre,
  esAdmin,
  esAdminReal,
  vistaJugador,
  children,
}: {
  nombre: string;
  esAdmin: boolean;
  esAdminReal: boolean;
  vistaJugador: boolean;
  children: React.ReactNode;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar esAdmin={esAdmin} abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          nombre={nombre}
          esAdmin={esAdmin}
          esAdminReal={esAdminReal}
          vistaJugador={vistaJugador}
          onAbrirMenu={() => setMenuAbierto(true)}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
