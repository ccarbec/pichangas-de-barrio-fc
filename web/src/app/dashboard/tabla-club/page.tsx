import { prisma } from "@/lib/prisma";
import { nombreCompleto, emojiPosicion } from "@/lib/estilos";
import { EmptyState } from "../../components/EmptyState";

export default async function TablaClubPage() {
  const jugadores = await prisma.jugador.findMany({
    where: { estado: "activo" },
    include: {
      usuario: true,
      inscripciones: { select: { asistio: true } },
      multas: { select: { estado: true } },
    },
  });

  const tabla = jugadores
    .map((j) => ({
      j,
      jugados: j.inscripciones.filter((i) => i.asistio === "llego").length,
      tardanzas: j.inscripciones.filter((i) => i.asistio === "tardanza").length,
      noAsistio: j.inscripciones.filter((i) => i.asistio === "no_llego").length,
      multasPendientes: j.multas.filter((m) => m.estado !== "pagado").length,
    }))
    .sort((a, b) => b.jugados - a.jugados || a.tardanzas - b.tardanzas || a.noAsistio - b.noAsistio);

  const top3 = tabla.filter((t) => t.jugados > 0).slice(0, 3);
  const medallas = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">🏆 Tabla del Club</h1>
        <p className="text-sm text-[var(--muted)]">Un ranking de puntualidad y compromiso.</p>
      </div>

      {tabla.length === 0 ? (
        <EmptyState icon="🏆" texto="Todavía no hay historial de partidos." />
      ) : (
        <>
          {top3.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {top3.map((t, i) => (
                <div key={t.j.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
                  <p className="text-3xl">{medallas[i]}</p>
                  <p className="mt-2 font-semibold">{nombreCompleto(t.j)}</p>
                  <p className="text-sm text-[var(--muted)]">{t.jugados} partidos</p>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="p-3">#</th>
                  <th className="p-3">Jugador</th>
                  <th className="p-3">Posición</th>
                  <th className="p-3">🎽 Jugados</th>
                  <th className="p-3">⏰ Tardanzas</th>
                  <th className="p-3">❌ No asistió</th>
                  <th className="p-3">⚠️ Multas</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((t, i) => (
                  <tr key={t.j.id} className="border-b border-[var(--border)]/50 last:border-0">
                    <td className="p-3 text-[var(--muted)]">{i + 1}</td>
                    <td className="p-3 font-medium whitespace-nowrap">{nombreCompleto(t.j)}</td>
                    <td className="p-3 text-[var(--muted)]">
                      {emojiPosicion(t.j.posicion)} {t.j.posicion ?? ""}
                    </td>
                    <td className="p-3">{t.jugados}</td>
                    <td className="p-3">{t.tardanzas}</td>
                    <td className="p-3">{t.noAsistio}</td>
                    <td className="p-3">{t.multasPendientes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
