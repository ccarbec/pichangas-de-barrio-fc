import Link from "next/link";
import { ClipboardList, Users, Settings, Images, UserCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";
import { MetricCard } from "../components/MetricCard";
import { Badge } from "../components/Badge";
import { BarList } from "../components/BarList";
import { nombreCompleto } from "@/lib/estilos";

const ACCESOS_ADMIN = [
  { href: "/dashboard/partidos", label: "Partidos", icon: ClipboardList },
  { href: "/dashboard/miembros", label: "Gestión Miembros", icon: Users },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/galeria", label: "Galería", icon: Images },
];

const ACCESOS_JUGADOR = [
  { href: "/dashboard/partidos", label: "Partidos", icon: ClipboardList },
  { href: "/dashboard/perfil", label: "Mi Perfil", icon: UserCircle },
  { href: "/dashboard/galeria", label: "Galería", icon: Images },
];

export default async function DashboardPage() {
  const usuario = await obtenerUsuarioActual();
  const esAdmin = usuario?.rol === "admin";

  const [
    jugadoresActivos,
    totalRegistrados,
    partidosProgramados,
    pagosPendientes,
    ultimosJugadores,
    jugadoresConAsistencia,
    proximoPartido,
  ] = await Promise.all([
    prisma.jugador.count({ where: { estado: "activo" } }),
    prisma.jugador.count(),
    prisma.partido.count({ where: { estado: "programado" } }),
    esAdmin ? prisma.pago.count({ where: { estado: "pendiente" } }) : Promise.resolve(0),
    esAdmin
      ? prisma.jugador.findMany({
          take: 5,
          orderBy: { id: "desc" },
          select: {
            id: true,
            apellidos: true,
            apodo: true,
            estado: true,
            usuario: { select: { nombre: true, rol: true } },
          },
        })
      : Promise.resolve([]),
    esAdmin
      ? prisma.jugador.findMany({
          where: { estado: "activo" },
          select: {
            apellidos: true,
            apodo: true,
            usuario: { select: { nombre: true } },
            inscripciones: { select: { asistio: true } },
          },
        })
      : Promise.resolve([]),
    !esAdmin
      ? prisma.partido.findFirst({
          where: { estado: "programado" },
          orderBy: [{ fecha: "asc" }, { hora: "asc" }],
        })
      : Promise.resolve(null),
  ]);

  const topJugados = jugadoresConAsistencia
    .map((j) => ({ label: nombreCompleto(j), value: j.inscripciones.filter((i) => i.asistio === "llego").length }))
    .filter((j) => j.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topIncidencias = jugadoresConAsistencia
    .map((j) => ({
      label: nombreCompleto(j),
      value: j.inscripciones.filter((i) => i.asistio === "tardanza" || i.asistio === "no_llego").length,
    }))
    .filter((j) => j.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Centro de Comando</h1>
        <p className="text-sm text-[var(--muted)]">Resumen del club en vivo.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(esAdmin ? ACCESOS_ADMIN : ACCESOS_JUGADOR).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center text-sm font-medium transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
          >
            <Icon size={22} className="text-[var(--accent)]" />
            {label}
          </Link>
        ))}
      </div>

      {esAdmin ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Jugadores activos"
            value={jugadoresActivos}
            hint={`${totalRegistrados} registrados en total`}
          />
          <MetricCard label="Partidos programados" value={partidosProgramados} />
          <MetricCard label="Pagos por verificar" value={pagosPendientes} />
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">⚽ Próxima pichanga</h2>
          {proximoPartido ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {proximoPartido.fecha} · {proximoPartido.hora} — {proximoPartido.cancha}
                </p>
                <p className="text-sm text-[var(--muted)]">S/ {proximoPartido.costoPorJugador.toFixed(2)} por jugador</p>
              </div>
              <Link
                href="/dashboard/partidos"
                className="self-start rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 sm:self-auto"
              >
                Ver y confirmar
              </Link>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No hay pichangas programadas por ahora.</p>
          )}
        </div>
      )}

      {(topJugados.length > 0 || topIncidencias.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {topJugados.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">🎽 Más constantes</h2>
              <BarList items={topJugados} />
            </div>
          )}
          {topIncidencias.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">⚠️ Tardanzas / no-asistencias</h2>
              <BarList items={topIncidencias} />
            </div>
          )}
        </div>
      )}

      {esAdmin && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">Gestión Miembros</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="pb-2">Jugador</th>
                  <th className="pb-2">Rol</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimosJugadores.map((j) => (
                  <tr key={j.id} className="border-b border-[var(--border)]/50 last:border-0">
                    <td className="py-3 font-medium whitespace-nowrap">
                      {nombreCompleto(j)}
                    </td>
                    <td className="py-3">
                      <Badge variant="role">{j.usuario.rol.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant={j.estado === "activo" ? "active" : "danger"}>
                        {j.estado.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
