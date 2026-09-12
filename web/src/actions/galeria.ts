"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { redimensionarImagenOError } from "@/lib/imagenes";

const MAX_BYTES_FOTO = 5 * 1024 * 1024;
const MAX_BYTES_VIDEO = 20 * 1024 * 1024;

export async function subirGaleria(formData: FormData): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  const archivo = formData.get("archivo") as File | null;
  if (!archivo || archivo.size === 0) return { error: "Selecciona una foto o video." };

  const esVideo = archivo.type.startsWith("video/");
  const esFoto = archivo.type.startsWith("image/");
  if (!esVideo && !esFoto) return { error: "Solo se aceptan fotos o videos." };

  const limite = esVideo ? MAX_BYTES_VIDEO : MAX_BYTES_FOTO;
  if (archivo.size > limite) {
    return {
      error: `El archivo pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB — el máximo es ${limite / 1024 / 1024} MB para ${esVideo ? "videos" : "fotos"}.`,
    };
  }

  const partidoIdRaw = formData.get("partidoId");
  const partidoId = partidoIdRaw ? Number(partidoIdRaw) : null;
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  const original = Buffer.from(await archivo.arrayBuffer());
  let bytes: Uint8Array<ArrayBuffer> = new Uint8Array(
    original.buffer.slice(original.byteOffset, original.byteOffset + original.byteLength) as ArrayBuffer
  );
  let mime = archivo.type;
  if (esFoto) {
    const resultado = await redimensionarImagenOError(original, 1600);
    if ("error" in resultado) return { error: resultado.error };
    bytes = resultado.bytes;
    mime = resultado.mime;
  }
  await prisma.galeriaItem.create({
    data: {
      partidoId,
      subidoPorId: admin.id,
      tipo: esVideo ? "video" : "foto",
      archivo: bytes,
      mime,
      descripcion,
      fechaSubida: new Date().toISOString(),
    },
  });

  revalidatePath("/dashboard/galeria");
  return {};
}

export async function eliminarGaleriaItem(id: number) {
  await requireAdmin();
  await prisma.galeriaItem.delete({ where: { id } });
  revalidatePath("/dashboard/galeria");
}
