import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";
import { GaleriaGrid } from "./GaleriaGrid";
import { GaleriaUploadForm } from "./GaleriaUploadForm";

export default async function GaleriaPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  const esAdmin = usuario.rol === "admin";

  const [items, partidos] = await Promise.all([
    prisma.galeriaItem.findMany({
      select: {
        id: true,
        tipo: true,
        mime: true,
        descripcion: true,
        fechaSubida: true,
        partido: { select: { fecha: true, hora: true, cancha: true } },
        subidoPor: { select: { nombre: true } },
      },
      orderBy: { id: "desc" },
    }),
    prisma.partido.findMany({ orderBy: [{ fecha: "desc" }] }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">📸 Galería</h1>
        <p className="text-sm text-[var(--muted)]">Fotos y videos de las pichangas del club.</p>
      </div>

      {esAdmin && (
        <GaleriaUploadForm
          partidos={partidos.map((p) => ({ id: p.id, etiqueta: `${p.fecha} ${p.hora} — ${p.cancha}` }))}
        />
      )}

      <GaleriaGrid
        items={items.map((i) => ({
          id: i.id,
          tipo: i.tipo,
          mime: i.mime,
          descripcion: i.descripcion,
          fechaSubida: i.fechaSubida,
          partidoEtiqueta: i.partido ? `${i.partido.fecha} ${i.partido.hora} — ${i.partido.cancha}` : null,
          subidoPor: i.subidoPor.nombre,
        }))}
        esAdmin={esAdmin}
      />
    </div>
  );
}
