import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ pagoId: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { pagoId } = await params;
  const pago = await prisma.pago.findUnique({
    where: { id: Number(pagoId) },
    select: { comprobanteImg: true, comprobanteMime: true },
  });
  if (!pago || !pago.comprobanteImg || !pago.comprobanteMime) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  return new NextResponse(new Uint8Array(pago.comprobanteImg), {
    headers: {
      "Content-Type": pago.comprobanteMime,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
