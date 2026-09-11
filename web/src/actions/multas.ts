"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireLogin } from "@/lib/require-auth";

const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;

export async function subirComprobanteMulta(formData: FormData): Promise<{ error?: string }> {
  const usuario = await requireLogin();
  const multaId = Number(formData.get("multaId"));
  const archivo = formData.get("comprobante") as File | null;

  if (usuario.rol !== "admin") {
    const multa = await prisma.multa.findUnique({
      where: { id: multaId },
      select: { jugador: { select: { usuarioId: true } } },
    });
    if (!multa || multa.jugador.usuarioId !== usuario.id) {
      return { error: "No autorizado." };
    }
  }

  if (!archivo || archivo.size === 0) return { error: "Sube un comprobante." };
  if (archivo.size > MAX_BYTES_IMAGEN) {
    return { error: `La imagen pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB — el máximo es 5 MB.` };
  }
  const bytes = Buffer.from(await archivo.arrayBuffer());

  await prisma.multa.update({
    where: { id: multaId },
    data: {
      estado: "pendiente_verificacion",
      comprobanteImg: bytes,
      comprobanteMime: archivo.type,
      metodoPago: "yape",
      nota: null,
    },
  });
  revalidatePath("/dashboard/partidos");
  return {};
}

export async function marcarMultaPagadaEfectivo(multaId: number) {
  const admin = await requireAdmin();
  await prisma.multa.update({
    where: { id: multaId },
    data: {
      estado: "pagado",
      metodoPago: "efectivo",
      verificadoPor: admin.id,
      fechaPago: new Date().toISOString(),
      nota: null,
    },
  });
  revalidatePath("/dashboard/partidos");
  revalidatePath("/dashboard/pagos");
}

export async function verificarMulta(multaId: number) {
  const admin = await requireAdmin();
  await prisma.multa.update({
    where: { id: multaId },
    data: { estado: "pagado", verificadoPor: admin.id, fechaPago: new Date().toISOString(), nota: null },
  });
  revalidatePath("/dashboard/pagos");
}

export async function rechazarMulta(multaId: number, nota: string) {
  const admin = await requireAdmin();
  await prisma.multa.update({
    where: { id: multaId },
    data: { estado: "debe", verificadoPor: admin.id, nota: nota.trim() },
  });
  revalidatePath("/dashboard/pagos");
}
