"""Consultas agregadas de solo lectura para Tabla del Club y el Dashboard
— nada de CRUD acá, solo reportes."""

import streamlit as st

from database.connection import get_connection


@st.cache_data(ttl=30)
def resumen_jugadores():
    """Jugados/tardanzas/no-asistencias por jugador activo, más sus multas
    pendientes. Usado tanto en Tabla del Club como en el Dashboard — una
    sola consulta compartida en vez de mantenerla duplicada en dos
    páginas."""
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


@st.cache_data(ttl=30)
def partidos_jugados_por_mes():
    """Cuántas pichangas se jugaron cada mes — para el gráfico de
    tendencia del Dashboard."""
    conexion = get_connection()
    try:
        filas = conexion.execute(
            """
            SELECT strftime('%Y-%m', fecha) AS mes, COUNT(*) AS n
            FROM partidos
            WHERE estado = 'jugado'
            GROUP BY mes
            ORDER BY mes
            """
        ).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()
