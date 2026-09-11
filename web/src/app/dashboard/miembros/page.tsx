import { prisma } from "@/lib/prisma";
import { Badge } from "../../components/Badge";

export default async function MiembrosPage() {
  const jugadores = await prisma.jugador.findMany({
    orderBy: [{ apellidos: "asc" }, { usuario: { nombre: "asc" } }],
    include: { usuario: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Gestión Miembros</h1>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="p-4">Jugador</th>
              <th className="p-4">Celular</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {jugadores.map((j) => (
              <tr key={j.id} className="border-b border-[var(--border)]/50 last:border-0">
                <td className="p-4 font-medium">
                  {j.usuario.nombre} {j.apellidos}
                  {j.apodo && <span className="text-[var(--muted)]"> ({j.apodo})</span>}
                  <div className="text-xs font-normal text-[var(--muted)]">
                    {j.posicion ?? "Sin posición"}
                  </div>
                </td>
                <td className="p-4 text-[var(--muted)]">{j.usuario.telefono}</td>
                <td className="p-4">
                  <Badge variant="role">{j.usuario.rol.toUpperCase()}</Badge>
                </td>
                <td className="p-4">
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
