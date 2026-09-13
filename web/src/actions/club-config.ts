"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { redimensionarImagenOError } from "@/lib/imagenes";

export async function guardarClubConfig(formData: FormData) {
  await requireAdmin();
  await prisma.clubConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      nombreYape: String(formData.get("nombreYape") ?? "").trim(),
      telefonoYape: String(formData.get("telefonoYape") ?? "").trim(),
      montoMultaTardanza: Number(formData.get("montoMultaTardanza")),
      montoMultaNoAsistio: Number(formData.get("montoMultaNoAsistio")),
    },
    update: {
      nombreYape: String(formData.get("nombreYape") ?? "").trim(),
      telefonoYape: String(formData.get("telefonoYape") ?? "").trim(),
      montoMultaTardanza: Number(formData.get("montoMultaTardanza")),
      montoMultaNoAsistio: Number(formData.get("montoMultaNoAsistio")),
    },
  });
  revalidatePath("/dashboard/configuracion");
}

export async function subirQrYape(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const archivo = formData.get("qr") as File | null;
  if (!archivo || archivo.size === 0) return { error: "Selecciona una imagen." };
  if (archivo.size > 5 * 1024 * 1024) return { error: "La imagen pesa más de 5MB." };

  const original = Buffer.from(await archivo.arrayBuffer());
  const resultado = await redimensionarImagenOError(original, 800);
  if ("error" in resultado) return { error: resultado.error };
  const { bytes, mime } = resultado;

  await prisma.clubConfig.upsert({
    where: { id: 1 },
    create: { id: 1, qrYapeImg: bytes, qrYapeMime: mime },
    update: { qrYapeImg: bytes, qrYapeMime: mime },
  });
  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard/partidos");
  return {};
}
