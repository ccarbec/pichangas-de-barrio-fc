"""
Hashing de contraseñas y control de sesión para el panel Streamlit.

Nunca guardamos la contraseña tal cual en la base de datos — guardamos un
hash (una huella digital que no se puede revertir) más una sal (salt) al
azar. La sesión también se guarda en la base de datos y en la URL
(?sesion=...) para que sobreviva a un F5 sin pedir teléfono/contraseña de
nuevo. Mismo mecanismo que automatizaciones_carlos/utils/auth.py.
"""

import hashlib
import hmac
import secrets

import streamlit as st

from database.connection import get_connection

ITERACIONES_HASH = 100_000
CLAVE_QUERY_SESION = "sesion"
DIAS_DURACION_SESION = 30


def generar_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    hash_calculado = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), ITERACIONES_HASH
    ).hex()
    return hash_calculado, salt


def verificar_password(password, hash_guardado, salt):
    hash_calculado, _ = generar_hash(password, salt)
    return hmac.compare_digest(hash_calculado, hash_guardado)


def iniciar_sesion(datos_usuario):
    """La limpieza de sesiones vencidas solo corre ~1 de cada 20 logins (no
    hace falta en cada uno, y cada consulta a Turso cuesta ~500ms) — una
    sesión vencida igual no sirve para nada, porque _restaurar_sesion ya
    filtra por antigüedad al validar el token."""
    st.session_state["usuario"] = datos_usuario
    token = secrets.token_urlsafe(32)
    conexion = get_connection()
    try:
        if secrets.randbelow(20) == 0:
            conexion.execute(
                "DELETE FROM sesiones WHERE julianday('now','localtime') - julianday(creado_en) > ?",
                (DIAS_DURACION_SESION,),
            )
        conexion.execute(
            "INSERT INTO sesiones (token, usuario_id) VALUES (?, ?)",
            (token, datos_usuario["id"]),
        )
        conexion.commit()
    finally:
        conexion.close()
    st.query_params[CLAVE_QUERY_SESION] = token


def _restaurar_sesion():
    token = st.query_params.get(CLAVE_QUERY_SESION)
    if not token:
        return
    conexion = get_connection()
    try:
        fila = conexion.execute(
            """
            SELECT usuarios.* FROM sesiones
            JOIN usuarios ON usuarios.id = sesiones.usuario_id
            WHERE sesiones.token = ?
              AND usuarios.estado = 'activo'
              AND julianday('now','localtime') - julianday(sesiones.creado_en) <= ?
            """,
            (token, DIAS_DURACION_SESION),
        ).fetchone()
    finally:
        conexion.close()
    if fila:
        st.session_state["usuario"] = dict(fila)


def usuario_actual():
    if "usuario" not in st.session_state:
        _restaurar_sesion()
    return st.session_state.get("usuario")


def requerir_login():
    """Poner al inicio de cada página. Si nadie inició sesión, detiene la página."""
    if not usuario_actual():
        st.warning("Primero inicia sesión desde la página principal.")
        st.stop()


def requerir_admin():
    """Poner al inicio de páginas solo para el presidente/admin."""
    requerir_login()
    if usuario_actual()["rol"] != "admin":
        st.error("Esta sección es solo para el presidente del club.")
        st.stop()


def es_admin():
    usuario = usuario_actual()
    return bool(usuario and usuario["rol"] == "admin")


def cerrar_sesion():
    token = st.query_params.get(CLAVE_QUERY_SESION)
    if token:
        conexion = get_connection()
        try:
            conexion.execute("DELETE FROM sesiones WHERE token = ?", (token,))
            conexion.commit()
        finally:
            conexion.close()
        del st.query_params[CLAVE_QUERY_SESION]
    st.session_state.pop("usuario", None)
