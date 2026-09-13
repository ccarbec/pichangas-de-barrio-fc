import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";
import { aDataUrl } from "@/lib/imagenes";
import { Estrellas } from "../../components/Estrellas";
import { PerfilForm } from "./PerfilForm";
import { ActivarPerfilForm } from "./ActivarPerfilForm";

const CAMPOS_STAT = [
  ["Velocidad", "statVelocidad"],
  ["Técnica", "statTecnica"],
  ["Defensa", "statDefensa"],
  ["Físico", "statFisico"],
] as const;

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

      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          ⚖️ Mis estadísticas
        </p>
        <div className="flex flex-col gap-2">
          {CAMPOS_STAT.map(([label, campo]) => (
            <div key={campo} className="flex items-center justify-between gap-3">
              <span className="text-sm">{label}</span>
              <Estrellas valor={jugador[campo]} label={label} readOnly />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Estas estadísticas las evalúa el administrador durante las pichangas.
        </p>
      </div>

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
