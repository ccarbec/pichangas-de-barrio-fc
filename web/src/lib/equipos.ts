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
 * Reparte a los jugadores confirmados en `numEquipos` equipos (2 o 3, para
 * pichangas con rotación), tratando de que:
 *  1. La suma de puntaje de cada equipo quede lo más pareja posible.
 *  2. Las posiciones queden mezcladas (arqueros, defensas, etc. repartidos
 *     entre todos, no todos del mismo lado).
 *
 * Estrategia: se procesa una posición a la vez (arqueros primero, por ser
 * la más limitada), de mayor a menor puntaje dentro de cada una, y cada
 * jugador se suma al equipo que en ESE momento tenga el puntaje total más
 * bajo — así el balance de nivel se mantiene incluso dentro de una misma
 * posición. Antes de ordenar por puntaje se mezcla al azar, para que un
 * empate no salga siempre para el mismo lado si se vuelve a armar.
 */
export function armarEquipos(jugadores: JugadorParaEquipo[], numEquipos: number = 2): JugadorParaEquipo[][] {
  const n = Math.max(2, Math.round(numEquipos));
  const porPosicion = new Map<string, JugadorParaEquipo[]>();
  for (const j of jugadores) {
    const cat = categoriaPosicion(j.posicion);
    const lista = porPosicion.get(cat) ?? [];
    lista.push(j);
    porPosicion.set(cat, lista);
  }

  const equipos: JugadorParaEquipo[][] = Array.from({ length: n }, () => []);
  const puntajes = new Array(n).fill(0);

  for (const cat of ORDEN_POSICIONES) {
    const lista = porPosicion.get(cat);
    if (!lista || lista.length === 0) continue;
    const ordenados = [...lista]
      .sort(() => Math.random() - 0.5)
      .sort((x, y) => puntajeJugador(y) - puntajeJugador(x));
    for (const j of ordenados) {
      let indiceMenor = 0;
      for (let i = 1; i < n; i++) {
        if (puntajes[i] < puntajes[indiceMenor]) indiceMenor = i;
      }
      equipos[indiceMenor].push(j);
      puntajes[indiceMenor] += puntajeJugador(j);
    }
  }

  return equipos;
}
