import { prisma } from "@/lib/prisma";
import { MetricCard } from "../components/MetricCard";
import { Badge } from "../components/Badge";

export default async function DashboardPage() {
  const [jugadoresActivos, totalRegistrados, partidosProgramados, pagosPendientes, ultimosJugadores] =
    await Promise.all([
      prisma.jugador.count({ where: { estado: "activo" } }),
      prisma.jugador.count(),
      prisma.partido.count({ where: { estado: "programado" } }),
      prisma.pago.count({ where: { estado: "pendiente" } }),
      prisma.jugador.findMany({
        take: 5,
        orderBy: { id: "asc" },
        include: { usuario: true },
      }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Centro de Comando</h1>
        <p className="text-sm text-[var(--muted)]">Datos en vivo de la base de prueba local.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Jugadores activos"
          value={jugadoresActivos}
          hint={`${totalRegistrados} registrados en total`}
        />
        <MetricCard label="Partidos programados" value={partidosProgramados} />
        <MetricCard label="Pagos por verificar" value={pagosPendientes} />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">Gestión Miembros</h2>
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
                <td className="py-3 font-medium">
                  {j.usuario.nombre} {j.apellidos}
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
  );
}
