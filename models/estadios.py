"""Zonas/estadios donde juega el club, con su precio de cancha y aporte
por jugador de siempre — sirven de plantilla al programar una pichanga."""

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


def obtener_estadio(estadio_id):
    conexion = get_connection()
    try:
        fila = conexion.execute("SELECT * FROM estadios WHERE id = ?", (estadio_id,)).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def listar_estadios(solo_activos=True):
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


def desactivar_estadio(estadio_id):
    conexion = get_connection()
    try:
        conexion.execute("UPDATE estadios SET estado = 'inactivo' WHERE id = ?", (estadio_id,))
        conexion.commit()
    finally:
        conexion.close()


def reactivar_estadio(estadio_id):
    conexion = get_connection()
    try:
        conexion.execute("UPDATE estadios SET estado = 'activo' WHERE id = ?", (estadio_id,))
        conexion.commit()
    finally:
        conexion.close()
