"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function crearEstadio(formData: FormData) {
  await requireAdmin();
  await prisma.estadio.create({
    data: {
      nombre: String(formData.get("nombre") ?? "").trim(),
      costoCancha: Number(formData.get("costoCancha")),
      costoPorJugador: Number(formData.get("costoPorJugador")),
    },
  });
  revalidatePath("/dashboard/configuracion");
}

export async function actualizarEstadio(formData: FormData) {
  await requireAdmin();
  await prisma.estadio.update({
    where: { id: Number(formData.get("estadioId")) },
    data: {
      nombre: String(formData.get("nombre") ?? "").trim(),
      costoCancha: Number(formData.get("costoCancha")),
      costoPorJugador: Number(formData.get("costoPorJugador")),
    },
  });
  revalidatePath("/dashboard/configuracion");
}

export async function cambiarEstadoEstadio(estadioId: number, activar: boolean) {
  await requireAdmin();
  await prisma.estadio.update({
    where: { id: estadioId },
    data: { estado: activar ? "activo" : "inactivo" },
  });
  revalidatePath("/dashboard/configuracion");
}

export async function subirFotoEstadio(formData: FormData) {
  await requireAdmin();
  const estadioId = Number(formData.get("estadioId"));
  const archivo = formData.get("foto") as File | null;
  if (!archivo || archivo.size === 0) throw new Error("Selecciona una foto.");
  if (archivo.size > 5 * 1024 * 1024) throw new Error("La foto pesa más de 5MB.");

  const bytes = Buffer.from(await archivo.arrayBuffer());
  await prisma.estadio.update({
    where: { id: estadioId },
    data: { fotoImg: bytes, fotoMime: archivo.type },
  });
  revalidatePath("/dashboard/configuracion");
}
