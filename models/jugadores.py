"""Perfil de jugador (apodo, posición) y el alta combinada usuario+jugador
que usan tanto el auto-registro como el CRUD del admin."""

from database.connection import get_connection
from models import usuarios


def registrar_jugador(nombre, telefono, password, apodo="", posicion=""):
    """Crea el usuario (rol jugador) y su perfil de jugador en un solo paso.

    Usado tanto por el auto-registro público como por el admin cuando da de
    alta a un jugador manualmente.
    """
    usuario_id = usuarios.crear_usuario(nombre, telefono, password, rol="jugador")
    conexion = get_connection()
    try:
        conexion.execute(
            "INSERT INTO jugadores (usuario_id, apodo, posicion) VALUES (?, ?, ?)",
            (usuario_id, apodo.strip(), posicion.strip()),
        )
        conexion.commit()
    finally:
        conexion.close()
    return usuario_id


def obtener_jugador_por_usuario(usuario_id):
    conexion = get_connection()
    try:
        fila = conexion.execute(
            "SELECT * FROM jugadores WHERE usuario_id = ?", (usuario_id,)
        ).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def obtener_jugador(jugador_id):
    conexion = get_connection()
    try:
        fila = conexion.execute(
            """
            SELECT jugadores.*, usuarios.nombre, usuarios.telefono, usuarios.estado AS estado_usuario
            FROM jugadores JOIN usuarios ON usuarios.id = jugadores.usuario_id
            WHERE jugadores.id = ?
            """,
            (jugador_id,),
        ).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def listar_jugadores(solo_activos=True):
    conexion = get_connection()
    try:
        consulta = """
            SELECT jugadores.*, usuarios.nombre, usuarios.telefono, usuarios.estado AS estado_usuario
            FROM jugadores JOIN usuarios ON usuarios.id = jugadores.usuario_id
        """
        if solo_activos:
            consulta += " WHERE jugadores.estado = 'activo' AND usuarios.estado = 'activo'"
        consulta += " ORDER BY usuarios.nombre"
        filas = conexion.execute(consulta).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def actualizar_jugador(jugador_id, apodo, posicion):
    conexion = get_connection()
    try:
        conexion.execute(
            "UPDATE jugadores SET apodo = ?, posicion = ? WHERE id = ?",
            (apodo.strip(), posicion.strip(), jugador_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def desactivar_jugador(jugador_id):
    """Inactiva al jugador y le cierra el acceso (usuario) al mismo tiempo."""
    jugador = obtener_jugador(jugador_id)
    conexion = get_connection()
    try:
        conexion.execute("UPDATE jugadores SET estado = 'inactivo' WHERE id = ?", (jugador_id,))
        conexion.execute(
            "UPDATE usuarios SET estado = 'inactivo' WHERE id = ?", (jugador["usuario_id"],)
        )
        conexion.commit()
    finally:
        conexion.close()


def reactivar_jugador(jugador_id):
    jugador = obtener_jugador(jugador_id)
    conexion = get_connection()
    try:
        conexion.execute("UPDATE jugadores SET estado = 'activo' WHERE id = ?", (jugador_id,))
        conexion.execute(
            "UPDATE usuarios SET estado = 'activo' WHERE id = ?", (jugador["usuario_id"],)
        )
        conexion.commit()
    finally:
        conexion.close()
