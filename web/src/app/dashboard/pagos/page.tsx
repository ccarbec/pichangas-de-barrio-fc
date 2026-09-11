import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";
import { aDataUrl } from "@/lib/imagenes";
import { PagosPendientesTab } from "./PagosPendientesTab";
import { MultasTab } from "./MultasTab";
import { CuadreTab } from "./CuadreTab";
import { PagosPorPartidoTab } from "./PagosPorPartidoTab";

export default async function PagosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const [pagosPendientes, multasPendientesVerificacion, todasMultasPendientes, partidos] = await Promise.all([
    prisma.pago.findMany({
      where: { estado: "pendiente" },
      include: {
        inscripcion: { include: { jugador: { include: { usuario: true } }, partido: true } },
      },
      orderBy: { fechaPago: "asc" },
    }),
    prisma.multa.findMany({
      where: { estado: "pendiente_verificacion" },
      include: { jugador: { include: { usuario: true } }, partido: true },
      orderBy: { fechaCreacion: "asc" },
    }),
    prisma.multa.findMany({
      where: { estado: "debe" },
      include: { jugador: { include: { usuario: true } } },
      orderBy: [{ jugador: { apellidos: "asc" } }],
    }),
    prisma.partido.findMany({ orderBy: [{ fecha: "desc" }] }),
  ]);

  const pagosData = pagosPendientes.map((p) => ({
    id: p.id,
    monto: p.monto,
    nombre: `${p.inscripcion.jugador.usuario.nombre} ${p.inscripcion.jugador.apellidos}`.trim(),
    partido: `${p.inscripcion.partido.fecha} ${p.inscripcion.partido.hora} — ${p.inscripcion.partido.cancha}`,
    comprobante: aDataUrl(p.comprobanteImg, p.comprobanteMime),
  }));

  const multasVerifData = multasPendientesVerificacion.map((m) => ({
    id: m.id,
    monto: m.monto,
    tipo: m.tipo,
    nombre: `${m.jugador.usuario.nombre} ${m.jugador.apellidos}`.trim(),
    partido: m.partido ? `${m.partido.fecha} ${m.partido.hora}` : null,
    comprobante: aDataUrl(m.comprobanteImg, m.comprobanteMime),
  }));

  const multasDebeData = todasMultasPendientes.map((m) => ({
    id: m.id,
    monto: m.monto,
    tipo: m.tipo,
    nombre: `${m.jugador.usuario.nombre} ${m.jugador.apellidos}`.trim(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Pagos</h1>
      <PagosPendientesTab pagos={pagosData} />
      <PagosPorPartidoTab
        partidos={partidos.map((p) => ({
          id: p.id,
          etiqueta: `${p.fecha} ${p.hora} — ${p.cancha} (${p.estado})`,
        }))}
      />
      <MultasTab pendientesVerificacion={multasVerifData} todasPendientes={multasDebeData} />
      <CuadreTab
        partidos={partidos.map((p) => ({
          id: p.id,
          etiqueta: `${p.fecha} ${p.hora} — ${p.cancha}`,
          costoCancha: p.costoCancha,
        }))}
      />
    </div>
  );
}
