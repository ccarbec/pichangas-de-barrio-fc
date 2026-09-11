import { Badge } from "../../components/Badge";

const MIEMBROS_DEMO = [
  { nombre: "Marco", correo: "admin@pichangas.com", rol: "ADMIN", estado: "ACTIVO" },
  { nombre: "Jugador 6", correo: "jugador6@pichangas.com", rol: "MEMBER", estado: "ACTIVO" },
  { nombre: "Jugador 7", correo: "jugador7@pichangas.com", rol: "MEMBER", estado: "ACTIVO" },
  { nombre: "Jugador 8", correo: "jugador8@pichangas.com", rol: "MEMBER", estado: "ACTIVO" },
  { nombre: "Jugador 9", correo: "jugador9@pichangas.com", rol: "MEMBER", estado: "ACTIVO" },
  { nombre: "Randy Montero Zambrano", correo: "rmontero1990@gmail.com", rol: "MEMBER", estado: "ACTIVO" },
];

export default function MiembrosPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Gestión Miembros</h1>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="p-4">Jugador</th>
              <th className="p-4">Correo</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {MIEMBROS_DEMO.map((m) => (
              <tr key={m.correo} className="border-b border-[var(--border)]/50 last:border-0">
                <td className="p-4 font-medium">
                  {m.nombre}
                  <div className="text-xs font-normal text-[var(--muted)]">Sin posición</div>
                </td>
                <td className="p-4 text-[var(--muted)]">{m.correo}</td>
                <td className="p-4">
                  <Badge variant="role">{m.rol}</Badge>
                </td>
                <td className="p-4">
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
