import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";
import { aDataUrl } from "@/lib/imagenes";
import { ConfiguracionTabs } from "./ConfiguracionTabs";

export default async function ConfiguracionPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const [estadios, config] = await Promise.all([
    prisma.estadio.findMany({ orderBy: { nombre: "asc" } }),
    prisma.clubConfig.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <ConfiguracionTabs
      estadios={estadios.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        costoCancha: e.costoCancha,
        costoPorJugador: e.costoPorJugador,
        estado: e.estado,
        foto: aDataUrl(e.fotoImg, e.fotoMime),
      }))}
      config={{
        nombreYape: config?.nombreYape ?? "",
        telefonoYape: config?.telefonoYape ?? "",
        montoMultaTardanza: config?.montoMultaTardanza ?? 5,
        montoMultaNoAsistio: config?.montoMultaNoAsistio ?? 10,
      }}
    />
  );
}
