"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function crearPartido(formData: FormData) {
  await requireAdmin();

  const formato = String(formData.get("formato") ?? "futbol7");
  await prisma.partido.create({
    data: {
      fecha: String(formData.get("fecha")),
      hora: String(formData.get("hora")),
      cancha: String(formData.get("cancha")).trim(),
      cupoMax: Number(formData.get("cupoMax")),
      costoCancha: Number(formData.get("costoCancha")),
      costoPorJugador: Number(formData.get("costoPorJugador")),
      notas: String(formData.get("notas") ?? "").trim() || null,
      formato: formato === "futbol11" ? "futbol11" : "futbol7",
      numEquipos: Math.min(3, Math.max(2, Number(formData.get("numEquipos")) || 2)),
      arquerosMin: Math.max(0, Number(formData.get("arquerosMin")) || 0),
      arquerosMax: Math.max(1, Number(formData.get("arquerosMax")) || 2),
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
      formato: original.formato,
      numEquipos: original.numEquipos,
      arquerosMin: original.arquerosMin,
      arquerosMax: original.arquerosMax,
    },
  });
  revalidatePath("/dashboard/partidos");
}
