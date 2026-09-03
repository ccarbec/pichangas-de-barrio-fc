"""Tabla de posiciones del club — como una liga de verdad: quién juega
más, quién llega tarde, quién falta, y quién debe multas."""

import pandas as pd
import streamlit as st

from database.connection import get_connection
from utils import auth, estilos

auth.requerir_login()
estilos.aplicar_tema()

st.title("🏆 Tabla del Club")
st.caption("Un ranking de puntualidad y compromiso — no de goles (todavía 😄).")


@st.cache_data(ttl=30)
def _tabla():
    conexion = get_connection()
    try:
        filas = conexion.execute(
            """
            SELECT
                jugadores.id,
                usuarios.nombre,
                jugadores.apellidos,
                jugadores.apodo,
                jugadores.posicion,
                SUM(CASE WHEN inscripciones.asistio = 'llego' THEN 1 ELSE 0 END) AS jugados,
                SUM(CASE WHEN inscripciones.asistio = 'tardanza' THEN 1 ELSE 0 END) AS tardanzas,
                SUM(CASE WHEN inscripciones.asistio = 'no_llego' THEN 1 ELSE 0 END) AS no_asistio
            FROM jugadores
            JOIN usuarios ON usuarios.id = jugadores.usuario_id
            LEFT JOIN inscripciones ON inscripciones.jugador_id = jugadores.id
            WHERE jugadores.estado = 'activo'
            GROUP BY jugadores.id
            ORDER BY jugados DESC, tardanzas ASC, no_asistio ASC
            """
        ).fetchall()
        multas_por_jugador = conexion.execute(
            """
            SELECT jugador_id, COUNT(*) AS n
            FROM multas WHERE estado != 'pagado'
            GROUP BY jugador_id
            """
        ).fetchall()
        return [dict(f) for f in filas], {m["jugador_id"]: m["n"] for m in multas_por_jugador}
    finally:
        conexion.close()


tabla, multas_pendientes = _tabla()

if not tabla:
    st.info("Todavía no hay historial de partidos para armar la tabla.")
    st.stop()

st.dataframe(
    pd.DataFrame(
        [
            {
                "#": i + 1,
                "Jugador": estilos.nombre_completo(j),
                "Posición": f"{estilos.emoji_posicion(j['posicion'])} {j['posicion'] or ''}".strip(),
                "🎽 Jugados": j["jugados"],
                "⏰ Tardanzas": j["tardanzas"],
                "❌ No asistió": j["no_asistio"],
                "⚠️ Multas pendientes": multas_pendientes.get(j["id"], 0),
            }
            for i, j in enumerate(tabla)
        ]
    ),
    hide_index=True,
    use_container_width=True,
)

top3 = [j for j in tabla if j["jugados"] > 0][:3]
if top3:
    st.markdown("##### 🥇 Los más constantes")
    medallas = ["🥇", "🥈", "🥉"]
    cols = st.columns(len(top3))
    for col, medalla, j in zip(cols, medallas, top3):
        with col:
            st.metric(f"{medalla} {estilos.nombre_completo(j)}", f"{j['jugados']} partidos")
