"""Historial de recordatorios de WhatsApp (partido, pago, cupo liberado,
promovido) mandados por scripts/recordatorios_auto.py."""

from database.connection import get_connection


def registrar_envio(jugador_nombre, telefono, partido_fecha, partido_hora, tipo, mensaje, resultado, detalle_error=None):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            INSERT INTO envios_recordatorios
                (jugador_nombre, telefono, partido_fecha, partido_hora, tipo, mensaje, resultado, detalle_error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (jugador_nombre, telefono, partido_fecha, partido_hora, tipo, mensaje, resultado, detalle_error),
        )
        conexion.commit()
    finally:
        conexion.close()


def ya_enviado(telefono, partido_fecha, partido_hora, tipo):
    """True si ya se registró un envío de este tipo para este jugador y
    este partido — evita que la revisión automática (cada hora) repita el
    mismo mensaje."""
    conexion = get_connection()
    try:
        fila = conexion.execute(
            """
            SELECT 1 FROM envios_recordatorios
            WHERE telefono = ? AND partido_fecha = ? AND partido_hora = ? AND tipo = ?
            LIMIT 1
            """,
            (telefono, partido_fecha, partido_hora, tipo),
        ).fetchone()
        return fila is not None
    finally:
        conexion.close()


def listar_envios_recientes(limite=50):
    conexion = get_connection()
    try:
        filas = conexion.execute(
            "SELECT * FROM envios_recordatorios ORDER BY fecha_hora DESC LIMIT ?", (limite,)
        ).fetchall()
        return [dict(f) for f in filas]
    finally:
        conexion.close()
