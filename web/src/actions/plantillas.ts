"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { TIPOS_PLANTILLA, type TipoPlantilla } from "@/lib/plantillas";

export async function listarPlantillas(): Promise<Record<TipoPlantilla, { id: number; texto: string }[]>> {
  await requireAdmin();
  const plantillas = await prisma.plantillaMensaje.findMany({ orderBy: { id: "asc" } });
  const porTipo = {
    recordatorio: [],
    pago_pendiente: [],
    cupo_liberado: [],
    promovido: [],
  } as Record<TipoPlantilla, { id: number; texto: string }[]>;
  for (const p of plantillas) {
    if (p.tipo in porTipo) porTipo[p.tipo as TipoPlantilla].push({ id: p.id, texto: p.texto });
  }
  return porTipo;
}

export async function crearPlantilla(tipo: string, texto: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!TIPOS_PLANTILLA.includes(tipo as TipoPlantilla)) return { error: "Tipo de mensaje inválido." };
  const limpio = texto.trim();
  if (!limpio) return { error: "Escribe el mensaje." };

  await prisma.plantillaMensaje.create({
    data: { tipo, texto: limpio, fechaCreacion: new Date().toISOString() },
  });
  revalidatePath("/dashboard/configuracion");
  return {};
}

export async function actualizarPlantilla(id: number, texto: string): Promise<{ error?: string }> {
  await requireAdmin();
  const limpio = texto.trim();
  if (!limpio) return { error: "Escribe el mensaje." };

  await prisma.plantillaMensaje.update({ where: { id }, data: { texto: limpio } });
  revalidatePath("/dashboard/configuracion");
  return {};
}

export async function eliminarPlantilla(id: number): Promise<{ error?: string }> {
  await requireAdmin();
  const plantilla = await prisma.plantillaMensaje.findUnique({ where: { id } });
  if (!plantilla) return { error: "Ese mensaje ya no existe." };

  const restantes = await prisma.plantillaMensaje.count({ where: { tipo: plantilla.tipo } });
  if (restantes <= 1) return { error: "Debe quedar al menos un mensaje de este tipo — agrega otro antes de borrar este." };

  await prisma.plantillaMensaje.delete({ where: { id } });
  revalidatePath("/dashboard/configuracion");
  return {};
}
