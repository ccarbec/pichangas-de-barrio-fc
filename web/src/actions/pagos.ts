"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireLogin } from "@/lib/require-auth";
import { nombreCompleto } from "@/lib/estilos";

const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;

export async function registrarPago(formData: FormData): Promise<{ error?: string }> {
  const usuario = await requireLogin();

  const inscripcionId = Number(formData.get("inscripcionId"));
  const monto = Number(formData.get("monto"));
  const archivo = formData.get("comprobante") as File | null;

  if (usuario.rol !== "admin") {
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: inscripcionId },
      select: { jugador: { select: { usuarioId: true } } },
    });
    if (!inscripcion || inscripcion.jugador.usuarioId !== usuario.id) {
      return { error: "No autorizado." };
    }
  }

  if (!archivo || archivo.size === 0) return { error: "Sube un comprobante." };
  if (archivo.size > MAX_BYTES_IMAGEN) {
    return { error: `La imagen pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB — el máximo es 5 MB.` };
  }

  const bytes = Buffer.from(await archivo.arrayBuffer());
  const existente = await prisma.pago.findUnique({ where: { inscripcionId } });

  if (existente) {
    await prisma.pago.update({
      where: { id: existente.id },
      data: {
        monto,
        comprobanteImg: bytes,
        comprobanteMime: archivo.type,
        estado: "pendiente",
        fechaPago: new Date().toISOString(),
        verificadoPor: null,
        fechaVerificacion: null,
        nota: null,
      },
    });
  } else {
    await prisma.pago.create({
      data: {
        inscripcionId,
        monto,
        comprobanteImg: bytes,
        comprobanteMime: archivo.type,
        fechaPago: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/dashboard/partidos");
  return {};
}

export async function marcarPagoManual(inscripcionId: number, monto: number) {
  const admin = await requireAdmin();
  const existente = await prisma.pago.findUnique({ where: { inscripcionId } });

  if (existente) {
    await prisma.pago.update({
      where: { id: existente.id },
      data: {
        monto,
        estado: "verificado",
        metodoPago: "efectivo",
        verificadoPor: admin.id,
        fechaVerificacion: new Date().toISOString(),
        nota: null,
      },
    });
  } else {
    await prisma.pago.create({
      data: {
        inscripcionId,
        monto,
        estado: "verificado",
        metodoPago: "efectivo",
        verificadoPor: admin.id,
        fechaVerificacion: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/dashboard/partidos");
}

export async function verificarPago(pagoId: number) {
  const admin = await requireAdmin();
  await prisma.pago.update({
    where: { id: pagoId },
    data: { estado: "verificado", verificadoPor: admin.id, fechaVerificacion: new Date().toISOString(), nota: null },
  });
  revalidatePath("/dashboard/pagos");
}

export async function obtenerCuadre(partidoId: number) {
  await requireAdmin();
  const [recaudado, pendiente] = await Promise.all([
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: { estado: "verificado", inscripcion: { partidoId } },
    }),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: { estado: "pendiente", inscripcion: { partidoId } },
    }),
  ]);
  return {
    recaudado: recaudado._sum.monto ?? 0,
    pendiente: pendiente._sum.monto ?? 0,
  };
}

export async function obtenerPagosDePartido(partidoId: number) {
  await requireAdmin();
  const inscritos = await prisma.inscripcion.findMany({
    where: { partidoId, estado: { not: "cancelado" } },
    select: {
      id: true,
      estado: true,
      jugador: {
        select: { apellidos: true, apodo: true, usuario: { select: { nombre: true, telefono: true } } },
      },
      pago: { select: { id: true, monto: true, estado: true, metodoPago: true, comprobanteImg: true } },
    },
    orderBy: [{ jugador: { apellidos: "asc" } }],
  });
  return inscritos.map((i) => ({
    id: i.id,
    nombre: nombreCompleto(i.jugador),
    telefono: i.jugador.usuario.telefono,
    estadoInscripcion: i.estado,
    pagoId: i.pago?.id ?? null,
    monto: i.pago?.monto ?? null,
    estadoPago: i.pago?.estado ?? "sin_pago",
    metodoPago: i.pago?.metodoPago ?? null,
    tieneComprobante: i.pago?.comprobanteImg != null,
  }));
}

export async function rechazarPago(pagoId: number, nota: string) {
  const admin = await requireAdmin();
  await prisma.pago.update({
    where: { id: pagoId },
    data: { estado: "rechazado", verificadoPor: admin.id, nota: nota.trim() },
  });
  revalidatePath("/dashboard/pagos");
}
