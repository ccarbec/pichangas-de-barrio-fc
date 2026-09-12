"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { redimensionarImagen } from "@/lib/imagenes";

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

export async function subirFotoEstadio(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const estadioId = Number(formData.get("estadioId"));
  const archivo = formData.get("foto") as File | null;
  if (!archivo || archivo.size === 0) return { error: "Selecciona una foto." };
  if (archivo.size > 5 * 1024 * 1024) return { error: "La foto pesa más de 5MB." };

  const original = Buffer.from(await archivo.arrayBuffer());
  const { bytes, mime } = await redimensionarImagen(original, 800);
  await prisma.estadio.update({
    where: { id: estadioId },
    data: { fotoImg: bytes, fotoMime: mime },
  });
  revalidatePath("/dashboard/configuracion");
  return {};
}
