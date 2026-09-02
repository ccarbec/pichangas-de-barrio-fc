"""Perfil de jugador (apodo, posición) y el alta combinada usuario+jugador
que usan tanto el auto-registro como el CRUD del admin."""

from database.connection import get_connection
from models import usuarios


def registrar_jugador(nombre, telefono, password, apodo="", posicion="", apellidos="", equipo_hincha="", camiseta=""):
    """Crea el usuario (rol jugador) y su perfil de jugador en un solo paso.

    Usado tanto por el auto-registro público (solo pide lo básico) como por
    el admin cuando da de alta a un jugador manualmente (con el perfil
    completo).
    """
    usuario_id = usuarios.crear_usuario(nombre, telefono, password, rol="jugador")
    conexion = get_connection()
    try:
        conexion.execute(
            """
            INSERT INTO jugadores (usuario_id, apodo, posicion, apellidos, equipo_hincha, camiseta)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (usuario_id, apodo.strip(), posicion.strip(), apellidos.strip(), equipo_hincha.strip(), camiseta.strip()),
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


_COLUMNAS_SIN_FOTO = """
    jugadores.id, jugadores.usuario_id, jugadores.apodo, jugadores.apellidos,
    jugadores.posicion, jugadores.equipo_hincha, jugadores.camiseta, jugadores.resena,
    jugadores.foto_mime, jugadores.estado, jugadores.fecha_registro,
    usuarios.nombre, usuarios.telefono, usuarios.estado AS estado_usuario
"""


def obtener_jugador(jugador_id):
    """No trae la foto (puede pesar bastante) — usar obtener_foto() aparte
    solo cuando de verdad se va a mostrar."""
    conexion = get_connection()
    try:
        fila = conexion.execute(
            f"""
            SELECT {_COLUMNAS_SIN_FOTO}
            FROM jugadores JOIN usuarios ON usuarios.id = jugadores.usuario_id
            WHERE jugadores.id = ?
            """,
            (jugador_id,),
        ).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def listar_jugadores(solo_activos=True):
    """No trae la foto de cada jugador — se pediría el blob de todos cada
    vez que se llena un selectbox. Para mostrar fotos, usar obtener_foto()."""
    conexion = get_connection()
    try:
        consulta = f"""
            SELECT {_COLUMNAS_SIN_FOTO}
            FROM jugadores JOIN usuarios ON usuarios.id = jugadores.usuario_id
        """
        if solo_activos:
            consulta += " WHERE jugadores.estado = 'activo' AND usuarios.estado = 'activo'"
        consulta += " ORDER BY usuarios.nombre, jugadores.apellidos"
        filas = conexion.execute(consulta).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def obtener_foto(jugador_id):
    """Devuelve (bytes, mime) o (None, None) si no tiene foto — se pide
    aparte de obtener_jugador()/listar_jugadores() para no cargar el blob
    en listas donde no hace falta."""
    conexion = get_connection()
    try:
        fila = conexion.execute(
            "SELECT foto_img, foto_mime FROM jugadores WHERE id = ?", (jugador_id,)
        ).fetchone()
        if not fila or not fila["foto_img"]:
            return None, None
        return fila["foto_img"], fila["foto_mime"]
    finally:
        conexion.close()


def subir_foto(jugador_id, imagen_bytes, mime):
    conexion = get_connection()
    try:
        conexion.execute(
            "UPDATE jugadores SET foto_img = ?, foto_mime = ? WHERE id = ?",
            (imagen_bytes, mime, jugador_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def actualizar_resena(jugador_id, resena):
    conexion = get_connection()
    try:
        conexion.execute("UPDATE jugadores SET resena = ? WHERE id = ?", (resena.strip(), jugador_id))
        conexion.commit()
    finally:
        conexion.close()


def actualizar_jugador(jugador_id, apodo, posicion, apellidos="", equipo_hincha="", camiseta=""):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            UPDATE jugadores
            SET apodo = ?, posicion = ?, apellidos = ?, equipo_hincha = ?, camiseta = ?
            WHERE id = ?
            """,
            (apodo.strip(), posicion.strip(), apellidos.strip(), equipo_hincha.strip(), camiseta.strip(), jugador_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def tiene_inscripciones(jugador_id):
    """True si el jugador alguna vez se inscribió a un partido (aunque haya
    cancelado). Sirve para decidir si se puede eliminar del todo o si solo
    se puede inactivar (para no perder el historial de partidos/pagos)."""
    conexion = get_connection()
    try:
        fila = conexion.execute(
            "SELECT 1 FROM inscripciones WHERE jugador_id = ? LIMIT 1", (jugador_id,)
        ).fetchone()
        return fila is not None
    finally:
        conexion.close()


def eliminar_jugador(jugador_id):
    """Borra al jugador y su usuario de verdad (no soft-delete). Solo debe
    llamarse cuando tiene_inscripciones() es False — si tiene historial de
    partidos o pagos, usa desactivar_jugador() en su lugar."""
    if tiene_inscripciones(jugador_id):
        raise ValueError("Este jugador ya tiene partidos registrados — inactívalo en vez de eliminarlo.")
    jugador = obtener_jugador(jugador_id)
    conexion = get_connection()
    try:
        conexion.execute("DELETE FROM jugadores WHERE id = ?", (jugador_id,))
        conexion.execute("DELETE FROM sesiones WHERE usuario_id = ?", (jugador["usuario_id"],))
        conexion.execute("DELETE FROM usuarios WHERE id = ?", (jugador["usuario_id"],))
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
