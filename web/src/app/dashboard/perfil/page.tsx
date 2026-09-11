import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";
import { aDataUrl } from "@/lib/imagenes";
import { PerfilForm } from "./PerfilForm";
import { ActivarPerfilForm } from "./ActivarPerfilForm";

export default async function PerfilPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const jugador = await prisma.jugador.findUnique({ where: { usuarioId: usuario.id } });

  if (!jugador) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-2xl font-bold">👤 Mi Perfil</h1>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Todavía no tienes un perfil de jugador — actívalo para confirmar asistencia y aparecer en las
          pichangas, sin dejar de ser presidente.
        </p>
        <ActivarPerfilForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">👤 Mi Perfil</h1>
      <PerfilForm
        jugador={{
          id: jugador.id,
          nombre: usuario.nombre,
          apellidos: jugador.apellidos,
          apodo: jugador.apodo,
          posicion: jugador.posicion,
          equipoHincha: jugador.equipoHincha,
          camiseta: jugador.camiseta,
          resena: jugador.resena,
          foto: aDataUrl(jugador.fotoImg, jugador.fotoMime),
        }}
      />
    </div>
  );
}
