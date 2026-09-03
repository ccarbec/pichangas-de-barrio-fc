"""Zonas/estadios donde juega el club, con su precio de cancha y aporte
por jugador de siempre — sirven de plantilla al programar una pichanga."""

import streamlit as st

from database.connection import get_connection


def crear_estadio(nombre, costo_cancha, costo_por_jugador):
    conexion = get_connection()
    try:
        cursor = conexion.execute(
            "INSERT INTO estadios (nombre, costo_cancha, costo_por_jugador) VALUES (?, ?, ?)",
            (nombre.strip(), costo_cancha, costo_por_jugador),
        )
        conexion.commit()
        return cursor.lastrowid
    finally:
        conexion.close()
        listar_estadios.clear()


def obtener_estadio(estadio_id):
    conexion = get_connection()
    try:
        fila = conexion.execute("SELECT * FROM estadios WHERE id = ?", (estadio_id,)).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


@st.cache_data(ttl=20)
def listar_estadios(solo_activos=True):
    """Cacheado 20 segundos — cada consulta a Turso tarda ~500ms de ida y
    vuelta. Toda función que agregue/edite/borre un estadio debe llamar
    listar_estadios.clear()."""
    conexion = get_connection()
    try:
        consulta = "SELECT * FROM estadios"
        if solo_activos:
            consulta += " WHERE estado = 'activo'"
        consulta += " ORDER BY nombre"
        filas = conexion.execute(consulta).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def actualizar_estadio(estadio_id, nombre, costo_cancha, costo_por_jugador):
    conexion = get_connection()
    try:
        conexion.execute(
            "UPDATE estadios SET nombre = ?, costo_cancha = ?, costo_por_jugador = ? WHERE id = ?",
            (nombre.strip(), costo_cancha, costo_por_jugador, estadio_id),
        )
        conexion.commit()
    finally:
        conexion.close()
    listar_estadios.clear()


def desactivar_estadio(estadio_id):
    conexion = get_connection()
    try:
        conexion.execute("UPDATE estadios SET estado = 'inactivo' WHERE id = ?", (estadio_id,))
        conexion.commit()
    finally:
        conexion.close()
    listar_estadios.clear()


def reactivar_estadio(estadio_id):
    conexion = get_connection()
    try:
        conexion.execute("UPDATE estadios SET estado = 'activo' WHERE id = ?", (estadio_id,))
        conexion.commit()
    finally:
        conexion.close()
    listar_estadios.clear()


def subir_foto(estadio_id, imagen_bytes, mime):
    conexion = get_connection()
    try:
        conexion.execute(
            "UPDATE estadios SET foto_img = ?, foto_mime = ? WHERE id = ?",
            (imagen_bytes, mime, estadio_id),
        )
        conexion.commit()
    finally:
        conexion.close()
    listar_estadios.clear()
