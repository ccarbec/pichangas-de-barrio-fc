import { categoriaPosicion } from "./estilos";

export type JugadorParaEquipo = {
  id: number;
  nombre: string;
  apodo: string | null;
  posicion: string | null;
  statVelocidad: number;
  statTecnica: number;
  statDefensa: number;
  statFisico: number;
};

export function puntajeJugador(j: JugadorParaEquipo): number {
  return j.statVelocidad + j.statTecnica + j.statDefensa + j.statFisico;
}

const ORDEN_POSICIONES = ["arquero", "defensa", "mediocampo", "delantero", "otros"] as const;

/**
 * Reparte a los jugadores confirmados en dos equipos, tratando de que:
 *  1. La suma de puntaje de cada equipo quede lo más pareja posible.
 *  2. Las posiciones queden mezcladas (arqueros, defensas, etc. repartidos
 *     entre los dos, no todos del mismo lado).
 *
 * Estrategia: se procesa una posición a la vez (arqueros primero, por ser
 * la más limitada), de mayor a menor puntaje dentro de cada una, y cada
 * jugador se suma al equipo que en ESE momento tenga el puntaje total más
 * bajo — así el balance de nivel se mantiene incluso dentro de una misma
 * posición. Antes de ordenar por puntaje se mezcla al azar, para que un
 * empate no salga siempre para el mismo lado si se vuelve a armar.
 */
export function armarEquipos(jugadores: JugadorParaEquipo[]): {
  equipoA: JugadorParaEquipo[];
  equipoB: JugadorParaEquipo[];
} {
  const porPosicion = new Map<string, JugadorParaEquipo[]>();
  for (const j of jugadores) {
    const cat = categoriaPosicion(j.posicion);
    const lista = porPosicion.get(cat) ?? [];
    lista.push(j);
    porPosicion.set(cat, lista);
  }

  const equipoA: JugadorParaEquipo[] = [];
  const equipoB: JugadorParaEquipo[] = [];
  let puntajeA = 0;
  let puntajeB = 0;

  for (const cat of ORDEN_POSICIONES) {
    const lista = porPosicion.get(cat);
    if (!lista || lista.length === 0) continue;
    const ordenados = [...lista]
      .sort(() => Math.random() - 0.5)
      .sort((x, y) => puntajeJugador(y) - puntajeJugador(x));
    for (const j of ordenados) {
      if (puntajeA <= puntajeB) {
        equipoA.push(j);
        puntajeA += puntajeJugador(j);
      } else {
        equipoB.push(j);
        puntajeB += puntajeJugador(j);
      }
    }
  }

  return { equipoA, equipoB };
}
