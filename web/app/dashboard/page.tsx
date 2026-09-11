import { MetricCard } from "../components/MetricCard";
import { Badge } from "../components/Badge";

const MIEMBROS_DEMO = [
  { nombre: "Marco", rol: "ADMIN", estado: "ACTIVO" },
  { nombre: "Jugador 1", rol: "MEMBER", estado: "ACTIVO" },
  { nombre: "Jugador 2", rol: "MEMBER", estado: "ACTIVO" },
  { nombre: "Jugador 3", rol: "MEMBER", estado: "ACTIVO" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Centro de Comando</h1>
        <p className="text-sm text-[var(--muted)]">
          Vista de prueba — datos de ejemplo, todavía sin conectar a la base real.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Jugadores activos" value={157} hint="162 registrados en total" />
        <MetricCard label="Partidos programados" value={2} />
        <MetricCard label="Pagos por verificar" value={5} />
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
            {MIEMBROS_DEMO.map((m) => (
              <tr key={m.nombre} className="border-b border-[var(--border)]/50 last:border-0">
                <td className="py-3 font-medium">{m.nombre}</td>
                <td className="py-3">
                  <Badge variant="role">{m.rol}</Badge>
                </td>
                <td className="py-3">
                  <Badge variant="active">{m.estado}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
