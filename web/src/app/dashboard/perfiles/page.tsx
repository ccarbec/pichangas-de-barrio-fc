import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerUsuarioActual } from "@/lib/session";
import { aDataUrl } from "@/lib/imagenes";
import { nombreCompleto, emojiPosicion } from "@/lib/estilos";

export default async function PerfilesClubPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const jugadores = await prisma.jugador.findMany({
    where: { estado: "activo" },
    include: { usuario: true },
    orderBy: [{ apellidos: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">🖼️ Perfiles del Club</h1>
        <p className="text-sm text-[var(--muted)]">Conoce a tus compañeros de pichanga.</p>
      </div>

      {jugadores.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Todavía no hay jugadores activos registrados.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jugadores.map((j) => {
            const foto = aDataUrl(j.fotoImg, j.fotoMime);
            return (
              <div key={j.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center gap-3">
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto} alt="" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background)] text-xs text-[var(--muted)]">
                      Sin foto
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {emojiPosicion(j.posicion)} {nombreCompleto(j)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{j.posicion || "Posición sin definir"}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <dt className="text-[var(--muted)]">Hincha de</dt>
                  <dd className="truncate">{j.equipoHincha || "—"}</dd>
                  <dt className="text-[var(--muted)]">Camiseta</dt>
                  <dd className="truncate">{j.camiseta || "—"}</dd>
                </dl>
                {j.resena && (
                  <p className="mt-3 rounded-lg bg-[var(--background)] p-2 text-xs text-[var(--muted)]">{j.resena}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
