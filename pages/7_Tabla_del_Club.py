"""Tabla de posiciones del club — como una liga de verdad: quién juega
más, quién llega tarde, quién falta, y quién debe multas."""

import pandas as pd
import streamlit as st

from models import estadisticas
from utils import auth, estilos

auth.requerir_login()
estilos.aplicar_tema()

st.title("🏆 Tabla del Club")
st.caption("Un ranking de puntualidad y compromiso — no de goles (todavía 😄).")

tabla, multas_pendientes = estadisticas.resumen_jugadores()

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
