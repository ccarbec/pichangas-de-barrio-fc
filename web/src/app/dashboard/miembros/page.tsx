import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";
import { aDataUrl } from "@/lib/imagenes";
import { MiembrosCrud } from "./MiembrosCrud";

export default async function MiembrosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const jugadores = await prisma.jugador.findMany({
    orderBy: [{ apellidos: "asc" }, { usuario: { nombre: "asc" } }],
    include: { usuario: true },
  });

  const jugadoresConHistorial = await prisma.inscripcion.findMany({
    select: { jugadorId: true },
    distinct: ["jugadorId"],
  });
  const idsConHistorial = new Set(jugadoresConHistorial.map((i) => i.jugadorId));

  const data = jugadores.map((j) => ({
    id: j.id,
    usuarioId: j.usuarioId,
    nombre: j.usuario.nombre,
    apellidos: j.apellidos,
    apodo: j.apodo,
    posicion: j.posicion,
    equipoHincha: j.equipoHincha,
    camiseta: j.camiseta,
    telefono: j.usuario.telefono,
    rol: j.usuario.rol,
    estado: j.estado,
    foto: aDataUrl(j.fotoImg, j.fotoMime),
    tieneHistorial: idsConHistorial.has(j.id),
  }));

  return <MiembrosCrud jugadores={data} />;
}
