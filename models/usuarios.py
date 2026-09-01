"""CRUD de usuarios (login) del panel."""

from database.connection import get_connection
from utils import auth
from utils.telefono import normalizar_telefono

ROLES_VALIDOS = ("jugador", "admin")


def crear_usuario(nombre, telefono, password, rol="jugador"):
    if rol not in ROLES_VALIDOS:
        raise ValueError(f"Rol inválido: {rol}")

    hash_password, salt = auth.generar_hash(password)
    conexion = get_connection()
    try:
        cursor = conexion.execute(
            """
            INSERT INTO usuarios (nombre, telefono, password_hash, salt, rol)
            VALUES (?, ?, ?, ?, ?)
            """,
            (nombre.strip(), normalizar_telefono(telefono), hash_password, salt, rol),
        )
        conexion.commit()
        return cursor.lastrowid
    finally:
        conexion.close()


def obtener_usuario(usuario_id):
    conexion = get_connection()
    try:
        fila = conexion.execute("SELECT * FROM usuarios WHERE id = ?", (usuario_id,)).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def obtener_usuario_por_telefono(telefono):
    conexion = get_connection()
    try:
        fila = conexion.execute(
            "SELECT * FROM usuarios WHERE telefono = ? AND estado = 'activo'",
            (normalizar_telefono(telefono),),
        ).fetchone()
        return dict(fila) if fila else None
    finally:
        conexion.close()


def verificar_credenciales(telefono, password):
    datos = obtener_usuario_por_telefono(telefono)
    if not datos:
        return None
    if auth.verificar_password(password, datos["password_hash"], datos["salt"]):
        return datos
    return None


def existe_algun_usuario():
    conexion = get_connection()
    try:
        fila = conexion.execute("SELECT 1 FROM usuarios LIMIT 1").fetchone()
        return fila is not None
    finally:
        conexion.close()


def listar_usuarios(solo_activos=False):
    conexion = get_connection()
    try:
        consulta = "SELECT * FROM usuarios"
        if solo_activos:
            consulta += " WHERE estado = 'activo'"
        consulta += " ORDER BY nombre"
        filas = conexion.execute(consulta).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()


def cambiar_rol(usuario_id, rol):
    if rol not in ROLES_VALIDOS:
        raise ValueError(f"Rol inválido: {rol}")
    conexion = get_connection()
    try:
        conexion.execute("UPDATE usuarios SET rol = ? WHERE id = ?", (rol, usuario_id))
        conexion.commit()
    finally:
        conexion.close()


def resetear_password(usuario_id, nueva_password):
    hash_password, salt = auth.generar_hash(nueva_password)
    conexion = get_connection()
    try:
        conexion.execute(
            "UPDATE usuarios SET password_hash = ?, salt = ? WHERE id = ?",
            (hash_password, salt, usuario_id),
        )
        conexion.commit()
    finally:
        conexion.close()


def desactivar_usuario(usuario_id):
    conexion = get_connection()
    try:
        conexion.execute("UPDATE usuarios SET estado = 'inactivo' WHERE id = ?", (usuario_id,))
        conexion.commit()
    finally:
        conexion.close()


def reactivar_usuario(usuario_id):
    conexion = get_connection()
    try:
        conexion.execute("UPDATE usuarios SET estado = 'activo' WHERE id = ?", (usuario_id,))
        conexion.commit()
    finally:
        conexion.close()
