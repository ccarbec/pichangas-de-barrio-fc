"use client";

import { useEffect, useRef, useState } from "react";
import { armarEquipos, type JugadorParaEquipo } from "@/lib/equipos";
import {
  guardarPosicionEnCancha,
  guardarFormacionInicial,
  guardarEventosPartido,
  marcarAsistenciaMultiple,
} from "@/actions/inscripciones";
import { actualizarStatsJugador } from "@/actions/jugadores";
import { emojiPosicion, categoriaPosicion } from "@/lib/estilos";
import { Estrellas } from "../../components/Estrellas";

export type JugadorCancha = {
  inscripcionId: number;
  jugadorId: number;
  nombre: string;
  posicion: string | null;
  foto: string | null;
  statVelocidad: number;
  statTecnica: number;
  statDefensa: number;
  statFisico: number;
  equipo: "A" | "B" | null;
  posX: number | null;
  posY: number | null;
  asistio: string | null;
  goles: number;
  amarillas: number;
  roja: boolean;
};

const X_POR_CATEGORIA: Record<"A" | "B", Record<string, number>> = {
  A: { arquero: 8, defensa: 25, mediocampo: 37, delantero: 46, otros: 20 },
  B: { arquero: 92, defensa: 75, mediocampo: 63, delantero: 54, otros: 80 },
};

function posicionesIniciales(jugadores: JugadorCancha[]): JugadorCancha[] {
  const paraArmar: JugadorParaEquipo[] = jugadores.map((j) => ({
    id: j.jugadorId,
    nombre: j.nombre,
    apodo: null,
    posicion: j.posicion,
    statVelocidad: j.statVelocidad,
    statTecnica: j.statTecnica,
    statDefensa: j.statDefensa,
    statFisico: j.statFisico,
  }));
  const { equipoA, equipoB } = armarEquipos(paraArmar);
  const porJugadorId = new Map(jugadores.map((j) => [j.jugadorId, j]));

  function ubicar(equipo: JugadorParaEquipo[], lado: "A" | "B"): JugadorCancha[] {
    const xPorCategoria = X_POR_CATEGORIA[lado];
    const porCategoria = new Map<string, JugadorParaEquipo[]>();
    for (const j of equipo) {
      const cat = categoriaPosicion(j.posicion);
      const lista = porCategoria.get(cat) ?? [];
      lista.push(j);
      porCategoria.set(cat, lista);
    }
    const resultado: JugadorCancha[] = [];
    for (const [cat, lista] of porCategoria) {
      const x = xPorCategoria[cat] ?? 30;
      lista.forEach((j, idx) => {
        const y = ((idx + 1) * 100) / (lista.length + 1);
        const original = porJugadorId.get(j.id);
        if (!original) return;
        resultado.push({ ...original, equipo: lado, posX: x, posY: y });
      });
    }
    return resultado;
  }

  return [...ubicar(equipoA, "A"), ...ubicar(equipoB, "B")];
}

export function CampoDeJuego({
  partidoId,
  jugadores,
  onCerrar,
}: {
  partidoId: number;
  jugadores: JugadorCancha[];
  onCerrar: () => void;
}) {
  const [lista, setLista] = useState<JugadorCancha[]>(() => {
    const faltaFormacion = jugadores.some((j) => j.equipo == null || j.posX == null || j.posY == null);
    return faltaFormacion ? posicionesIniciales(jugadores) : jugadores;
  });
  const [seleccionado, setSeleccionado] = useState<JugadorCancha | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const formacionGuardada = useRef(false);

  // La formación automática se guarda después de montar, no durante el
  // render — llamar a un Server Action (que dispara una revalidación de
  // ruta) dentro del inicializador de useState viola las reglas de React
  // ("Cannot update a component while rendering a different component").
  useEffect(() => {
    if (formacionGuardada.current) return;
    const faltaFormacion = jugadores.some((j) => j.equipo == null || j.posX == null || j.posY == null);
    if (!faltaFormacion) return;
    formacionGuardada.current = true;
    guardarFormacionInicial(
      lista.map((j) => ({ inscripcionId: j.inscripcionId, equipo: j.equipo ?? "A", posX: j.posX ?? 50, posY: j.posY ?? 50 }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const arrastre = useRef<{ inscripcionId: number; movio: boolean } | null>(null);

  function sortearEquipos() {
    const nuevaLista = posicionesIniciales(lista);
    setLista(nuevaLista);
    setSeleccionado(null);
    guardarFormacionInicial(
      nuevaLista.map((j) => ({ inscripcionId: j.inscripcionId, equipo: j.equipo ?? "A", posX: j.posX ?? 50, posY: j.posY ?? 50 }))
    );
  }

  function actualizarJugadorLocal(inscripcionId: number, cambios: Partial<JugadorCancha>) {
    setLista((prev) => prev.map((j) => (j.inscripcionId === inscripcionId ? { ...j, ...cambios } : j)));
    setSeleccionado((prev) => (prev && prev.inscripcionId === inscripcionId ? { ...prev, ...cambios } : prev));
  }

  function iniciarArrastre(e: React.PointerEvent<HTMLDivElement>, inscripcionId: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { inscripcionId, movio: false };
  }

  function moverArrastre(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastre.current || !contenedorRef.current) return;
    const rect = contenedorRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    arrastre.current.movio = true;
    actualizarJugadorLocal(arrastre.current.inscripcionId, {
      posX: Math.min(100, Math.max(0, x)),
      posY: Math.min(100, Math.max(0, y)),
    });
  }

  function terminarArrastre() {
    if (!arrastre.current) return;
    const { inscripcionId, movio } = arrastre.current;
    arrastre.current = null;
    const jugador = lista.find((j) => j.inscripcionId === inscripcionId);
    if (!jugador) return;
    if (movio) {
      guardarPosicionEnCancha(inscripcionId, jugador.equipo ?? "A", jugador.posX ?? 50, jugador.posY ?? 50);
    } else {
      setSeleccionado(jugador);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">🏟️ Cancha — arrastra a cada jugador, haz clic para gestionarlo</p>
        <div className="flex items-center gap-3">
          <button
            onClick={sortearEquipos}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--accent)]"
            title="Reparte a los jugadores en dos equipos al azar, buscando que el nivel (estadísticas) quede parejo"
          >
            🎲 Sortear equipos
          </button>
          <button onClick={onCerrar} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            ✕ Cerrar
          </button>
        </div>
      </div>

      <div
        ref={contenedorRef}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border-2 border-white/20"
        style={{ background: "linear-gradient(90deg, #2d7a3a 0%, #35873f 50%, #2d7a3a 100%)" }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />

        {lista.map((j) => (
          <div
            key={j.inscripcionId}
            onPointerDown={(e) => iniciarArrastre(e, j.inscripcionId)}
            onPointerMove={moverArrastre}
            onPointerUp={terminarArrastre}
            style={{ left: `${j.posX ?? 50}%`, top: `${j.posY ?? 50}%` }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none flex-col items-center gap-0.5 active:cursor-grabbing"
          >
            <div
              className={`relative h-10 w-10 overflow-hidden rounded-full border-2 bg-[var(--surface)] shadow-lg sm:h-12 sm:w-12 ${j.equipo === "A" ? "border-blue-400" : "border-red-400"}`}
            >
              {j.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={j.foto} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">{emojiPosicion(j.posicion)}</div>
              )}
              {j.roja ? (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-2.5 rounded-sm bg-red-600" />
              ) : j.amarillas > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-2.5 rounded-sm bg-yellow-400" />
              ) : null}
            </div>
            <span className="whitespace-nowrap rounded bg-black/60 px-1 text-[10px] font-semibold text-white">
              {j.nombre.split(" ")[0]}
              {j.goles > 0 ? ` ⚽${j.goles}` : ""}
            </span>
          </div>
        ))}
      </div>

      {seleccionado && (
        <PanelJugador
          jugador={seleccionado}
          partidoId={partidoId}
          onCerrar={() => setSeleccionado(null)}
          onCambio={(cambios) => actualizarJugadorLocal(seleccionado.inscripcionId, cambios)}
        />
      )}
    </div>
  );
}

const OPCIONES_ASISTENCIA = [
  { valor: "llego", texto: "✅ Llegó" },
  { valor: "tardanza", texto: "⏰ Tardanza" },
  { valor: "no_llego", texto: "❌ No llegó" },
];

const CAMPOS_STAT = [
  ["Velocidad", "statVelocidad"],
  ["Técnica", "statTecnica"],
  ["Defensa", "statDefensa"],
  ["Físico", "statFisico"],
] as const;

function PanelJugador({
  jugador,
  partidoId,
  onCerrar,
  onCambio,
}: {
  jugador: JugadorCancha;
  partidoId: number;
  onCerrar: () => void;
  onCambio: (cambios: Partial<JugadorCancha>) => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {jugador.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={jugador.foto} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-xl">
              {emojiPosicion(jugador.posicion)}
            </div>
          )}
          <div>
            <p className="font-semibold">{jugador.nombre}</p>
            <p className="text-xs text-[var(--muted)]">
              {jugador.posicion || "Sin posición"} · Equipo {jugador.equipo}
            </p>
          </div>
        </div>
        <button onClick={onCerrar} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-[var(--muted)]">Asistencia</p>
          <div className="flex flex-wrap gap-2">
            {OPCIONES_ASISTENCIA.map((op) => (
              <button
                key={op.valor}
                onClick={() => {
                  onCambio({ asistio: op.valor });
                  marcarAsistenciaMultiple(partidoId, [
                    { inscripcionId: jugador.inscripcionId, jugadorId: jugador.jugadorId, estado: op.valor },
                  ]);
                }}
                className={`rounded-lg border px-2 py-1 text-xs transition-colors ${jugador.asistio === op.valor ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--border)] hover:border-[var(--accent)]"}`}
              >
                {op.texto}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase text-[var(--muted)]">Goles</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const n = Math.max(0, jugador.goles - 1);
                onCambio({ goles: n });
                guardarEventosPartido(jugador.inscripcionId, { goles: n });
              }}
              className="h-7 w-7 rounded-lg border border-[var(--border)] hover:border-[var(--accent)]"
            >
              −
            </button>
            <span className="w-6 text-center font-semibold">{jugador.goles}</span>
            <button
              onClick={() => {
                const n = jugador.goles + 1;
                onCambio({ goles: n });
                guardarEventosPartido(jugador.inscripcionId, { goles: n });
              }}
              className="h-7 w-7 rounded-lg border border-[var(--border)] hover:border-[var(--accent)]"
            >
              +
            </button>
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase text-[var(--muted)]">Tarjetas</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const n = jugador.amarillas >= 2 ? 0 : jugador.amarillas + 1;
                onCambio({ amarillas: n });
                guardarEventosPartido(jugador.inscripcionId, { amarillas: n });
              }}
              className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs hover:border-[var(--accent)]"
            >
              🟨 Amarillas: {jugador.amarillas}
            </button>
            <button
              onClick={() => {
                const n = !jugador.roja;
                onCambio({ roja: n });
                guardarEventosPartido(jugador.inscripcionId, { roja: n });
              }}
              className={`rounded-lg border px-2 py-1 text-xs transition-colors ${jugador.roja ? "border-red-500 bg-red-500/10" : "border-[var(--border)] hover:border-[var(--accent)]"}`}
            >
              🟥 Roja
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-[var(--muted)]">⚖️ Estadísticas</p>
          <div className="flex flex-col gap-2">
            {CAMPOS_STAT.map(([label, campo]) => (
              <div key={campo} className="flex items-center justify-between gap-3">
                <span className="text-sm">{label}</span>
                <Estrellas
                  valor={jugador[campo]}
                  label={label}
                  onChange={(n) => {
                    onCambio({ [campo]: n });
                    actualizarStatsJugador(jugador.jugadorId, {
                      statVelocidad: campo === "statVelocidad" ? n : jugador.statVelocidad,
                      statTecnica: campo === "statTecnica" ? n : jugador.statTecnica,
                      statDefensa: campo === "statDefensa" ? n : jugador.statDefensa,
                      statFisico: campo === "statFisico" ? n : jugador.statFisico,
                    });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
