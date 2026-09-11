import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  const item = await prisma.galeriaItem.findUnique({
    where: { id: Number(id) },
    select: { archivo: true, mime: true },
  });
  if (!item) return new NextResponse("No encontrado", { status: 404 });

  return new NextResponse(new Uint8Array(item.archivo), {
    headers: {
      "Content-Type": item.mime,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
