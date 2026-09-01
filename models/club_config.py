"""Datos del club para la pantalla de pago (Yape del presidente/tesorero).
Fila única (id = 1)."""

from database.connection import get_connection


def obtener_config():
    conexion = get_connection()
    try:
        fila = conexion.execute("SELECT * FROM club_config WHERE id = 1").fetchone()
        return dict(fila) if fila else {"nombre_yape": "", "telefono_yape": ""}
    finally:
        conexion.close()


def guardar_config(nombre_yape, telefono_yape):
    conexion = get_connection()
    try:
        conexion.execute(
            """
            INSERT INTO club_config (id, nombre_yape, telefono_yape) VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET nombre_yape = excluded.nombre_yape,
                telefono_yape = excluded.telefono_yape
            """,
            (nombre_yape.strip(), telefono_yape.strip()),
        )
        conexion.commit()
    finally:
        conexion.close()
