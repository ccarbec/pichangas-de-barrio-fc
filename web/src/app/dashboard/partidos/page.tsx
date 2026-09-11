import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";
import { esArquero } from "@/lib/estilos";
import { EmptyState } from "../../components/EmptyState";
import { NuevoPartidoForm } from "./NuevoPartidoForm";
import { PartidoAdmin } from "./PartidoAdmin";
import { PartidoJugador } from "./PartidoJugador";

export default async function PartidosPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return null;
  const esAdmin = usuario.rol === "admin";

  const jugadorActual = await prisma.jugador.findUnique({ where: { usuarioId: usuario.id } });

  const [programados, historial, estadios, jugadoresRegistrados] = await Promise.all([
    prisma.partido.findMany({ where: { estado: "programado" }, orderBy: [{ fecha: "asc" }, { hora: "asc" }] }),
    prisma.partido.findMany({
      where: { estado: { in: ["jugado", "cancelado"] } },
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
    }),
    prisma.estadio.findMany({ where: { estado: "activo" }, orderBy: { nombre: "asc" } }),
    esAdmin
      ? prisma.jugador.findMany({
          where: { estado: "activo" },
          include: { usuario: true },
          orderBy: [{ apellidos: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const todosPartidos = [...programados, ...historial];
  const partidoIds = todosPartidos.map((p) => p.id);

  const [inscripciones, multas] = await Promise.all([
    prisma.inscripcion.findMany({
      where: { partidoId: { in: partidoIds }, estado: { not: "cancelado" } },
      include: { jugador: { include: { usuario: true } }, pago: true },
      orderBy: [{ jugador: { apellidos: "asc" } }],
    }),
    prisma.multa.findMany({ where: { partidoId: { in: partidoIds } } }),
  ]);

  const inscripcionesPorPartido = new Map<number, typeof inscripciones>();
  for (const i of inscripciones) {
    const lista = inscripcionesPorPartido.get(i.partidoId) ?? [];
    lista.push(i);
    inscripcionesPorPartido.set(i.partidoId, lista);
  }
  const multasPorPartido = new Map<number, typeof multas>();
  for (const m of multas) {
    if (m.partidoId == null) continue;
    const lista = multasPorPartido.get(m.partidoId) ?? [];
    lista.push(m);
    multasPorPartido.set(m.partidoId, lista);
  }

  const miInscripcionPorPartido = new Map<number, (typeof inscripciones)[number]>();
  if (jugadorActual) {
    for (const i of inscripciones) {
      if (i.jugadorId === jugadorActual.id) miInscripcionPorPartido.set(i.partidoId, i);
    }
  }

  const confirmadosPorPartido = new Map<number, number>();
  const arquerosConfirmadosPorPartido = new Map<number, number>();
  for (const [partidoId, lista] of inscripcionesPorPartido) {
    const confirmadosDelPartido = lista.filter((i) => i.estado === "confirmado");
    confirmadosPorPartido.set(partidoId, confirmadosDelPartido.length);
    arquerosConfirmadosPorPartido.set(
      partidoId,
      confirmadosDelPartido.filter((i) => esArquero(i.jugador.posicion)).length
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partidos</h1>
      </div>

      {esAdmin && <NuevoPartidoForm estadios={estadios} />}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Programados
        </h2>
        {programados.length === 0 && (
          <EmptyState icon="⚽" texto="No hay pichangas programadas todavía." />
        )}
        {programados.map((partido) =>
          esAdmin ? (
            <PartidoAdmin
              key={partido.id}
              partido={partido}
              inscritos={inscripcionesPorPartido.get(partido.id) ?? []}
              multas={multasPorPartido.get(partido.id) ?? []}
              jugadoresRegistrados={jugadoresRegistrados}
            />
          ) : jugadorActual ? (
            <PartidoJugador
              key={partido.id}
              partido={partido}
              jugadorId={jugadorActual.id}
              inscripcion={miInscripcionPorPartido.get(partido.id) ?? null}
              confirmados={confirmadosPorPartido.get(partido.id) ?? 0}
              arquerosConfirmados={arquerosConfirmadosPorPartido.get(partido.id) ?? 0}
            />
          ) : null
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Jugados / cancelados
        </h2>
        {historial.length === 0 && (
          <EmptyState icon="🗂️" texto="Todavía no hay partidos jugados o cancelados." />
        )}
        {historial.map((partido) =>
          esAdmin ? (
            <PartidoAdmin
              key={partido.id}
              partido={partido}
              inscritos={inscripcionesPorPartido.get(partido.id) ?? []}
              multas={multasPorPartido.get(partido.id) ?? []}
              jugadoresRegistrados={jugadoresRegistrados}
            />
          ) : (
            <div key={partido.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {partido.fecha} · {partido.hora} — {partido.cancha}
                </span>
                <span className="text-xs font-semibold uppercase text-[var(--muted)]">
                  {partido.estado === "jugado" ? "✅ Jugado" : "🚫 Cancelado"}
                </span>
              </div>
            </div>
          )
        )}
      </section>
    </div>
  );
}
