"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function crearPartido(formData: FormData) {
  await requireAdmin();

  await prisma.partido.create({
    data: {
      fecha: String(formData.get("fecha")),
      hora: String(formData.get("hora")),
      cancha: String(formData.get("cancha")).trim(),
      cupoMax: Number(formData.get("cupoMax")),
      costoCancha: Number(formData.get("costoCancha")),
      costoPorJugador: Number(formData.get("costoPorJugador")),
      notas: String(formData.get("notas") ?? "").trim() || null,
    },
  });

  revalidatePath("/dashboard/partidos");
}

export async function cambiarEstadoPartido(partidoId: number, estado: string) {
  await requireAdmin();
  await prisma.partido.update({ where: { id: partidoId }, data: { estado } });
  revalidatePath("/dashboard/partidos");
}

export async function duplicarPartido(partidoId: number, nuevaFecha: string, nuevaHora: string) {
  await requireAdmin();
  const original = await prisma.partido.findUniqueOrThrow({ where: { id: partidoId } });
  await prisma.partido.create({
    data: {
      fecha: nuevaFecha,
      hora: nuevaHora,
      cancha: original.cancha,
      cupoMax: original.cupoMax,
      costoCancha: original.costoCancha,
      costoPorJugador: original.costoPorJugador,
      notas: original.notas,
    },
  });
  revalidatePath("/dashboard/partidos");
}
