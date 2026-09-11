"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

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
