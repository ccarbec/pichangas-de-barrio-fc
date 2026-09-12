"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireLogin } from "@/lib/require-auth";

const MAX_ARQUEROS_POR_PARTIDO = 2;

// El cupo (general y de arqueros) se decide DENTRO de esta única sentencia
// SQL — no con un SELECT para contar y despué un INSERT/UPDATE separado.
// Si dos jugadores confirman en el mismo instante, cada conexión ejecuta esta
// sentencia como una unidad atómica: SQLite serializa los escritores, así que
// la segunda sentencia en llegar siempre cuenta los cupos ya con el efecto de
// la primera aplicado. Con el patrón anterior (leer cupos, decidir en código,
// recién ahí escribir) ambas lecturas podían ocurrir antes de que cualquiera
// escribiera, dejando confirmar de más jugadores o arqueros que el límite.
async function inscribirJugadorInterno(
  partidoId: number,
  jugadorId: number,
  cupoMax: number
): Promise<"confirmado" | "lista_espera"> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO inscripciones (partido_id, jugador_id, estado, fecha_inscripcion)
      VALUES (
        ${partidoId},
        ${jugadorId},
        CASE
          WHEN (
            SELECT COUNT(*) FROM inscripciones WHERE partido_id = ${partidoId} AND estado = 'confirmado'
          ) >= ${cupoMax}
            THEN 'lista_espera'
          WHEN (
            SELECT LOWER(COALESCE(posicion, '')) LIKE '%arquero%' OR LOWER(COALESCE(posicion, '')) LIKE '%portero%'
            FROM jugadores WHERE id = ${jugadorId}
          ) AND (
            SELECT COUNT(*) FROM inscripciones i
            JOIN jugadores j ON j.id = i.jugador_id
            WHERE i.partido_id = ${partidoId} AND i.estado = 'confirmado'
              AND (LOWER(COALESCE(j.posicion, '')) LIKE '%arquero%' OR LOWER(COALESCE(j.posicion, '')) LIKE '%portero%')
          ) >= ${MAX_ARQUEROS_POR_PARTIDO}
            THEN 'lista_espera'
          ELSE 'confirmado'
        END,
        datetime('now','localtime')
      )
      ON CONFLICT(partido_id, jugador_id) DO UPDATE SET
        estado = excluded.estado,
        asistio = NULL
    `;
    const actualizado = await tx.inscripcion.findUniqueOrThrow({
      where: { partidoId_jugadorId: { partidoId, jugadorId } },
    });
    return actualizado.estado as "confirmado" | "lista_espera";
  });
}

export async function confirmarAsistencia(partidoId: number): Promise<{ error?: string }> {
  const usuario = await requireLogin();
  const jugador = await prisma.jugador.findUnique({ where: { usuarioId: usuario.id } });
  if (!jugador) return { error: "No tienes perfil de jugador." };

  const tieneMultaPendiente = await prisma.multa.findFirst({
    where: { jugadorId: jugador.id, tipo: "no_asistio", estado: { not: "pagado" } },
  });
  if (tieneMultaPendiente) {
    return { error: "Tienes una multa por no asistencia sin pagar — no puedes confirmar." };
  }

  const partido = await prisma.partido.findUniqueOrThrow({ where: { id: partidoId } });
  await inscribirJugadorInterno(partidoId, jugador.id, partido.cupoMax);
  revalidatePath("/dashboard/partidos");
  return {};
}

export async function agregarJugadorAPartido(partidoId: number, jugadorId: number): Promise<{ error?: string }> {
  await requireAdmin();
  const tieneMultaPendiente = await prisma.multa.findFirst({
    where: { jugadorId, tipo: "no_asistio", estado: { not: "pagado" } },
  });
  if (tieneMultaPendiente) {
    return { error: "Ese jugador tiene una multa por no asistencia sin pagar." };
  }
  const partido = await prisma.partido.findUniqueOrThrow({ where: { id: partidoId } });
  await inscribirJugadorInterno(partidoId, jugadorId, partido.cupoMax);
  revalidatePath("/dashboard/partidos");
  return {};
}

export async function cancelarInscripcion(inscripcionId: number) {
  await requireLogin();

  const inscripcion = await prisma.inscripcion.findUniqueOrThrow({ where: { id: inscripcionId } });

  // Misma idea que inscribirJugadorInterno: elegir "a quién le toca" y
  // confirmarlo es una sola sentencia UPDATE con el candidato como subquery,
  // no un SELECT para elegir y después un UPDATE aparte — así dos
  // cancelaciones concurrentes del mismo partido nunca promueven al mismo
  // candidato dos veces, ni suben a un segundo arquero cuando solo se liberó
  // un cupo de arquero.
  const promovidoJugadorId = await prisma.$transaction(async (tx) => {
    await tx.inscripcion.update({ where: { id: inscripcionId }, data: { estado: "cancelado" } });

    if (inscripcion.estado !== "confirmado") return null;

    const filas = await tx.$queryRaw<{ jugador_id: number }[]>`
      UPDATE inscripciones
      SET estado = 'confirmado'
      WHERE id = (
        SELECT i.id FROM inscripciones i
        JOIN jugadores j ON j.id = i.jugador_id
        WHERE i.partido_id = ${inscripcion.partidoId}
          AND i.estado = 'lista_espera'
          AND (
            NOT (LOWER(COALESCE(j.posicion, '')) LIKE '%arquero%' OR LOWER(COALESCE(j.posicion, '')) LIKE '%portero%')
            OR (
              SELECT COUNT(*) FROM inscripciones i2
              JOIN jugadores j2 ON j2.id = i2.jugador_id
              WHERE i2.partido_id = ${inscripcion.partidoId} AND i2.estado = 'confirmado'
                AND (LOWER(COALESCE(j2.posicion, '')) LIKE '%arquero%' OR LOWER(COALESCE(j2.posicion, '')) LIKE '%portero%')
            ) < ${MAX_ARQUEROS_POR_PARTIDO}
          )
        ORDER BY i.fecha_inscripcion ASC
        LIMIT 1
      )
      RETURNING jugador_id
    `;
    return filas[0]?.jugador_id ?? null;
  });

  revalidatePath("/dashboard/partidos");

  if (promovidoJugadorId == null) return null;
  const jugador = await prisma.jugador.findUnique({
    where: { id: promovidoJugadorId },
    select: { apodo: true, usuario: { select: { nombre: true } } },
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
): Promise<{ error?: string }> {
  await requireAdmin();
  if (cambios.length === 0) return {};

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
  return {};
}

export async function guardarPosicionEnCancha(
  inscripcionId: number,
  equipo: "A" | "B",
  posX: number,
  posY: number
) {
  await requireAdmin();
  await prisma.inscripcion.update({
    where: { id: inscripcionId },
    data: {
      equipo,
      posX: Math.min(100, Math.max(0, posX)),
      posY: Math.min(100, Math.max(0, posY)),
    },
  });
  revalidatePath("/dashboard/partidos");
}

export async function guardarFormacionInicial(
  asignaciones: { inscripcionId: number; equipo: "A" | "B"; posX: number; posY: number }[]
) {
  await requireAdmin();
  if (asignaciones.length === 0) return;
  await prisma.$transaction(
    asignaciones.map((a) =>
      prisma.inscripcion.update({
        where: { id: a.inscripcionId },
        data: { equipo: a.equipo, posX: a.posX, posY: a.posY },
      })
    )
  );
  revalidatePath("/dashboard/partidos");
}

export async function guardarEventosPartido(
  inscripcionId: number,
  datos: { goles?: number; amarillas?: number; roja?: boolean }
) {
  await requireAdmin();
  await prisma.inscripcion.update({
    where: { id: inscripcionId },
    data: {
      goles: datos.goles != null ? Math.max(0, datos.goles) : undefined,
      amarillas: datos.amarillas != null ? Math.max(0, Math.min(2, datos.amarillas)) : undefined,
      roja: datos.roja,
    },
  });
  revalidatePath("/dashboard/partidos");
}
