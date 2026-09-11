"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireLogin } from "@/lib/require-auth";

async function inscribirJugadorInterno(partidoId: number, jugadorId: number, cupoMax: number) {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.inscripcion.findUnique({
      where: { partidoId_jugadorId: { partidoId, jugadorId } },
    });
    const confirmados = await tx.inscripcion.count({ where: { partidoId, estado: "confirmado" } });
    const nuevoEstado = confirmados < cupoMax ? "confirmado" : "lista_espera";

    if (existente) {
      await tx.inscripcion.update({
        where: { id: existente.id },
        data: { estado: nuevoEstado, asistio: null },
      });
    } else {
      await tx.inscripcion.create({ data: { partidoId, jugadorId, estado: nuevoEstado } });
    }
    return nuevoEstado;
  });
}

export async function confirmarAsistencia(partidoId: number) {
  const usuario = await requireLogin();
  const jugador = await prisma.jugador.findUnique({ where: { usuarioId: usuario.id } });
  if (!jugador) throw new Error("No tienes perfil de jugador.");

  const tieneMultaPendiente = await prisma.multa.findFirst({
    where: { jugadorId: jugador.id, tipo: "no_asistio", estado: { not: "pagado" } },
  });
  if (tieneMultaPendiente) {
    throw new Error("Tienes una multa por no asistencia sin pagar — no puedes confirmar.");
  }

  const partido = await prisma.partido.findUniqueOrThrow({ where: { id: partidoId } });
  const estado = await inscribirJugadorInterno(partidoId, jugador.id, partido.cupoMax);
  revalidatePath("/dashboard/partidos");
  return estado;
}

export async function agregarJugadorAPartido(partidoId: number, jugadorId: number) {
  await requireAdmin();
  const tieneMultaPendiente = await prisma.multa.findFirst({
    where: { jugadorId, tipo: "no_asistio", estado: { not: "pagado" } },
  });
  if (tieneMultaPendiente) {
    throw new Error("Ese jugador tiene una multa por no asistencia sin pagar.");
  }
  const partido = await prisma.partido.findUniqueOrThrow({ where: { id: partidoId } });
  const estado = await inscribirJugadorInterno(partidoId, jugadorId, partido.cupoMax);
  revalidatePath("/dashboard/partidos");
  return estado;
}

export async function cancelarInscripcion(inscripcionId: number) {
  await requireLogin();

  const inscripcion = await prisma.inscripcion.findUniqueOrThrow({ where: { id: inscripcionId } });

  const promovidoJugadorId = await prisma.$transaction(async (tx) => {
    await tx.inscripcion.update({ where: { id: inscripcionId }, data: { estado: "cancelado" } });

    if (inscripcion.estado !== "confirmado") return null;

    const siguiente = await tx.inscripcion.findFirst({
      where: { partidoId: inscripcion.partidoId, estado: "lista_espera" },
      orderBy: { fechaInscripcion: "asc" },
    });
    if (!siguiente) return null;

    await tx.inscripcion.update({ where: { id: siguiente.id }, data: { estado: "confirmado" } });
    return siguiente.jugadorId;
  });

  revalidatePath("/dashboard/partidos");

  if (promovidoJugadorId == null) return null;
  const jugador = await prisma.jugador.findUnique({
    where: { id: promovidoJugadorId },
    include: { usuario: true },
  });
  return jugador ? { nombre: jugador.usuario.nombre, apodo: jugador.apodo } : null;
}

export async function reemplazarJugador(inscripcionNoLlegoId: number, jugadorReemplazoId: number) {
  await requireAdmin();
  const original = await prisma.inscripcion.findUniqueOrThrow({ where: { id: inscripcionNoLlegoId } });

  const existente = await prisma.inscripcion.findUnique({
    where: { partidoId_jugadorId: { partidoId: original.partidoId, jugadorId: jugadorReemplazoId } },
  });
  if (existente) {
    await prisma.inscripcion.update({ where: { id: existente.id }, data: { estado: "confirmado", asistio: null } });
  } else {
    await prisma.inscripcion.create({
      data: { partidoId: original.partidoId, jugadorId: jugadorReemplazoId, estado: "confirmado" },
    });
  }
  revalidatePath("/dashboard/partidos");
}

export async function marcarAsistenciaMultiple(
  partidoId: number,
  cambios: { inscripcionId: number; jugadorId: number; estado: string | null }[]
) {
  await requireAdmin();
  if (cambios.length === 0) return;

  const config = await prisma.clubConfig.findUnique({ where: { id: 1 } });
  const montoTardanza = config?.montoMultaTardanza ?? 5;
  const montoNoAsistio = config?.montoMultaNoAsistio ?? 10;

  await prisma.$transaction(async (tx) => {
    for (const c of cambios) {
      await tx.inscripcion.update({ where: { id: c.inscripcionId }, data: { asistio: c.estado } });
    }

    const jugadorIds = cambios.map((c) => c.jugadorId);
    await tx.multa.deleteMany({
      where: {
        partidoId,
        jugadorId: { in: jugadorIds },
        tipo: { in: ["tardanza", "no_asistio"] },
        estado: { not: "pagado" },
      },
    });

    for (const c of cambios) {
      if (c.estado === "tardanza") {
        await tx.multa.create({
          data: { jugadorId: c.jugadorId, partidoId, tipo: "tardanza", monto: montoTardanza },
        });
      } else if (c.estado === "no_llego") {
        await tx.multa.create({
          data: { jugadorId: c.jugadorId, partidoId, tipo: "no_asistio", monto: montoNoAsistio },
        });
      }
    }
  });

  revalidatePath("/dashboard/partidos");
}
