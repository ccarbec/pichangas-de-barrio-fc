"""Dashboard de asistencia/jugadores con gráficos, y exportación de toda
la data del club a Excel — solo para el presidente/admin."""

import pandas as pd
import streamlit as st

from models import estadisticas, jugadores, multas, pagos, partidos
from utils import auth, estilos, excel

auth.requerir_admin()
estilos.aplicar_tema()

st.title("📊 Dashboard")

tab_graficos, tab_exportar = st.tabs(["📈 Gráficos", "📥 Exportar a Excel"])

with tab_graficos:
    tabla, multas_pendientes = estadisticas.resumen_jugadores()

    if not tabla:
        st.info("Todavía no hay historial de partidos para armar gráficos.")
    else:
        total_jugados = sum(j["jugados"] for j in tabla)
        total_tardanzas = sum(j["tardanzas"] for j in tabla)
        total_no_asistio = sum(j["no_asistio"] for j in tabla)

        col1, col2, col3 = st.columns(3)
        col1.metric("✅ Asistencias registradas", total_jugados)
        col2.metric("⏰ Tardanzas", total_tardanzas)
        col3.metric("❌ No asistencias", total_no_asistio)

        st.markdown("##### 🎽 Jugadores más constantes")
        top_jugados = [j for j in tabla if j["jugados"] > 0][:10]
        if top_jugados:
            df_jugados = pd.DataFrame(
                {estilos.nombre_completo(j): j["jugados"] for j in top_jugados}.items(),
                columns=["Jugador", "Partidos jugados"],
            ).set_index("Jugador")
            st.bar_chart(df_jugados)
        else:
            st.caption("Todavía nadie tiene asistencia registrada.")

        st.markdown("##### ⚠️ Tardanzas y no-asistencias")
        con_incidencias = sorted(
            [j for j in tabla if j["tardanzas"] > 0 or j["no_asistio"] > 0],
            key=lambda j: (j["tardanzas"] + j["no_asistio"]),
            reverse=True,
        )[:10]
        if con_incidencias:
            df_incidencias = pd.DataFrame(
                [
                    {
                        "Jugador": estilos.nombre_completo(j),
                        "Tardanzas": j["tardanzas"],
                        "No asistió": j["no_asistio"],
                    }
                    for j in con_incidencias
                ]
            ).set_index("Jugador")
            st.bar_chart(df_incidencias)
        else:
            st.caption("Nadie tiene tardanzas ni no-asistencias registradas. 🎉")

        st.markdown("##### 📅 Pichangas jugadas por mes")
        por_mes = estadisticas.partidos_jugados_por_mes()
        if por_mes:
            df_mes = pd.DataFrame(por_mes).rename(
                columns={"mes": "Mes", "n": "Pichangas jugadas"}
            ).set_index("Mes")
            st.bar_chart(df_mes)
        else:
            st.caption("Todavía no hay pichangas marcadas como jugadas.")

with tab_exportar:
    st.caption("Descarga la data completa del club en Excel para tus propios reportes o respaldo.")

    col_j, col_p = st.columns(2)
    with col_j:
        jugadores_data = jugadores.listar_jugadores(solo_activos=False)
        st.download_button(
            "⬇️ Jugadores (.xlsx)",
            data=excel.a_excel_bytes(jugadores_data, "Jugadores"),
            file_name="jugadores.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )
    with col_p:
        partidos_data = partidos.listar_partidos()
        st.download_button(
            "⬇️ Historial de partidos (.xlsx)",
            data=excel.a_excel_bytes(partidos_data, "Partidos"),
            file_name="partidos.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )

    col_pa, col_m = st.columns(2)
    with col_pa:
        pagos_data = pagos.listar_todos()
        st.download_button(
            "⬇️ Pagos (.xlsx)",
            data=excel.a_excel_bytes(pagos_data, "Pagos"),
            file_name="pagos.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
            disabled=not pagos_data,
        )
    with col_m:
        multas_data = multas.listar_todas()
        st.download_button(
            "⬇️ Multas (.xlsx)",
            data=excel.a_excel_bytes(multas_data, "Multas"),
            file_name="multas.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
            disabled=not multas_data,
        )
