"""Datos del club: Yape del presidente/tesorero (para la pantalla de pago)
y los montos de multa por tardanza/no-asistencia. Fila única (id = 1)."""

from database.connection import get_connection

_DEFAULTS = {
    "nombre_yape": "",
    "telefono_yape": "",
    "monto_multa_tardanza": 5.0,
    "monto_multa_no_asistio": 10.0,
}


def obtener_config():
    conexion = get_connection()
    try:
        fila = conexion.execute("SELECT * FROM club_config WHERE id = 1").fetchone()
        return dict(fila) if fila else dict(_DEFAULTS)
    finally:
        conexion.close()


def guardar_config(nombre_yape, telefono_yape, monto_multa_tardanza=None, monto_multa_no_asistio=None):
    actual = obtener_config()
    monto_multa_tardanza = actual["monto_multa_tardanza"] if monto_multa_tardanza is None else monto_multa_tardanza
    monto_multa_no_asistio = actual["monto_multa_no_asistio"] if monto_multa_no_asistio is None else monto_multa_no_asistio
    conexion = get_connection()
    try:
        conexion.execute(
            """
            INSERT INTO club_config (id, nombre_yape, telefono_yape, monto_multa_tardanza, monto_multa_no_asistio)
            VALUES (1, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET nombre_yape = excluded.nombre_yape,
                telefono_yape = excluded.telefono_yape,
                monto_multa_tardanza = excluded.monto_multa_tardanza,
                monto_multa_no_asistio = excluded.monto_multa_no_asistio
            """,
            (nombre_yape.strip(), telefono_yape.strip(), monto_multa_tardanza, monto_multa_no_asistio),
        )
        conexion.commit()
    finally:
        conexion.close()
